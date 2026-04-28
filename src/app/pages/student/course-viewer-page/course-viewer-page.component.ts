import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import {
  CourseStore,
  CourseStoreType,
} from '../../../entities/course/model/course.store';
import { LessonItem } from '../../../entities/course/model/course.types';
import { LessonViewerComponent } from '../../../features/course/lesson-viewer/lesson-viewer.component';
import { QuizPlayerComponent } from '../../../features/reasoning/quiz-player/quiz-player.component';
import { AdaptivePlanTimelineComponent } from '../../../features/reasoning/adaptive-plan-timeline/adaptive-plan-timeline.component';
import {
  QuizStore,
  QuizStoreType,
} from '../../../entities/assessment/model/quiz.store';
import { AttemptApiService } from '../../../entities/assessment/api/attempt.api';
import {
  AttemptAnswerInput,
  AttemptResultResponse,
  AttemptAdaptiveFallback,
  AttemptAdaptivePending,
} from '../../../entities/assessment/model/attempt.types';
import { AdaptivePlanResponse } from '../../../entities/reasoning/model/reasoning.types';
import { firstValueFrom } from 'rxjs';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { ProctoringMonitorComponent } from '../../../features/proctoring/proctoring-monitor.component';
import { AttemptAnswerBreakdownComponent } from '../../../features/assessment/attempt-answer-breakdown/attempt-answer-breakdown.component';

@Component({
  selector: 'app-course-viewer-page',
  imports: [
    CommonModule,
    Button,
    SkeletonModule,
    LessonViewerComponent,
    QuizPlayerComponent,
    AdaptivePlanTimelineComponent,
    ProctoringMonitorComponent,
    AttemptAnswerBreakdownComponent,
  ],
  templateUrl: './course-viewer-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseViewerPageComponent {
  @ViewChild(ProctoringMonitorComponent)
  proctoringMonitor?: ProctoringMonitorComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly courseStore = inject(CourseStore) as CourseStoreType;
  readonly quizStore = inject(QuizStore) as QuizStoreType;
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  private readonly attemptApi = inject(AttemptApiService);

  readonly selectedLesson = signal<LessonItem | null>(null);
  readonly selectedQuizId = signal<number | null>(null);
  readonly submittedAttempt = signal<AttemptResultResponse | null>(null);

  readonly courseName = computed(
    () => this.courseStore.selectedCourseDetail()?.name ?? 'Cargando curso...',
  );
  readonly courseModules = computed(
    () => this.courseStore.selectedCourseDetail()?.modules ?? [],
  );

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const courseIdString = params.get('courseId');
      if (courseIdString) {
        const cId = Number(courseIdString);
        this.courseStore.selectCourse(cId);
        void this.courseStore.loadCourseDetail(cId);
        void this.courseStore.loadCourseQuizzes(cId);
      }
    });
  }

  selectLesson(lesson: LessonItem): void {
    this.selectedQuizId.set(null);
    this.submittedAttempt.set(null);
    this.selectedLesson.set(lesson);
  }

  selectQuiz(quizId: number): void {
    this.selectedLesson.set(null);
    this.submittedAttempt.set(null);
    this.selectedQuizId.set(quizId);
    void this.quizStore.loadQuizDetail(quizId);
  }

  async onQuizSubmitted(answers: AttemptAnswerInput[]): Promise<void> {
    const quizId = this.selectedQuizId();
    const studentId = this.sessionStore.userId();
    if (!quizId || !studentId) return;

    try {
      const attempt = await firstValueFrom(
        this.attemptApi.submitAttempt({
          quizId,
          studentId,
          answers,
        }),
      );
      if (this.proctoringMonitor) {
        await this.proctoringMonitor.finalize(attempt.id);
        await this.proctoringMonitor.stop();
      }
      this.selectedQuizId.set(null);
      this.submittedAttempt.set(attempt);
    } catch (err) {
      console.error('Error submitting quiz', err);
    }
  }

  async onQuizCancelled(): Promise<void> {
    if (this.proctoringMonitor) {
      await this.proctoringMonitor.stop();
    }
    this.selectedQuizId.set(null);
  }

  closeResult(): void {
    this.submittedAttempt.set(null);
  }

  goBack(): void {
    void this.router.navigate(['/student']);
  }

  getAttemptPlanStatus(
    attempt: AttemptResultResponse,
  ): 'success' | 'fallback' | 'pending' | 'none' {
    const plan = attempt.adaptive_plan;
    if (!plan) return 'none';
    if ((plan as AdaptivePlanResponse).items !== undefined) return 'success';
    if ((plan as AttemptAdaptiveFallback).fallback === true) return 'fallback';
    if ((plan as AttemptAdaptivePending).job_id !== undefined) return 'pending';
    return 'none';
  }

  getAttemptPlanItems(attempt: AttemptResultResponse) {
    const plan = attempt.adaptive_plan as AdaptivePlanResponse | null;
    return plan?.items ?? [];
  }

  getAttemptPlanLatencyMs(attempt: AttemptResultResponse): number | null {
    const plan = attempt.adaptive_plan as AdaptivePlanResponse | null;
    return plan?._meta?.llm_latency_ms ?? null;
  }
}
