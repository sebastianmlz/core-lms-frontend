import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ReasoningApiService } from '../api/reasoning.api';
import { AdaptivePlanInput, ReasoningState } from './reasoning.types';

const initialState: ReasoningState = {
  adaptivePlan: null,
  cognitiveGraph: null,
  isLoadingPlan: false,
  isLoadingGraph: false,
  error: null,
};

export const ReasoningStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    planItemsCount: computed(() => store.adaptivePlan()?.items.length ?? 0),
    graphNodeCount: computed(() => store.cognitiveGraph()?.nodes.length ?? 0),
  })),
  withMethods((store, reasoningApi = inject(ReasoningApiService)) => ({
    async generateAdaptivePlan(input: AdaptivePlanInput): Promise<void> {
      patchState(store, { isLoadingPlan: true, error: null });

      try {
        const plan = await firstValueFrom(reasoningApi.generateAdaptivePlan(input));
        patchState(store, {
          adaptivePlan: plan,
          isLoadingPlan: false,
        });
      } catch {
        patchState(store, {
          isLoadingPlan: false,
          error: 'No se pudo generar el plan adaptativo.',
        });
      }
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
      patchState(store, { adaptivePlan: null });
    },
    clearGraph(): void {
      patchState(store, { cognitiveGraph: null });
    },
  })),
);

export type ReasoningStoreType = InstanceType<typeof ReasoningStore>;
