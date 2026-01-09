import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { jwtDecode } from 'jwt-decode';
import { CartService } from './cart';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);
  private apiUrl = 'http://localhost:5000/api/auth';

  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUser.set({ ...decoded.user, token });
      } catch (e) {
        this.logout();
      }
    }
  }

  requestOtp(email: string) {
    return this.http.post(`${this.apiUrl}/request-otp`, { email });
  }

  register(userData: any) {
    return this.http
      .post<{ token: string; user: User }>(`${this.apiUrl}/register`, userData)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  login(credentials: any) {
    // This returns an observable that might contain { requiresOtp: true } or { token: string }
    return this.http.post<any>(`${this.apiUrl}/login`, credentials);
  }

  getProfile() {
    const token = this.getToken();
    const headers = new HttpHeaders().set('x-auth-token', token || '');
    return this.http.get<User>(`${this.apiUrl}/me`, { headers });
  }

  handleAuthSuccess(res: { token: string; user: User }) {
    sessionStorage.setItem('token', res.token);
    this.currentUser.set({ ...res.user, token: res.token });
  }

  logout() {
    sessionStorage.removeItem('token');
    this.currentUser.set(null);
    this.cartService.clearCart();
    this.router.navigate(['/home']);
  }

  getToken() {
    return sessionStorage.getItem('token');
  }
}
