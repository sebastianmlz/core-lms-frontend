import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { API_TARGET } from '../http-context.tokens';
import { baseUrlInterceptor } from './base-url.interceptor';

describe('baseUrlInterceptor', () => {
  let httpClient: HttpClient;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should prepend django base url', () => {
    httpClient
      .get('/api/v1/health/', {
        context: new HttpContext().set(API_TARGET, 'django'),
      })
      .subscribe();

    const req = httpController.expectOne(`${environment.djangoApiUrl}/api/v1/health/`);
    expect(req.request.headers.has('X-Request-ID')).toBe(true);
    req.flush({ status: 'ok' });
  });

  it('should prepend axiom base url', () => {
    httpClient
      .get('/health', {
        context: new HttpContext().set(API_TARGET, 'axiom'),
      })
      .subscribe();

    const req = httpController.expectOne(`${environment.axiomApiUrl}/health`);
    expect(req.request.headers.has('X-Request-ID')).toBe(true);
    req.flush({ status: 'ok' });
  });
});
