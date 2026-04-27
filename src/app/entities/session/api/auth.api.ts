import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import {
  RefreshTokenResponse,
  TokenPairResponse,
} from '../model/session.types';

interface LoginRequest {
  username: string;
  password: string;
}

interface RefreshRequest {
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly djangoApi = inject(DjangoApiClient);

  login(payload: LoginRequest): Observable<TokenPairResponse> {
    return this.djangoApi.post<TokenPairResponse, LoginRequest>(
      '/api/v1/auth/token/',
      payload,
      {
        skipAuth: true,
        skipRefresh: true,
      },
    );
  }

  refreshToken(refresh: string): Observable<RefreshTokenResponse> {
    return this.djangoApi.post<RefreshTokenResponse, RefreshRequest>(
      '/api/v1/auth/token/refresh/',
      { refresh },
      {
        skipAuth: true,
        skipRefresh: true,
      },
    );
  }
}
