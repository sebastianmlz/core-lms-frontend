import { HttpContextToken } from '@angular/common/http';

export type ApiTarget = 'django' | 'axiom';

export const API_TARGET = new HttpContextToken<ApiTarget>(() => 'django');
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
export const SKIP_REFRESH = new HttpContextToken<boolean>(() => false);
