import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { User } from '../models/user.model';
import { CartService } from './cart';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);

  private apiUrl = 'http://localhost:5000/api/auth';

  // State managed via Signals
  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // On app startup, check if we have a valid session cookie
    this.checkSession();
  }

  /**
   * Verified if the user has a valid HttpOnly cookie session
   */
  private checkSession() {
    this.getProfile().subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.currentUser.set(null),
    });
  }

  requestOtp(email: string) {
    return this.http.post(`${this.apiUrl}/request-otp`, { email }, { withCredentials: true });
  }

  register(userData: any) {
    return this.http
      .post<any>(`${this.apiUrl}/register`, userData, { withCredentials: true })
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  login(credentials: any) {
    // Note: Token is now handled by the browser via HttpOnly cookies
    return this.http.post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((res) => {
        if (!res.requiresOtp) {
          this.currentUser.set(res.user);
        }
      })
    );
  }

  getProfile() {
    // This call sends the HttpOnly cookie automatically thanks to withCredentials
    return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true });
  }

  logout() {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUser.set(null);
          this.cartService.clearCart();
          this.router.navigate(['/home']);
        }),
        catchError(() => {
          // Force logout even if server call fails
          this.currentUser.set(null);
          this.router.navigate(['/home']);
          return of(null);
        })
      )
      .subscribe();
  }

  // Helper used by interceptor or guards
  getToken() {
    // With HttpOnly cookies, we don't have a token to return manually
    // The browser handles it. We return a dummy or null.
    return null;
  }
}
