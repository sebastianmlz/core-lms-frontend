import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { API_TARGET } from '../http-context.tokens';

const absoluteUrlPattern = /^https?:\/\//i;

function buildRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const baseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (absoluteUrlPattern.test(request.url)) {
    return next(request);
  }

  const target = request.context.get(API_TARGET);
  const baseUrl = target === 'axiom' ? environment.axiomApiUrl : environment.djangoApiUrl;
  const path = request.url.startsWith('/') ? request.url : `/${request.url}`;


  const enrichedRequest = request.clone({
    url: `${baseUrl}${path}`,
    // Eliminado X-Request-ID para evitar problemas de CORS
  });

  return next(enrichedRequest);
};
