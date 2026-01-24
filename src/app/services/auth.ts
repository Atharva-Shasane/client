import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';
import { CartService } from './cart';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);
  private apiUrl = 'http://localhost:5000/api/auth';

  // Timer reference to handle the strict 1-hour logout
  private sessionTimeoutTimer: any;

  // State managed via Signals
  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // We no longer call checkSession here because APP_INITIALIZER will handle it
    // during the bootstrap process to prevent race conditions with Guards.
  }

  /**
   * Verified if the user has a valid HttpOnly cookie session
   * This is now returned as a Promise so the APP_INITIALIZER can wait for it.
   */
  async checkSession(): Promise<void> {
    try {
      // We use firstValueFrom to convert the Observable to a Promise
      const user = await firstValueFrom(this.getProfile());
      if (user) {
        this.currentUser.set(user);
        this.startSessionCountdown();
      }
    } catch (error) {
      this.currentUser.set(null);
      this.stopSessionCountdown();
    }
  }

  /**
   * Starts a 1-hour countdown. When time is up, it triggers a logout.
   */
  private startSessionCountdown() {
    this.stopSessionCountdown(); // Clear any existing timer

    // 3600000 ms = 1 Hour
    this.sessionTimeoutTimer = setTimeout(() => {
      console.warn('Session safety limit reached (1 hour). Auto-logging out.');
      this.logout();
    }, 3600000);
  }

  private stopSessionCountdown() {
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
    }
  }

  requestOtp(email: string) {
    return this.http.post(`${this.apiUrl}/request-otp`, { email }, { withCredentials: true });
  }

  register(userData: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, userData, { withCredentials: true }).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        this.startSessionCountdown();
      }),
    );
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((res) => {
        if (!res.requiresOtp) {
          this.currentUser.set(res.user);
          this.startSessionCountdown();
        }
      }),
    );
  }

  getProfile() {
    // withCredentials: true ensures the HttpOnly cookie is sent to verify identity
    return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true });
  }

  logout() {
    this.stopSessionCountdown();
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.performLocalCleanup();
        }),
        catchError(() => {
          this.performLocalCleanup();
          return of(null);
        }),
      )
      .subscribe();
  }

  private performLocalCleanup() {
    this.currentUser.set(null);
    this.cartService.clearCart();
    this.router.navigate(['/home']);
  }

  // Helper used by interceptor or guards
  getToken() {
    // With HttpOnly cookies, we don't handle the token manually in JS
    return null;
  }
}
