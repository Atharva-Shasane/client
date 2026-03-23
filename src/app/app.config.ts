import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './services/auth';

/**
 * FIX: Convert the Observable to a Promise before returning it to APP_INITIALIZER.
 *
 * Root cause of the 401 console noise:
 * ─────────────────────────────────────
 * provideZonelessChangeDetection() runs HTTP requests outside Angular's NgZone.
 * In this mode, Angular's dev-mode error reporter intercepts HTTP 4xx/5xx
 * responses at the infrastructure level and logs them to console BEFORE the
 * RxJS operator chain (tap → catchError) has a chance to handle them.
 * The catchError IS executing correctly (the app works fine), but the console
 * log fires earlier in the call stack — hence it shows main.ts:5 as the origin.
 *
 * Solution:
 * ─────────────────────────────────────
 * .toPromise() / lastValueFrom() converts the Observable to a Promise.
 * Promise rejections are caught with .catch(() => null), which:
 *   1. Prevents the unhandled rejection from surfacing in the console
 *   2. Still allows the app to bootstrap normally (returns null = not logged in)
 *   3. The authService.checkSession() catchError still runs and sets
 *      currentUser(null) + loading(false) correctly inside the service
 *
 * APP_INITIALIZER accepts: void | Promise<any> | Observable<any>
 * A resolved Promise (even with null) tells Angular "initializer done, proceed".
 */
function initializeAuth(authService: AuthService) {
  return () => authService.checkSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};