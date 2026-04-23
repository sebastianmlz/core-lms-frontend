import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { VarkOnboardingRequest, VarkOnboardingResponse } from '../model/user.types';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly client = inject(DjangoApiClient);

  submitVarkOnboarding(userId: number, payload: VarkOnboardingRequest): Observable<VarkOnboardingResponse> {
    return this.client.post<VarkOnboardingResponse, VarkOnboardingRequest>(`/api/v1/users/${userId}/onboard/`, payload);
  }
}
