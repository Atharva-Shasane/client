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
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Reactive state signal - Public to allow .set() in interceptors and profile
  currentUser = signal<User | null>(null);
  loading = signal<boolean>(true);

  // Computed signal for login status
  isLoggedIn = computed(() => !!this.currentUser());

  private readonly httpOptions = { withCredentials: true };

  constructor() {
    this.checkAuth();
  }

  /**
   * Alias for checkAuth to satisfy app.config.ts
   */
  checkSession() {
    return this.checkAuth();
  }

  checkAuth() {
    return this.http
      .get<User>(`${this.apiUrl}/me`, this.httpOptions)
      .pipe(
        tap((user) => this.currentUser.set(user)),
        catchError(() => {
          this.currentUser.set(null);
          return of(null);
        }),
        tap(() => this.loading.set(false))
      )
      .subscribe();
  }

  /**
   * Satisfies profile.ts requirement
   */
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
    const u = this.currentUser();
    return !!u && u.role === 'OWNER';
  }
}