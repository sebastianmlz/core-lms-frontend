import { ChangeDetectionStrategy, Component, effect, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { Select } from 'primeng/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { QuizStore, QuizStoreType } from '../../../entities/assessment/model/quiz.store';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { ReasoningStore, ReasoningStoreType } from '../../../entities/reasoning/model/reasoning.store';
import { SessionStore, SessionStoreType } from '../../../entities/session/model/session.store';
import { AttemptAnswerInput } from '../../../entities/assessment/model/attempt.types';
import { extractJwtPayload } from '../../../shared/lib/auth/jwt.utils';
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
