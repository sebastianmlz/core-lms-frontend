import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../../../entities/session/model/session.store';
import { API_TARGET, SKIP_AUTH } from '../http-context.tokens';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_AUTH) || request.context.get(API_TARGET) !== 'django') {
    return next(request);
  }

  const sessionStore = inject(SessionStore);
  const accessToken = sessionStore.accessToken();

  if (!accessToken) {
    return next(request);
  }

  const authenticatedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(authenticatedRequest);
};
