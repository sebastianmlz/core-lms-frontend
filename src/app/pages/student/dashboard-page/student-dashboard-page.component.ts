import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

import { CourseOverviewComponent } from '../../../features/course/course-overview/course-overview.component';
import { OnboardingModalComponent } from '../../../features/user/onboarding-modal/onboarding-modal.component';
import { AdaptivePlanTimelineComponent } from '../../../features/reasoning/adaptive-plan-timeline/adaptive-plan-timeline.component';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import {
  CourseStore,
  CourseStoreType,
} from '../../../entities/course/model/course.store';
import { AttemptApiService } from '../../../entities/assessment/api/attempt.api';
import {
  AttemptResultResponse,
  AttemptAdaptiveFallback,
  AttemptAdaptivePending,
} from '../../../entities/assessment/model/attempt.types';
import { AdaptivePlanResponse } from '../../../entities/reasoning/model/reasoning.types';

@Component({
  selector: 'app-student-dashboard-page',
  imports: [
    CommonModule,
    CourseOverviewComponent,
    OnboardingModalComponent,
    AdaptivePlanTimelineComponent,
    TagModule,
    SkeletonModule,
  ],
  templateUrl: './student-dashboard-page.component.html',
  styleUrl: './student-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardPageComponent implements OnInit {
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  readonly courseStore = inject(CourseStore) as CourseStoreType;
  private readonly attemptApi = inject(AttemptApiService);

  readonly activeCoursesCount = computed(
    () => this.courseStore.courses()?.length || 0,
  );

  readonly dominantProfile = computed(() => {
    const vark = this.sessionStore.dominantVark();
    if (!vark) return 'Evaluando...';
    const spanishMap: Record<string, string> = {
      visual: 'Visual',
      aural: 'Auditivo',
      auditory: 'Auditivo',
      read_write: 'Lecto-Escritura',
      kinesthetic: 'Kinestésico',
    };
    return spanishMap[vark] || vark;
  });

  readonly accuracyMetric = signal(82);

  readonly attempts = signal<AttemptResultResponse[]>([]);
  readonly isLoadingAttempts = signal(false);
  readonly expandedAttemptId = signal<number | null>(null);

  ngOnInit(): void {
    void this.loadAttempts();
  }

  private async loadAttempts(): Promise<void> {
    this.isLoadingAttempts.set(true);
    try {
      const response = await firstValueFrom(this.attemptApi.listAttempts());
      this.attempts.set(response.results ?? []);
    } catch {
      this.attempts.set([]);
    } finally {
      this.isLoadingAttempts.set(false);
    }
  }

  togglePlan(attemptId: number): void {
    this.expandedAttemptId.update((current) =>
      current === attemptId ? null : attemptId,
    );
  }

  classifyPlan(
    attempt: AttemptResultResponse,
  ): 'success' | 'fallback' | 'pending' | 'none' {
    const plan = attempt.adaptive_plan;
    if (!plan) return 'none';
    if ((plan as AdaptivePlanResponse).items !== undefined) return 'success';
    if ((plan as AttemptAdaptiveFallback).fallback === true) return 'fallback';
    if ((plan as AttemptAdaptivePending).job_id !== undefined) return 'pending';
    return 'none';
  }

  planItems(attempt: AttemptResultResponse) {
    const plan = attempt.adaptive_plan as AdaptivePlanResponse | null;
    return plan?.items ?? [];
  }

  planLatencyMs(attempt: AttemptResultResponse): number | null {
    const plan = attempt.adaptive_plan as AdaptivePlanResponse | null;
    return plan?._meta?.llm_latency_ms ?? null;
  }
}
