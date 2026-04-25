import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DjangoApiClient,
  RequestParamValue,
} from '../../../shared/api/django-api.client';
import {
  PaginatedResponse,
  QuizDetailResponse,
  QuizListResponse,
} from '../model/quiz.types';

@Injectable({ providedIn: 'root' })
export class QuizApiService {
  private readonly djangoApi = inject(DjangoApiClient);

  getQuizzes(courseId?: number): Observable<QuizListResponse[]> {
    const params: Record<string, RequestParamValue> = {};
    if (courseId) params['course'] = courseId;
    return this.djangoApi
      .get<
        PaginatedResponse<QuizListResponse[]>
      >('/api/v1/quizzes/', { params })
      .pipe(map((response) => response.results));
  }

  getQuizDetail(quizId: number): Observable<QuizDetailResponse> {
    return this.djangoApi.get<QuizDetailResponse>(`/api/v1/quizzes/${quizId}/`);
  }

  createQuiz(payload: unknown): Observable<QuizDetailResponse> {
    return this.djangoApi.post<QuizDetailResponse, unknown>(
      '/api/v1/quizzes/',
      payload,
    );
  }

  deleteQuiz(quizId: number): Observable<void> {
    return this.djangoApi.delete<void>(`/api/v1/quizzes/${quizId}/`);
  }
}
