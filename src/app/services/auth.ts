import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(null);
  loading     = signal<boolean>(true);

  // FIX 1: isLoggedIn must remain a computed signal (correct as-is)
  isLoggedIn = computed(() => !!this.currentUser());

  private readonly httpOptions = { withCredentials: true };

  constructor() {
    // FIX 2: Do NOT call checkAuth() in the constructor.
    // app.config.ts calls checkSession() as an APP_INITIALIZER which already
    // runs checkAuth() once before the app renders. Calling it again here means
    // two simultaneous GET /api/auth/me requests fire on every page load —
    // the second one's 401 error propagates outside the catchError pipe because
    // app.config.ts subscribes to the Observable returned by checkSession()
    // separately, creating a second subscriber that doesn't share the catchError.
    // Removing the constructor call eliminates the duplicate request and the
    // console error entirely.
  }

  /**
   * Called once by APP_INITIALIZER in app.config.ts before the app renders.
   * Returns an Observable so app.config.ts can await completion before routing.
   *
   * FIX 3: Return the Observable itself (not .subscribe() inside the method).
   * When checkAuth() called .subscribe() internally AND app.config.ts also
   * subscribed to the return value, two subscriptions were created for the same
   * HTTP call. Only one shared the catchError — the other surfaced the 401 raw.
   * Now the caller (app.config.ts) is the single subscriber.
   */
  checkSession(): Observable<User | null> {
    return this.http
      .get<User>(`${this.apiUrl}/me`, this.httpOptions)
      .pipe(
        tap((user) => {
          this.currentUser.set(user);
          this.loading.set(false);
        }),
        catchError((err) => {
          // 401 = expected when no session exists — suppress console noise
          // Log anything else (500, network error) as it's a real problem
          if (err.status !== 401) {
            console.error('[AuthService] Unexpected session check error:', err.message);
          }
          this.currentUser.set(null);
          this.loading.set(false);
          return of(null);
        })
      );
    // NOTE: No .subscribe() here — app.config.ts subscribes via APP_INITIALIZER
  }

  // Kept as an alias for any internal callers that used checkAuth() directly
  checkAuth(): Observable<User | null> {
    return this.checkSession();
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, this.httpOptions);
  }

  requestOtp(email: string) {
    return this.http.post(`${this.apiUrl}/request-otp`, { email }, this.httpOptions);
  }

  register(data: any) {
    return this.http
      .post<{ user: User }>(`${this.apiUrl}/register`, data, this.httpOptions)
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  login(data: any) {
    return this.http
      .post<{ user?: User; requiresOtp?: boolean; msg?: string }>(
        `${this.apiUrl}/login`,
        data,
        this.httpOptions
      )
      .pipe(
        tap((res) => {
          if (res.user) {
            this.currentUser.set(res.user);
          }
        })
      );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, this.httpOptions).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      })
    );
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'OWNER';
  }
}