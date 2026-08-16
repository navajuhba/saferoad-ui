import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionAuthService } from '../services/session.service';

/**
 * authGuard
 * Protects authenticated routes from unauthorized access
 * If user has valid session -> allow navigation
 * If session invalid/expired -> redirect to login
 */
export const authGuard: CanActivateFn = (route, state) => {
  const sessionAuthService = inject(SessionAuthService);
  const router = inject(Router);

  // Check if user has valid session
  if (sessionAuthService.hasValidSession() || sessionAuthService.isLoggedIn()) {
    // Refresh session expiry to keep user logged in while active
    sessionAuthService.refreshSession();
    return true;
  }

  // No valid session - redirect to login
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};

/**
 * loginGuard
 * Prevents logged-in users from accessing login/register pages
 * If user already logged in -> redirect to dashboard
 * If not logged in -> allow access to login page
 */
export const loginGuard: CanActivateFn = (route, state) => {
  const sessionAuthService = inject(SessionAuthService);
  const router = inject(Router);

  // If user has valid session, redirect to dashboard
  if (sessionAuthService.hasValidSession() || sessionAuthService.isLoggedIn()) {
    router.navigate(['/dashboard']);
    return false;
  }

  // No valid session - allow access to login page
  return true;
};
