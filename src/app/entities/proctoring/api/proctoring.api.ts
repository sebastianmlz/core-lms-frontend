import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import {
  ProctoringBulkRequest,
  ProctoringBulkResponse,
} from '../model/proctoring.types';

@Injectable({ providedIn: 'root' })
export class ProctoringApiService {
  private readonly djangoApi = inject(DjangoApiClient);

  ingestEvents(
    payload: ProctoringBulkRequest,
  ): Observable<ProctoringBulkResponse> {
    return this.djangoApi.post<ProctoringBulkResponse, ProctoringBulkRequest>(
      '/api/v1/proctoring/logs/',
      payload,
    );
  }
}
