import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
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

  // State managed via Signals (Matches naming used in Guards and Interceptors)
  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // Initial session check is handled via APP_INITIALIZER in app.config.ts
  }

  /**
   * Check if user has an active session on app load
   */
  checkSession(): void {
    this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true }).subscribe({
      next: (user) => {
        if (user) {
          this.currentUser.set(user);
          this.startSessionCountdown();
        }
      },
      error: () => this.currentUser.set(null)
    });
  }

  private startSessionCountdown() {
    this.stopSessionCountdown();
    this.sessionTimeoutTimer = setTimeout(() => {
      this.logout().subscribe();
    }, 3600000); // 1 hour
  }

  private stopSessionCountdown() {
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
    }
  }

  requestOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-otp`, { email }, { withCredentials: true });
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.user) {
          this.currentUser.set(res.user);
          this.startSessionCountdown();
        }
      })
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((res) => {
        if (!res.requiresOtp && res.user) {
          this.currentUser.set(res.user);
          this.startSessionCountdown();
        }
      })
    );
  }

  /**
   * Used by Profile page to fetch fresh data
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.performLocalCleanup();
      })
    );
  }

  private performLocalCleanup() {
    this.stopSessionCountdown();
    this.currentUser.set(null);
    this.cartService.clearCart();
    this.router.navigate(['/home']);
  }

  // Helper for manual token handling (though HttpOnly is used)
  getToken() {
    return null;
  }
}