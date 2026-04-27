import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_TARGET, SKIP_AUTH, SKIP_REFRESH } from './http-context.tokens';

export type RequestParamValue = string | number | boolean | undefined | null;

export interface ApiClientOptions {
  params?: Record<string, RequestParamValue>;
  headers?: Record<string, string>;
  context?: HttpContext;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DjangoApiClient {
  private readonly http = inject(HttpClient);

  get<TResponse>(
    url: string,
    options: ApiClientOptions = {},
  ): Observable<TResponse> {
    return this.http.get<TResponse>(url, this.buildOptions(options));
  }

  post<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    options: ApiClientOptions = {},
  ): Observable<TResponse> {
    return this.http.post<TResponse>(url, body, this.buildOptions(options));
  }

  patch<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    options: ApiClientOptions = {},
  ): Observable<TResponse> {
    return this.http.patch<TResponse>(url, body, this.buildOptions(options));
  }

  delete<TResponse>(
    url: string,
    options: ApiClientOptions = {},
  ): Observable<TResponse> {
    return this.http.delete<TResponse>(url, this.buildOptions(options));
  }

  private buildOptions(options: ApiClientOptions) {
    const context = (options.context ?? new HttpContext())
      .set(API_TARGET, 'django')
      .set(SKIP_AUTH, options.skipAuth ?? false)
      .set(SKIP_REFRESH, options.skipRefresh ?? false);

    const params = this.normalizeParams(options.params);

    return {
      context,
      params,
      headers: new HttpHeaders(options.headers ?? {}),
    };
  }

  private normalizeParams(params?: Record<string, RequestParamValue>) {
    if (!params) {
      return undefined;
    }

    return Object.entries(params).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }

        return acc;
      },
      {},
    );
  }
}
