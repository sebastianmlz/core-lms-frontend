import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const details =
          typeof error.error === 'object' && error.error !== null
            ? JSON.stringify(error.error)
            : String(error.error ?? '');

        console.error('HTTP request failed', {
          method: request.method,
          url: request.url,
          status: error.status,
          details,
        });
      }

      return throwError(() => error);
    }),
  );
