import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { AttemptApiService } from '../../../entities/assessment/api/attempt.api';
import { ProctoringApiService } from '../../../entities/proctoring/api/proctoring.api';
import { AttemptAnswerBreakdownComponent } from '../../assessment/attempt-answer-breakdown/attempt-answer-breakdown.component';
import {
  AttemptResultResponse,
  AttemptAdaptiveFallback,
  AttemptAdaptivePending,
} from '../../../entities/assessment/model/attempt.types';
import { ProctoringLogItem } from '../../../entities/proctoring/model/proctoring.types';
import { AdaptivePlanResponse } from '../../../entities/reasoning/model/reasoning.types';

interface AttemptCard {
  attempt: AttemptResultResponse;
  planStatus: 'success' | 'fallback' | 'pending' | 'none';
}

@Component({
  selector: 'app-student-attempt-detail',
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    ButtonModule,
    AttemptAnswerBreakdownComponent,
  ],
  templateUrl: './student-attempt-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttemptDetailComponent implements OnChanges {
  @Input({ required: true }) studentId!: number;
  @Input({ required: true }) studentName!: string;
  @Input() courseId: number | null = null;

  private readonly attemptApi = inject(AttemptApiService);
  private readonly proctoringApi = inject(ProctoringApiService);

  readonly cards = signal<AttemptCard[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** ID of the attempt whose proctoring panel is open, or null if all collapsed */
  readonly expandedAttemptId = signal<number | null>(null);
  /**
   * Cached proctoring logs keyed by attempt ID.
   * A key present with an empty array means "loaded, no events."
   * A missing key means "not yet fetched."
   */
  readonly proctoringCache = signal<Record<number, ProctoringLogItem[]>>({});
  /** ID of the attempt currently fetching proctoring logs, or null */
  readonly loadingProctoringId = signal<number | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId'] && this.studentId) {
      this.cards.set([]);
      this.error.set(null);
      this.expandedAttemptId.set(null);
      this.proctoringCache.set({});
      this.loadingProctoringId.set(null);
      void this.loadAttempts();
    }
  }

  private async loadAttempts(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.attemptApi.listAttemptsByStudent(this.studentId),
      );
      this.cards.set(
        (response.results ?? []).map((a) => ({
          attempt: a,
          planStatus: this.classifyPlan(a),
        })),
      );
    } catch {
      this.error.set('No se pudieron cargar los intentos del alumno.');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleProctoring(attemptId: number): void {
    if (this.expandedAttemptId() === attemptId) {
      this.expandedAttemptId.set(null);
      return;
    }
    this.expandedAttemptId.set(attemptId);
    // Only fetch if not already in cache (undefined = not yet loaded)
    if (this.proctoringCache()[attemptId] === undefined) {
      void this.loadProctoringEvents(attemptId);
    }
  }

  private async loadProctoringEvents(attemptId: number): Promise<void> {
    this.loadingProctoringId.set(attemptId);
    try {
      const response = await firstValueFrom(
        this.proctoringApi.getLogsByAttempt(attemptId),
      );
      this.proctoringCache.update((cache) => ({
        ...cache,
        [attemptId]: response.results ?? [],
      }));
    } catch {
      this.proctoringCache.update((cache) => ({ ...cache, [attemptId]: [] }));
    } finally {
      this.loadingProctoringId.set(null);
    }
  }

  severityLabel(score: number): string {
    if (score >= 0.8) return 'ALTO';
    if (score >= 0.4) return 'MEDIO';
    return 'BAJO';
  }

  eventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      tab_switched: 'Cambio de Pestaña',
      fullscreen_exit: 'Salida de Pantalla Completa',
      face_not_detected: 'Rostro No Detectado',
      multiple_faces: 'Múltiples Rostros',
    };
    return labels[type] ?? type;
  }

  eventTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      tab_switched: 'pi pi-external-link',
      fullscreen_exit: 'pi pi-window-minimize',
      face_not_detected: 'pi pi-eye-slash',
      multiple_faces: 'pi pi-users',
    };
    return icons[type] ?? 'pi pi-bell';
  }

  private classifyPlan(
    attempt: AttemptResultResponse,
  ): 'success' | 'fallback' | 'pending' | 'none' {
    const plan = attempt.adaptive_plan;
    if (!plan) return 'none';
    if ((plan as AdaptivePlanResponse).items !== undefined) return 'success';
    if ((plan as AttemptAdaptiveFallback).fallback === true) return 'fallback';
    if ((plan as AttemptAdaptivePending).job_id !== undefined) return 'pending';
    return 'none';
  }
}
