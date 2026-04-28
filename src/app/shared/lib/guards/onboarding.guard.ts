import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../../../entities/session/model/session.store';

/**
 * Intercepts navigation to protected student sub-routes when the student
 * has not completed VARK onboarding (dominantVark is null).
 *
 * Redirects to the student dashboard root where the onboarding modal lives.
 * Tutors are always allowed through since onboarding is student-only.
 */
export const varkOnboardingGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  const role = sessionStore.activeRole();
  const vark = sessionStore.dominantVark();

  // Tutors never need onboarding
  if (role !== 'STUDENT') {
    return true;
  }

  // Student has completed onboarding
  if (vark) {
    return true;
  }

  // Redirect to student dashboard where the onboarding modal will appear
  return router.createUrlTree(['/student']);
};
