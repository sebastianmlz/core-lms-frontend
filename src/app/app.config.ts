import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { apiErrorInterceptor } from './shared/api/interceptors/api-error.interceptor';
import { authInterceptor } from './shared/api/interceptors/auth.interceptor';
import { baseUrlInterceptor } from './shared/api/interceptors/base-url.interceptor';
import { refreshTokenInterceptor } from './shared/api/interceptors/refresh-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    MessageService,
    provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        authInterceptor,
        refreshTokenInterceptor,
        apiErrorInterceptor,
      ]),
    ),
    providePrimeNG({ 
        theme: { 
          preset: Aura,
          options: {
            darkModeSelector: 'none',
            cssLayer: {
                name: 'primeng',
                order: 'tailwind-base, primeng, tailwind-utilities'
            }
          }
        }
    })
  ]
};