import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AttemptApiService } from '../../../entities/assessment/api/attempt.api';
import {
  AttemptResultResponse,
  AttemptAdaptiveFallback,
  AttemptAdaptivePending,
} from '../../../entities/assessment/model/attempt.types';
import {
  AdaptivePlanResponse,
  AdaptivePlanItem,
} from '../../../entities/reasoning/model/reasoning.types';
import { AdaptivePlanTimelineComponent } from '../../../features/reasoning/adaptive-plan-timeline/adaptive-plan-timeline.component';

interface AttemptRow {
  id: number;
  quiz: number;
  start_time: string;
  end_time: string | null;
  is_submitted: boolean;
  final_score: string | null;
  planStatus: 'success' | 'fallback' | 'pending' | 'none';
}

@Component({
  selector: 'app-student-attempts-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    AdaptivePlanTimelineComponent,
  ],
  templateUrl: './student-attempts-page.component.html',
  styleUrl: './student-attempts-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttemptsPageComponent implements OnInit {
  private readonly attemptApi = inject(AttemptApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly attempts = signal<AttemptResultResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly count = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly hasNext = signal<boolean>(false);
  readonly hasPrevious = signal<boolean>(false);

  // Detail mode
  readonly selectedAttempt = signal<AttemptResultResponse | null>(null);
  readonly isLoadingDetail = signal<boolean>(false);
  readonly showPlan = signal<boolean>(false);

  readonly planItems = computed<AdaptivePlanItem[]>(() => {
    const attempt = this.selectedAttempt();
    if (!attempt || !attempt.adaptive_plan) return [];
    // Only return items if the plan is a success response
    const plan = attempt.adaptive_plan as AdaptivePlanResponse;
    return plan.items || [];
  });

  readonly planMeta = computed(() => {
    const attempt = this.selectedAttempt();
    if (!attempt || !attempt.adaptive_plan) return null;
    return (attempt.adaptive_plan as AdaptivePlanResponse)._meta || null;
  });

  readonly rows = computed<AttemptRow[]>(() =>
    this.attempts().map((a) => ({
      id: a.id,
      quiz: a.quiz,
      start_time: a.start_time,
      end_time: a.end_time,
      is_submitted: a.is_submitted,
      final_score: a.final_score,
      planStatus: this.classifyPlan(a),
    })),
  );

  ngOnInit(): void {
    const attemptIdParam = this.route.snapshot.paramMap.get('attemptId');
    if (attemptIdParam) {
      void this.loadDetail(Number(attemptIdParam));
    } else {
      void this.load(1);
    }
  }

  async loadDetail(attemptId: number): Promise<void> {
    this.isLoadingDetail.set(true);
    this.error.set(null);
    try {
      const attempt = await firstValueFrom(
        this.attemptApi.getAttempt(attemptId),
      );
      this.selectedAttempt.set(attempt);
    } catch {
      this.error.set('No se pudo cargar el detalle del intento.');
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  async load(page: number): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.attemptApi.listAttempts(page));
      this.attempts.set(response.results);
      this.count.set(response.count);
      this.hasNext.set(!!response.next);
      this.hasPrevious.set(!!response.previous);
      this.currentPage.set(page);
    } catch {
      this.error.set('No se pudo cargar el historial de intentos.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openAttempt(attemptId: number): void {
    void this.router.navigate(['/student/attempts', attemptId]);
  }

  backToList(): void {
    this.selectedAttempt.set(null);
    this.showPlan.set(false);
    void this.router.navigate(['/student/attempts']);
  }

  togglePlan(): void {
    this.showPlan.update((v) => !v);
  }

  next(): void {
    if (this.hasNext()) {
      void this.load(this.currentPage() + 1);
    }
  }

  prev(): void {
    if (this.hasPrevious() && this.currentPage() > 1) {
      void this.load(this.currentPage() - 1);
    }
  }

  classifyPlan(
    attempt: AttemptResultResponse,
  ): 'success' | 'fallback' | 'pending' | 'none' {
    const plan = attempt.adaptive_plan;
    if (!plan) {
      return 'none';
    }
    if ((plan as AdaptivePlanResponse).items !== undefined) {
      return 'success';
    }
    if ((plan as AttemptAdaptiveFallback).fallback === true) {
      return 'fallback';
    }
    if ((plan as AttemptAdaptivePending).job_id !== undefined) {
      return 'pending';
    }
    return 'none';
  }
}
