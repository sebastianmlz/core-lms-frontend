import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DiagnosticOrchestratorComponent } from '../diagnostic-orchestrator/diagnostic-orchestrator.component';

/**
 * AdaptivePlanFormComponent — Now a thin shell wrapping DiagnosticOrchestratorComponent.
 * Kept for backwards compatibility with existing page references.
 */
@Component({
  selector: 'app-adaptive-plan-form',
  imports: [DiagnosticOrchestratorComponent],
  template: `<app-diagnostic-orchestrator />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdaptivePlanFormComponent {}
