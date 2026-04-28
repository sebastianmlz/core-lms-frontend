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
import {
  QuizStore,
  QuizStoreType,
} from '../../../entities/assessment/model/quiz.store';
import { AttemptApiService } from '../../../entities/assessment/api/attempt.api';
import { AttemptAnswerInput } from '../../../entities/assessment/model/attempt.types';
import {
  ReasoningStore,
  ReasoningStoreType,
} from '../../../entities/reasoning/model/reasoning.store';
import { firstValueFrom } from 'rxjs';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { ProctoringMonitorComponent } from '../../../features/proctoring/proctoring-monitor.component';

@Component({
  selector: 'app-course-viewer-page',
  imports: [
    CommonModule,
    Button,
    SkeletonModule,
    LessonViewerComponent,
    QuizPlayerComponent,
    ProctoringMonitorComponent,
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
  readonly reasoningStore = inject(ReasoningStore) as ReasoningStoreType;
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  private readonly attemptApi = inject(AttemptApiService);

  readonly selectedLesson = signal<LessonItem | null>(null);
  readonly selectedQuizId = signal<number | null>(null);

  // Deriva el nombre del curso activo
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
    this.selectedLesson.set(lesson);
  }

  selectQuiz(quizId: number): void {
    this.selectedLesson.set(null);
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
      // Sella los eventos de proctoring buffered con el attempt.id real
      // y dispara el flush bulk antes de cerrar el monitor.
      if (this.proctoringMonitor) {
        await this.proctoringMonitor.finalize(attempt.id);
        await this.proctoringMonitor.stop();
      }
      this.selectedQuizId.set(null);
      // Al terminar el quiz, redirigimos al dashboard para ver el resultado y la ruta
      void this.router.navigate(['/student'], {
        queryParams: { attemptId: attempt.id },
      });
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

  goBack(): void {
    void this.router.navigate(['/student']);
  }
}
