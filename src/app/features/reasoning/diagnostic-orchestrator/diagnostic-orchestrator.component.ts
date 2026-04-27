import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval } from 'rxjs';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  QuizStore,
  QuizStoreType,
} from '../../../entities/assessment/model/quiz.store';
import {
  ReasoningStore,
  ReasoningStoreType,
} from '../../../entities/reasoning/model/reasoning.store';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import {
  CourseStore,
  CourseStoreType,
} from '../../../entities/course/model/course.store';
import { GlobalToastService } from '../../../shared/lib/services/toast.service';
import { AttemptAnswerInput } from '../../../entities/assessment/model/attempt.types';
import { extractJwtPayload } from '../../../shared/lib/auth/jwt.utils';

import { QuizPlayerComponent } from '../quiz-player/quiz-player.component';
import { AdaptivePlanTimelineComponent } from '../adaptive-plan-timeline/adaptive-plan-timeline.component';
import { CognitiveShadowComponent } from '../cognitive-shadow/cognitive-shadow.component';

type OrchestratorStep = 'select' | 'quiz' | 'waiting' | 'result';

/**
 * DiagnosticOrchestratorComponent — Smart container.
 * Coordinates the full diagnostic flow:
 *   [select quiz] → [answer quiz] → [waiting for AI] → [show plan + graph]
 * Consumes ReasoningStore and dispatches to sub-components.
 */
@Component({
  selector: 'app-diagnostic-orchestrator',
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    ProgressSpinnerModule,
    SkeletonModule,
    QuizPlayerComponent,
    AdaptivePlanTimelineComponent,
    CognitiveShadowComponent,
  ],
  templateUrl: './diagnostic-orchestrator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticOrchestratorComponent {
  @Input() showCognitiveShadow = true;

  private readonly fb = inject(FormBuilder);
  readonly reasoningStore = inject(ReasoningStore) as ReasoningStoreType;
  readonly quizStore = inject(QuizStore) as QuizStoreType;
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  readonly courseStore = inject(CourseStore) as CourseStoreType;
  private readonly toast = inject(GlobalToastService);

  readonly step = signal<OrchestratorStep>('select');

  readonly form = this.fb.group({
    quizId: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]),
  });

  readonly quizIdSignal = toSignal(this.form.controls.quizId.valueChanges, {
    initialValue: null,
  });

  readonly filteredQuizzes = computed(() => {
    const allQuizzes = this.quizStore.quizzes();
    const selectedCourseId = this.courseStore.selectedCourseId();
    if (!selectedCourseId) return allQuizzes;
    return allQuizzes.filter((q) => q.course === selectedCourseId);
  });

  constructor() {
    // Initial load of quizzes
    void this.quizStore.loadQuizzes();

    // Pre-fill student ID from JWT
    effect(() => {
      const token = this.sessionStore.accessToken();
      if (!token) return;
      const payload = extractJwtPayload(token);
      const uid = payload?.['user_id'];
      if (uid && typeof uid === 'number') {
        this._studentId = uid;
      }
    });

    // Load quiz detail when selection changes
    effect(() => {
      const quizId = this.quizIdSignal();
      if (quizId) {
        void this.quizStore.loadQuizDetail(quizId);
      } else {
        this.quizStore.clearQuizDetail();
      }
    });

    // Auto long-polling while pending/fallback
    effect((onCleanup) => {
      const status = this.reasoningStore.diagnosticStatus();
      if (status === 'pending' || status === 'fallback') {
        const sub = interval(4000).subscribe(() => {
          void this.refreshSilent();
        });
        onCleanup(() => sub.unsubscribe());
      }
    });

    // Reset quiz selection when course changes
    effect(() => {
      const courseId = this.courseStore.selectedCourseId();
      if (courseId) {
        this.form.controls.quizId.setValue(null);
      }
    });

    // Advance to result step when plan arrives
    effect(() => {
      const status = this.reasoningStore.diagnosticStatus();
      if (status === 'success') {
        this.step.set('result');
        this.toast.success(
          'Ruta Adaptativa lista',
          'El motor IA procesó tu evaluación.',
        );

        // Auto-load cognitive graph
        const plan = this.reasoningStore.adaptivePlan();
        if (plan && this.showCognitiveShadow) {
          const topics = plan.items.map((i) => i.topic);
          if (topics.length > 0 && this._studentId) {
            void this.reasoningStore.loadCognitiveGraph(
              String(this._studentId),
              topics,
            );
          }
        }
      }
      if (status === 'error') {
        const err = this.reasoningStore.error();
        this.toast.error('Error en el diagnóstico', err ?? undefined);
        this.step.set('select');
      }
    });
  }

  private _studentId: number | null = null;

  get selectedQuiz() {
    return this.quizStore.selectedQuizDetail();
  }

  selectQuiz(): void {
    const quizId = this.form.controls.quizId.value;
    if (!quizId || !this.quizStore.selectedQuizDetail()) return;
    this.step.set('quiz');
  }

  async onQuizSubmitted(answers: AttemptAnswerInput[]): Promise<void> {
    if (!this._studentId) {
      this.toast.error(
        'Error de sesión',
        'No se pudo obtener el ID del estudiante.',
      );
      return;
    }
    const quizId = this.form.controls.quizId.value;
    if (!quizId) return;

    this.step.set('waiting');
    await this.reasoningStore.runDiagnosticFromAttempt({
      quizId,
      studentId: this._studentId,
      answers,
    });
  }

  onQuizCancelled(): void {
    this.step.set('select');
  }

  reset(): void {
    this.reasoningStore.clearPlan();
    this.form.reset();
    this.step.set('select');
  }

  private async refreshSilent(): Promise<void> {
    const attemptId = this.reasoningStore.lastAttemptId();
    if (!attemptId) return;
    await this.reasoningStore.refreshAttemptResult(attemptId, { silent: true });
  }
}
