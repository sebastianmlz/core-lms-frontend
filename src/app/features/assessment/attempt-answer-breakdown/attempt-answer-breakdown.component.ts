import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttemptAnswerDetail } from '../../../entities/assessment/model/attempt.types';

@Component({
  selector: 'app-attempt-answer-breakdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attempt-answer-breakdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttemptAnswerBreakdownComponent {
  private readonly answersSignal = signal<AttemptAnswerDetail[]>([]);

  @Input() set answers(value: AttemptAnswerDetail[] | null | undefined) {
    this.answersSignal.set(value ?? []);
  }

  readonly items = computed(() => this.answersSignal());
  readonly hasItems = computed(() => this.items().length > 0);
  readonly correctCount = computed(
    () => this.items().filter((a) => a.is_correct).length,
  );
  readonly totalCount = computed(() => this.items().length);
}
