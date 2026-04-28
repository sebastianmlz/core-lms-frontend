import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
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
 * Renders a quiz's questions, emits selected answers, and enforces
 * the quiz `time_limit_minutes` via a countdown timer that auto-submits
 * (with whatever the student has answered) when time runs out.
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
export class QuizPlayerComponent implements OnInit, OnDestroy {
  @Input() quiz!: QuizDetailResponse;
  @Input() isSubmitting = false;

  @Output() submitted = new EventEmitter<AttemptAnswerInput[]>();
  @Output() cancelled = new EventEmitter<void>();

  readonly selectedAnswers = signal<Record<number, number>>({});
  readonly remainingSeconds = signal<number | null>(null);

  readonly timeWarning = computed(() => {
    const remaining = this.remainingSeconds();
    return remaining !== null && remaining <= 60;
  });

  private timerHandle: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const limit = this.quiz?.time_limit_minutes;
    if (typeof limit === 'number' && limit > 0) {
      this.remainingSeconds.set(limit * 60);
      this.timerHandle = setInterval(() => {
        const next = (this.remainingSeconds() ?? 0) - 1;
        if (next <= 0) {
          this.remainingSeconds.set(0);
          this.stopTimer();
          // Autosubmit at timeout regardless of completion: backend
          // accepts partial answers and the user must not lose progress.
          this.forceSubmit();
        } else {
          this.remainingSeconds.set(next);
        }
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

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

  get timeDisplay(): string {
    const remaining = this.remainingSeconds();
    if (remaining === null) {
      return '';
    }
    const minutes = Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  onAnswerSelected(questionId: number, choiceId: number): void {
    this.selectedAnswers.update((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  }

  submit(): void {
    if (!this.allAnswered || this.isSubmitting) return;
    this.emitAnswers();
  }

  cancel(): void {
    this.stopTimer();
    this.cancelled.emit();
  }

  private forceSubmit(): void {
    if (this.isSubmitting) {
      return;
    }
    this.emitAnswers();
  }

  private emitAnswers(): void {
    const answers: AttemptAnswerInput[] = Object.entries(
      this.selectedAnswers(),
    ).map(([qId, cId]) => ({
      question_id: Number(qId),
      selected_choice_id: cId,
    }));
    this.submitted.emit(answers);
  }

  private stopTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }
}
