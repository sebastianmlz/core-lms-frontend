import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { PaginatedResponse, QuizDetailResponse, QuizListResponse } from '../model/quiz.types';

@Injectable({ providedIn: 'root' })
export class QuizApiService {
  private readonly djangoApi = inject(DjangoApiClient);

  getQuizzes(): Observable<QuizListResponse[]> {
    return this.djangoApi.get<PaginatedResponse<QuizListResponse[]>>('/api/v1/quizzes/').pipe(
      map((response) => response.results)
    );
  }

  getQuizDetail(quizId: number): Observable<QuizDetailResponse> {
    return this.djangoApi.get<QuizDetailResponse>(`/api/v1/quizzes/${quizId}/`);
  }
}
