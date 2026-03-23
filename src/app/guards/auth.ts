import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { filter, map, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * FIX: The original guard read isLoggedIn() synchronously.
 * On a hard refresh of a protected route, checkSession() hasn't resolved yet
 * (it's async HTTP), so currentUser is still null and loading is still true.
 * The guard would see isLoggedIn() = false and redirect to /login immediately,
 * even for a fully authenticated user.
 *
 * Fix: Wait for loading to become false before evaluating isLoggedIn().
 * toObservable(authService.loading) converts the signal to an Observable,
 * then we filter for loading=false (session check complete), take(1) to
 * complete after the first resolved value, and map to the auth decision.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // If loading is already done (e.g. navigating after initial load), fast-path
  if (!authService.loading()) {
    if (authService.isLoggedIn()) return true;
    router.navigate(['/login']);
    return false;
  }

  // Wait for the session check to complete, then decide
  return toObservable(authService.loading).pipe(
    filter((loading) => !loading),   // wait until loading = false
    take(1),                          // complete after first emission
    map(() => {
      if (authService.isLoggedIn()) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};

/**
 * Owner-only guard — same loading-aware pattern
 */
export const ownerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.loading()) {
    if (authService.isAdmin()) return true;
    router.navigate(['/home']);
    return false;
  }

  return toObservable(authService.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (authService.isAdmin()) return true;
      router.navigate(['/home']);
      return false;
    })
  );
};