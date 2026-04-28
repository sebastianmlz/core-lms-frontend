import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { PaginatedResponse } from '../../../shared/lib/models/pagination.types';
import {
  ProctoringBulkRequest,
  ProctoringBulkResponse,
  ProctoringLogItem,
} from '../model/proctoring.types';

@Injectable({ providedIn: 'root' })
export class ProctoringApiService {
  private readonly djangoApi = inject(DjangoApiClient);

  /** Student: bulk-ingest proctoring events captured during a quiz attempt */
  ingestEvents(
    payload: ProctoringBulkRequest,
  ): Observable<ProctoringBulkResponse> {
    return this.djangoApi.post<ProctoringBulkResponse, ProctoringBulkRequest>(
      '/api/v1/proctoring/logs/',
      payload,
    );
  }

  /** Tutor: retrieve all logged events for a specific attempt, sorted by timestamp */
  getLogsByAttempt(
    attemptId: number,
  ): Observable<PaginatedResponse<ProctoringLogItem>> {
    return this.djangoApi.get<PaginatedResponse<ProctoringLogItem>>(
      '/api/v1/proctoring/logs/',
      { params: { attempt: attemptId } },
    );
  }
}
