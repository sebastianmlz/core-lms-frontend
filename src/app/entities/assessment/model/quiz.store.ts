import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { QuizApiService } from '../api/quiz.api';
import { QuizDetailResponse, QuizListResponse } from './quiz.types';

interface QuizState {
  quizzes: QuizListResponse[];
  selectedQuizDetail: QuizDetailResponse | null;
  isLoadingQuizzes: boolean;
  isLoadingDetail: boolean;
  error: string | null;
}

const initialState: QuizState = {
  quizzes: [],
  selectedQuizDetail: null,
  isLoadingQuizzes: false,
  isLoadingDetail: false,
  error: null,
};

export const QuizStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, quizApi = inject(QuizApiService)) => ({
    async loadQuizzes(): Promise<void> {
      patchState(store, { isLoadingQuizzes: true, error: null });
      try {
        const quizzes = await firstValueFrom(quizApi.getQuizzes());
        patchState(store, { quizzes, isLoadingQuizzes: false });
      } catch {
        patchState(store, { isLoadingQuizzes: false, error: 'Failed to load quizzes' });
      }
    },
    async loadQuizDetail(quizId: number): Promise<void> {
      patchState(store, { isLoadingDetail: true, error: null, selectedQuizDetail: null });
      try {
        const detail = await firstValueFrom(quizApi.getQuizDetail(quizId));
        patchState(store, { selectedQuizDetail: detail, isLoadingDetail: false });
      } catch {
        patchState(store, { isLoadingDetail: false, error: 'Failed to load quiz details' });
      }
    },
    clearQuizDetail(): void {
      patchState(store, { selectedQuizDetail: null, error: null });
    },
  })),
);

export type QuizStoreType = InstanceType<typeof QuizStore>;
