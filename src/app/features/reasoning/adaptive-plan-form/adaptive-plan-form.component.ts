import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import {
  AttemptAnswerInput,
  AttemptSubmitInput,
} from '../../../entities/assessment/model/attempt.types';
import {
  CourseStore,
  CourseStoreType,
} from '../../../entities/course/model/course.store';
import {
  ReasoningStore,
  ReasoningStoreType,
} from '../../../entities/reasoning/model/reasoning.store';
import { AdaptivePlanItem } from '../../../entities/reasoning/model/reasoning.types';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { extractJwtPayload } from '../../../shared/lib/auth/jwt.utils';

@Component({
  selector: 'app-adaptive-plan-form',
  imports: [ReactiveFormsModule, Button, ProgressSpinnerModule, SkeletonModule],
  templateUrl: './adaptive-plan-form.component.html',
  styleUrl: './adaptive-plan-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdaptivePlanFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly reasoningStore = inject(ReasoningStore) as ReasoningStoreType;
  readonly courseStore = inject(CourseStore) as CourseStoreType;
  readonly sessionStore = inject(SessionStore) as SessionStoreType;

  private lastDashboardCourseId: number | null = null;
  parseError: string | null = null;

  readonly form = this.formBuilder.group({
    studentId: this.formBuilder.nonNullable.control('', [Validators.required]),
    quizId: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    answersJson: this.formBuilder.nonNullable.control(
      '[\n  {"question_id": 1, "selected_choice_id": 1}\n]',
      [Validators.required],
    ),
  });

  constructor() {
    effect(() => {
      const token = this.sessionStore.accessToken();
      const userId = this.extractUserIdFromToken(token);

      if (!userId) {
        return;
      }

      const studentControl = this.form.controls.studentId;
      if (!studentControl.value) {
        studentControl.setValue(String(userId));
      }
    });

    effect(() => {
      const selectedCourseId = this.courseStore.selectedCourseId();

      if (!selectedCourseId || this.lastDashboardCourseId === selectedCourseId) {
        return;
      }

      this.lastDashboardCourseId = selectedCourseId;
      void this.courseStore.loadCourseDashboard(selectedCourseId);
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.reasoningStore.isLoadingPlan()) {
      this.form.markAllAsTouched();
      return;
    }

    this.parseError = null;

    const studentId = Number(this.form.controls.studentId.value);
    const quizId = this.form.controls.quizId.value;
    const answers = this.parseAnswers(this.form.controls.answersJson.value);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      this.parseError = 'Student ID debe ser un entero positivo.';
      return;
    }

    if (typeof quizId !== 'number' || !Number.isInteger(quizId) || quizId <= 0) {
      this.parseError = 'Quiz ID debe ser un entero positivo.';
      return;
    }

    if (!answers) {
      this.parseError =
        'Answers JSON invalido. Usa un arreglo como: [{"question_id":1,"selected_choice_id":2}].';
      return;
    }

    const payload: AttemptSubmitInput = {
      studentId,
      quizId,
      answers,
    };

    await this.reasoningStore.runDiagnosticFromAttempt(payload);
  }

  async refreshAttemptStatus(): Promise<void> {
    const attemptId = this.reasoningStore.lastAttemptId();

    if (!attemptId || this.reasoningStore.isLoadingPlan()) {
      return;
    }

    await this.reasoningStore.refreshAttemptResult(attemptId);
  }

  trackByTopic(index: number, item: AdaptivePlanItem): string {
    return `${item.topic}-${index}`;
  }

  private extractUserIdFromToken(accessToken: string | null): number | null {
    if (!accessToken) {
      return null;
    }

    const payload = extractJwtPayload(accessToken);
    const rawUserId = payload?.['user_id'];

    if (typeof rawUserId === 'number' && Number.isInteger(rawUserId) && rawUserId > 0) {
      return rawUserId;
    }

    if (typeof rawUserId === 'string') {
      const parsed = Number(rawUserId);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

  private parseAnswers(rawJson: string): AttemptAnswerInput[] | null {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return null;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }

    const normalized = parsed
      .map((entry) => {
        if (typeof entry !== 'object' || entry === null) {
          return null;
        }

        const candidate = entry as Record<string, unknown>;
        const questionId = Number(candidate['question_id']);
        const selectedChoiceId = Number(candidate['selected_choice_id']);

        if (!Number.isInteger(questionId) || questionId <= 0) {
          return null;
        }

        if (!Number.isInteger(selectedChoiceId) || selectedChoiceId <= 0) {
          return null;
        }

        return {
          question_id: questionId,
          selected_choice_id: selectedChoiceId,
        } satisfies AttemptAnswerInput;
      })
      .filter((entry): entry is AttemptAnswerInput => entry !== null);

    if (normalized.length !== parsed.length) {
      return null;
    }

    return normalized;
  }
}
