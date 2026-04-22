import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { AuthApiService } from '../../../entities/session/api/auth.api';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { API_TARGET, SKIP_AUTH, SKIP_REFRESH } from '../http-context.tokens';

let refreshInFlight$: Observable<string | null> | null = null;

function getOrCreateRefreshStream(
  authApi: AuthApiService,
  sessionStore: SessionStoreType,
): Observable<string | null> {
  if (refreshInFlight$) {
    return refreshInFlight$;
  }

  const refreshToken = sessionStore.refreshToken();
  if (!refreshToken) {
    return of(null);
  }

  refreshInFlight$ = authApi.refreshToken(refreshToken).pipe(
    map((response) => response.access),
    map((newAccessToken) => {
      sessionStore.updateAccessToken(newAccessToken);
      return newAccessToken;
    }),
    catchError(() => {
      sessionStore.logout();
      return of(null);
    }),
    finalize(() => {
      refreshInFlight$ = null;
    }),
    shareReplay(1),
  );

  return refreshInFlight$;
}

export const refreshTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (
    request.context.get(SKIP_REFRESH) ||
    request.context.get(SKIP_AUTH) ||
    request.context.get(API_TARGET) !== 'django'
  ) {
    return next(request);
  }

  const authApi = inject(AuthApiService);
  const sessionStore = inject(SessionStore) as SessionStoreType;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (request.url.includes('/api/v1/auth/token/')) {
        return throwError(() => error);
      }

      return getOrCreateRefreshStream(authApi, sessionStore).pipe(
        switchMap((newAccessToken) => {
          if (!newAccessToken) {
            return throwError(() => error);
          }

          const retriedRequest = request.clone({
            context: request.context.set(SKIP_REFRESH, true),
            setHeaders: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          return next(retriedRequest);
        }),
      );
    }),
  );
};
