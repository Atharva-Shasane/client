import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router'; // ✅ Import Router
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router); // ✅ Inject Router
  private apiUrl = 'http://localhost:5000/api/auth';

  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUser.set({ ...decoded.user, token });
      } catch (e) {
        this.logout();
      }
    }
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  register(userData: any) {
    return this.http
      .post<{ token: string; user: User }>(`${this.apiUrl}/register`, userData)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  login(credentials: any) {
    return this.http
      .post<{ token: string; user: User }>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  getProfile() {
    return this.http.get<User>(`${this.apiUrl}/me`, { headers: this.getAuthHeaders() });
  }

  private handleAuthSuccess(res: { token: string; user: User }) {
    localStorage.setItem('token', res.token);
    this.currentUser.set({ ...res.user, token: res.token });
  }

  // ✅ UPDATED: Logout now redirects to Home
  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/home']); // Redirect immediately
  }

  getToken() {
    return localStorage.getItem('token');
  }
}
