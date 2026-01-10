import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from './services/toast';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // 1. CRITICAL SECURITY UPDATE:
  // withCredentials: true tells the browser to include HttpOnly cookies
  // and handle the "Set-Cookie" header from the server.
  const secureReq = req.clone({
    withCredentials: true,
  });

  return next(secureReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 2. Globally handle session expiry (401)
      if (error.status === 401) {
        // If we were logged in but now unauthorized, clear the state
        if (authService.isLoggedIn()) {
          authService.currentUser.set(null);
          toast.error('Session expired. Please login again.');
          router.navigate(['/login']);
        }
      }
      // 3. Handle Permission Denied (403)
      else if (error.status === 403) {
        toast.error('Access Denied: Owner privileges required.');
      }
      // 4. Handle Rate Limiting (429)
      else if (error.status === 429) {
        toast.error('Too many requests. Please wait a moment.');
      }

      return throwError(() => error);
    })
  );
};
