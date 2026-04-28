import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AxiomApiClient } from '../../../shared/api/axiom-api.client';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { backendToAxiomVark } from '../../../shared/lib/vark/vark.utils';
import {
  AdaptivePlanInput,
  AdaptivePlanResponse,
  CognitiveGraphResponse,
} from '../model/reasoning.types';

interface AdaptivePlanRequest {
  student_id: string;
  course_id: string;
  failed_topics: string[];
  vark_profile: string;
  telemetry: {
    session_id: string;
    timestamp_unix: number;
    client_version: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ReasoningApiService {
  private readonly axiomApi = inject(AxiomApiClient);
  private readonly djangoApi = inject(DjangoApiClient);

  generateAdaptivePlan(
    input: AdaptivePlanInput,
  ): Observable<AdaptivePlanResponse> {
    const payload: AdaptivePlanRequest = {
      student_id: input.studentId,
      course_id: input.courseId,
      failed_topics: input.failedTopics,
      vark_profile: backendToAxiomVark(input.varkProfile),
      telemetry: {
        session_id: `ui-${Date.now()}`,
        timestamp_unix: Math.floor(Date.now() / 1000),
        client_version: 'frontend-1.0.0',
      },
    };

    return this.axiomApi.post<AdaptivePlanResponse, AdaptivePlanRequest>(
      '/api/v1/adaptive-plan',
      payload,
    );
  }

  /**
   * Fetches the cognitive shadow graph through the Django proxy
   * (`/api/v1/cognitive-graph/graph/`). The proxy enforces JWT + IsTutor
   * before forwarding to the Go reasoning service with a shared-secret
   * header, so the Go endpoint is no longer reachable from the browser
   * even if its host leaks.
   */
  getCognitiveGraph(
    studentId: string,
    topics: string[],
    targetTopic?: string,
  ): Observable<CognitiveGraphResponse> {
    return this.djangoApi.get<CognitiveGraphResponse>(
      '/api/v1/cognitive-graph/graph/',
      {
        params: {
          student_id: studentId,
          topics: topics.join(','),
          target_topic: targetTopic,
        },
      },
    );
  }
}
