import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import {
  AttemptResultResponse,
  AttemptSubmitInput,
  AttemptSubmitRequest,
} from '../model/attempt.types';

@Injectable({ providedIn: 'root' })
export class AttemptApiService {
  private readonly djangoApi = inject(DjangoApiClient);

  submitAttempt(input: AttemptSubmitInput): Observable<AttemptResultResponse> {
    const payload: AttemptSubmitRequest = {
      quiz_id: input.quizId,
      student_id: input.studentId,
      answers: input.answers,
    };

    return this.djangoApi.post<AttemptResultResponse, AttemptSubmitRequest>('/api/v1/attempts/', payload);
  }

  getAttempt(attemptId: number): Observable<AttemptResultResponse> {
    return this.djangoApi.get<AttemptResultResponse>(`/api/v1/attempts/${attemptId}/`);
  }
}
