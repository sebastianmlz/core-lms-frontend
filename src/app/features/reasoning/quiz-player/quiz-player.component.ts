import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButton } from 'primeng/radiobutton';
import { Button } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { QuizDetailResponse } from '../../../entities/assessment/model/quiz.types';
import { AttemptAnswerInput } from '../../../entities/assessment/model/attempt.types';

/**
 * QuizPlayerComponent — Pure presentation component.
 * Renders a quiz's questions and emits selected answers.
 * Has zero store dependencies; fully reusable.
 */
@Component({
  selector: 'app-quiz-player',
  imports: [
    FormsModule,
    RadioButton,
    Button,
    SkeletonModule,
    ProgressBarModule,
  ],
  templateUrl: './quiz-player.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizPlayerComponent {
  @Input() quiz!: QuizDetailResponse;
  @Input() isSubmitting = false;

  @Output() submitted = new EventEmitter<AttemptAnswerInput[]>();
  @Output() cancelled = new EventEmitter<void>();

  readonly selectedAnswers = signal<Record<number, number>>({});

  get answeredCount(): number {
    return Object.keys(this.selectedAnswers()).length;
  }

  get totalQuestions(): number {
    return this.quiz?.questions?.length ?? 0;
  }

  get progressValue(): number {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.answeredCount / this.totalQuestions) * 100);
  }

  get allAnswered(): boolean {
    return (
      this.answeredCount === this.totalQuestions && this.totalQuestions > 0
    );
  }

  onAnswerSelected(questionId: number, choiceId: number): void {
    this.selectedAnswers.update((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  }

  submit(): void {
    if (!this.allAnswered || this.isSubmitting) return;

    const answers: AttemptAnswerInput[] = Object.entries(
      this.selectedAnswers(),
    ).map(([qId, cId]) => ({
      question_id: Number(qId),
      selected_choice_id: cId,
    }));

    this.submitted.emit(answers);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
