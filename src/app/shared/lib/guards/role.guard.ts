import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../../../entities/session/model/session.store';
import { UserRole } from '../../../entities/session/model/session.types';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  const requiredRole = route.data['role'] as UserRole | undefined;
  const currentRole = sessionStore.activeRole();

  if (!requiredRole || requiredRole === currentRole) {
    return true;
  }

  if (currentRole === 'TUTOR') {
    return router.createUrlTree(['/tutor']);
  }

  return router.createUrlTree(['/student']);
};
