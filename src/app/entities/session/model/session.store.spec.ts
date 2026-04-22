import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from '../api/auth.api';
import { SessionStore } from './session.store';

function buildJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('SessionStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should login and infer role from token payload', async () => {
    const authApiMock = {
      login: vi.fn().mockReturnValue(
        of({
          access: buildJwt({ role: 'TUTOR' }),
          refresh: 'refresh-token',
        }),
      ),
      refreshToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiMock },
      ],
    });

    const store = TestBed.inject(SessionStore);
    const success = await store.login({
      username: 'mentor',
      password: 'secret',
      preferredRole: 'STUDENT',
    });

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.activeRole()).toBe('TUTOR');
    expect(store.username()).toBe('mentor');
  });

  it('should fallback to preferred role when token has no role claim', async () => {
    const authApiMock = {
      login: vi.fn().mockReturnValue(
        of({
          access: buildJwt({ user_id: 7 }),
          refresh: 'refresh-token',
        }),
      ),
      refreshToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiMock },
      ],
    });

    const store = TestBed.inject(SessionStore);
    await store.login({
      username: 'student',
      password: 'secret',
      preferredRole: 'STUDENT',
    });

    expect(store.activeRole()).toBe('STUDENT');
  });
});
