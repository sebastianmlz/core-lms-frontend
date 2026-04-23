import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AttemptApiService } from '../../assessment/api/attempt.api';
import {
  AttemptAdaptiveFallback,
  AttemptResultResponse,
  AttemptSubmitInput,
} from '../../assessment/model/attempt.types';
import { ReasoningApiService } from '../api/reasoning.api';
import { AdaptivePlanInput, AdaptivePlanResponse, ReasoningState } from './reasoning.types';

const initialState: ReasoningState = {
  adaptivePlan: null,
  cognitiveGraph: null,
  isLoadingPlan: false,
  isLoadingGraph: false,
  diagnosticMode: 'sync',
  diagnosticStatus: 'idle',
  lastAttemptId: null,
  jobId: null,
  fallbackReason: null,
  error: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeJobId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isAdaptivePlanResponse(value: unknown): value is AdaptivePlanResponse {
  return isRecord(value) && Array.isArray(value['items']) && isRecord(value['_meta']);
}

function isAdaptivePlanFallback(value: unknown): value is AttemptAdaptiveFallback {
  return isRecord(value) && value['fallback'] === true;
}

function buildFallbackReason(fallbackEnvelope: AttemptAdaptiveFallback): string {
  if (typeof fallbackEnvelope.reason === 'string' && fallbackEnvelope.reason.trim().length > 0) {
    return fallbackEnvelope.reason;
  }

  return 'El backend retorno fallback temporal mientras prepara la ruta adaptativa.';
}

export const ReasoningStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    planItemsCount: computed(() => store.adaptivePlan()?.items.length ?? 0),
    graphNodeCount: computed(() => store.cognitiveGraph()?.nodes.length ?? 0),
    hasPendingDiagnostic: computed(() => store.diagnosticStatus() === 'pending'),
  })),
  withMethods(
    (store, reasoningApi = inject(ReasoningApiService), attemptApi = inject(AttemptApiService)) => ({
    async generateAdaptivePlan(input: AdaptivePlanInput): Promise<void> {
      patchState(store, {
        isLoadingPlan: true,
        diagnosticMode: 'sync',
        diagnosticStatus: 'loading',
        jobId: null,
        fallbackReason: null,
        error: null,
      });

      try {
        const plan = await firstValueFrom(reasoningApi.generateAdaptivePlan(input));
        patchState(store, {
          adaptivePlan: plan,
          isLoadingPlan: false,
          diagnosticStatus: 'success',
        });
      } catch {
        patchState(store, {
          isLoadingPlan: false,
          diagnosticStatus: 'error',
          error: 'No se pudo generar el plan adaptativo.',
        });
      }
    },
    async runDiagnosticFromAttempt(input: AttemptSubmitInput): Promise<void> {
      patchState(store, {
        isLoadingPlan: true,
        diagnosticMode: 'sync',
        diagnosticStatus: 'loading',
        adaptivePlan: null,
        fallbackReason: null,
        jobId: null,
        error: null,
      });

      try {
        const attempt = await firstValueFrom(attemptApi.submitAttempt(input));
        const jobId =
          normalizeJobId(attempt.job_id) ||
          (isRecord(attempt.adaptive_plan) ? normalizeJobId(attempt.adaptive_plan['job_id']) : null);

        if (jobId) {
          patchState(store, {
            isLoadingPlan: false,
            diagnosticMode: 'async',
            diagnosticStatus: 'pending',
            lastAttemptId: attempt.id,
            jobId,
          });
          return;
        }

        this.applyAttemptResult(attempt);
      } catch {
        patchState(store, {
          isLoadingPlan: false,
          diagnosticStatus: 'error',
          error: 'No se pudo enviar el intento diagnostico.',
        });
      }
    },
    async refreshAttemptResult(attemptId: number): Promise<void> {
      patchState(store, {
        isLoadingPlan: true,
        diagnosticStatus: 'loading',
        error: null,
      });

      try {
        const attempt = await firstValueFrom(attemptApi.getAttempt(attemptId));
        this.applyAttemptResult(attempt);
      } catch {
        patchState(store, {
          isLoadingPlan: false,
          diagnosticStatus: 'error',
          error: 'No se pudo reconsultar el estado del intento.',
        });
      }
    },
    applyAttemptResult(attempt: AttemptResultResponse): void {
      const adaptivePlan = attempt.adaptive_plan;

      if (isAdaptivePlanResponse(adaptivePlan)) {
        patchState(store, {
          adaptivePlan,
          isLoadingPlan: false,
          diagnosticMode: 'sync',
          diagnosticStatus: 'success',
          lastAttemptId: attempt.id,
          jobId: null,
          fallbackReason: null,
          error: null,
        });
        return;
      }

      if (isAdaptivePlanFallback(adaptivePlan)) {
        patchState(store, {
          adaptivePlan: null,
          isLoadingPlan: false,
          diagnosticMode: 'sync',
          diagnosticStatus: 'fallback',
          lastAttemptId: attempt.id,
          jobId: null,
          fallbackReason: buildFallbackReason(adaptivePlan),
          error: null,
        });
        return;
      }

      if (attempt.axiom_error) {
        patchState(store, {
          adaptivePlan: null,
          isLoadingPlan: false,
          diagnosticMode: 'sync',
          diagnosticStatus: 'error',
          lastAttemptId: attempt.id,
          error: attempt.axiom_error.details || 'El motor adaptativo retorno un error.',
        });
        return;
      }

      patchState(store, {
        adaptivePlan: null,
        isLoadingPlan: false,
        diagnosticMode: 'sync',
        diagnosticStatus: 'error',
        lastAttemptId: attempt.id,
        error: 'No se recibio un plan adaptativo valido para este intento.',
      });
    },
    async loadCognitiveGraph(studentId: string, topics: string[]): Promise<void> {
      patchState(store, { isLoadingGraph: true, error: null });

      try {
        const graph = await firstValueFrom(reasoningApi.getCognitiveGraph(studentId, topics));
        patchState(store, {
          cognitiveGraph: graph,
          isLoadingGraph: false,
        });
      } catch {
        patchState(store, {
          isLoadingGraph: false,
          error: 'No se pudo cargar la Sombra Cognitiva.',
        });
      }
    },
    clearPlan(): void {
      patchState(store, {
        adaptivePlan: null,
        diagnosticMode: 'sync',
        diagnosticStatus: 'idle',
        lastAttemptId: null,
        jobId: null,
        fallbackReason: null,
      });
    },
    clearGraph(): void {
      patchState(store, { cognitiveGraph: null });
    },
  }),
  ),
);

export type ReasoningStoreType = InstanceType<typeof ReasoningStore>;
