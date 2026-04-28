import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { AdaptivePlanResponse } from '../../../entities/reasoning/model/reasoning.types';

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
  ],
  templateUrl: './student-attempts-page.component.html',
  styleUrl: './student-attempts-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttemptsPageComponent implements OnInit {
  private readonly attemptApi = inject(AttemptApiService);
  private readonly router = inject(Router);

  readonly attempts = signal<AttemptResultResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly count = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly hasNext = signal<boolean>(false);
  readonly hasPrevious = signal<boolean>(false);

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
    void this.load(1);
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
    void this.router.navigate(['/student'], {
      queryParams: { attemptId },
    });
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

  private classifyPlan(
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
