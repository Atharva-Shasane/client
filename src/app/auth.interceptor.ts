import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth';
import { catchError, throwError, EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from './services/toast';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const toast       = inject(ToastService);

  const secureReq = req.clone({ withCredentials: true });

  return next(secureReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        // FIX: The /auth/me session check fires on every page load to restore
        // auth state. When no session cookie exists (user not logged in), the
        // server correctly returns 401. This is EXPECTED — not an error.
        //
        // Returning throwError() here re-throws the error back into Angular's
        // zoneless HTTP pipeline, which logs it to the console before any
        // RxJS catchError in the service or app.config.ts can intercept it.
        //
        // Solution: detect the /auth/me request by URL and return EMPTY instead
        // of throwError. EMPTY completes the observable silently with no value
        // and no error — Angular's pipeline sees a clean completion, nothing
        // gets logged, and checkSession()'s catchError still runs normally.
        if (req.url.includes('/auth/me')) {
          // Silent 401 on session check — user is simply not logged in yet.
          // The catchError in AuthService.checkSession() handles state cleanup.
          return EMPTY;
        }

        // For all other 401s (expired session mid-session), clear state + redirect
        if (authService.isLoggedIn()) {
          authService.currentUser.set(null);
          toast.error('Session expired. Please login again.');
          router.navigate(['/login']);
        }
      }

      else if (error.status === 403) {
        toast.error('Access Denied: Owner privileges required.');
      }

      else if (error.status === 429) {
        toast.error('Too many requests. Please wait a moment.');
      }

      return throwError(() => error);
    })
  );
};