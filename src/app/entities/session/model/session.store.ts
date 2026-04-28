import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { SESSION_STORAGE_KEYS } from '../../../shared/config/api.config';
import { extractJwtPayload } from '../../../shared/lib/auth/jwt.utils';
import { AuthApiService } from '../api/auth.api';
import { LoginCredentials, SessionState, UserRole } from './session.types';

const initialState: SessionState = {
  accessToken: null,
  refreshToken: null,
  activeRole: null,
  username: null,
  userId: null,
  dominantVark: null,
  isLoading: false,
  error: null,
};

function readStorageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
  } catch {
    // Storage is optional in test and private browser contexts.
  }
}

function parseDetailsFromToken(accessToken: string): {
  role: UserRole | null;
  userId: number | null;
  varkDominant: string | null;
} {
  const payload = extractJwtPayload(accessToken);
  const role =
    payload?.['role'] === 'STUDENT' || payload?.['role'] === 'TUTOR'
      ? payload['role']
      : null;
  const userId =
    typeof payload?.['user_id'] === 'number' ? payload['user_id'] : null;
  const rawVark = payload?.['vark_dominant'];
  const varkDominant =
    typeof rawVark === 'string' && rawVark.length > 0 ? rawVark : null;

  return { role, userId, varkDominant };
}

export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => Boolean(store.accessToken())),
  })),
  withMethods(
    (store, authApi = inject(AuthApiService), router = inject(Router)) => ({
      hydrate(): void {
        patchState(store, {
          accessToken: readStorageValue(SESSION_STORAGE_KEYS.accessToken),
          refreshToken: readStorageValue(SESSION_STORAGE_KEYS.refreshToken),
          activeRole:
            (readStorageValue(
              SESSION_STORAGE_KEYS.activeRole,
            ) as UserRole | null) ?? null,
          username: readStorageValue(SESSION_STORAGE_KEYS.username),
          userId: readStorageValue(SESSION_STORAGE_KEYS.userId)
            ? Number(readStorageValue(SESSION_STORAGE_KEYS.userId))
            : null,
          dominantVark: readStorageValue(SESSION_STORAGE_KEYS.dominantVark),
        });
      },
      async login(credentials: LoginCredentials): Promise<boolean> {
        patchState(store, { isLoading: true, error: null });

        try {
          const response = await firstValueFrom(
            authApi.login({
              username: credentials.username,
              password: credentials.password,
            }),
          );

          const parsedDetails = parseDetailsFromToken(response.access);
          const activeRole =
            response.user?.role ??
            response.role ??
            parsedDetails.role ??
            credentials.preferredRole;
          const userId =
            response.user?.id ?? response.user_id ?? parsedDetails.userId;
          const dominantVark =
            response.user?.vark_dominant ?? parsedDetails.varkDominant ?? null;
          const username = response.user?.username ?? credentials.username;

          writeStorageValue(SESSION_STORAGE_KEYS.accessToken, response.access);
          writeStorageValue(
            SESSION_STORAGE_KEYS.refreshToken,
            response.refresh,
          );
          writeStorageValue(SESSION_STORAGE_KEYS.activeRole, activeRole);
          writeStorageValue(SESSION_STORAGE_KEYS.username, username);
          writeStorageValue(
            SESSION_STORAGE_KEYS.userId,
            userId ? userId.toString() : null,
          );
          writeStorageValue(SESSION_STORAGE_KEYS.dominantVark, dominantVark);

          patchState(store, {
            accessToken: response.access,
            refreshToken: response.refresh,
            activeRole,
            username,
            userId,
            dominantVark,
            isLoading: false,
            error: null,
          });

          return true;
        } catch {
          patchState(store, {
            isLoading: false,
            error: 'No se pudo iniciar sesion. Verifica tus credenciales.',
          });

          return false;
        }
      },
      updateAccessToken(newAccessToken: string): void {
        writeStorageValue(SESSION_STORAGE_KEYS.accessToken, newAccessToken);
        patchState(store, { accessToken: newAccessToken });
      },
      setActiveRole(role: UserRole): void {
        writeStorageValue(SESSION_STORAGE_KEYS.activeRole, role);
        patchState(store, { activeRole: role });
      },
      setDominantVark(vark: string): void {
        writeStorageValue(SESSION_STORAGE_KEYS.dominantVark, vark);
        patchState(store, { dominantVark: vark });
      },
      logout(): void {
        writeStorageValue(SESSION_STORAGE_KEYS.accessToken, null);
        writeStorageValue(SESSION_STORAGE_KEYS.refreshToken, null);
        writeStorageValue(SESSION_STORAGE_KEYS.activeRole, null);
        writeStorageValue(SESSION_STORAGE_KEYS.username, null);
        writeStorageValue(SESSION_STORAGE_KEYS.userId, null);
        writeStorageValue(SESSION_STORAGE_KEYS.dominantVark, null);

        patchState(store, { ...initialState });
        void router.navigate(['/login']);
      },
    }),
  ),
);

export type SessionStoreType = InstanceType<typeof SessionStore>;
