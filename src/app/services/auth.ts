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

  isLoggedIn = computed(() => !!this.currentUser());

  private readonly httpOptions = { withCredentials: true };

  constructor() {}

  checkSession(): Observable<User | null> {
    return this.http
      .get<User>(`${this.apiUrl}/me`, this.httpOptions)
      .pipe(
        tap((user) => {
          this.currentUser.set(user);
          this.loading.set(false);
        }),
        catchError((err) => {
          if (err.status !== 401) {
            console.error('[AuthService] Unexpected session check error:', err.message);
          }
          this.currentUser.set(null);
          this.loading.set(false);
          return of(null);
        })
      );
  }

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