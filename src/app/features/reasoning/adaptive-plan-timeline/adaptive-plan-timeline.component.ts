import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Timeline } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { AdaptivePlanItem } from '../../../entities/reasoning/model/reasoning.types';
import { DiagnosticExecutionStatus } from '../../../entities/reasoning/model/reasoning.types';

/**
 * AdaptivePlanTimelineComponent — Pure presentation component.
 * Renders the p-timeline of plan items, with skeleton loading state.
 * Has zero store dependencies; fully reusable.
 */
@Component({
  selector: 'app-adaptive-plan-timeline',
  imports: [Timeline, SkeletonModule],
  templateUrl: './adaptive-plan-timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdaptivePlanTimelineComponent {
  @Input() items: AdaptivePlanItem[] = [];
  @Input() isLoading = false;
  @Input() status: DiagnosticExecutionStatus = 'idle';
  @Input() llmLatencyMs: number | null = null;
  @Input() lastAttemptId: number | null = null;

  readonly skeletonItems = [1, 2, 3];

  resourceIcon(type: string): string {
    const icons: Record<string, string> = {
      video: '📹',
      diagram: '🖼️',
      infographic: '📊',
      podcast: '🎧',
      lecture: '🎓',
      'audio-course': '🎵',
      article: '📄',
      textbook: '📚',
      documentation: '📑',
      exercise: '🏋️',
      lab: '🔬',
      'coding-challenge': '💻',
    };
    return icons[type] ?? '🔗';
  }
}
