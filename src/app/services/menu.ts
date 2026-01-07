import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MenuItem } from '../models/menu-item.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:5000/api/menu';

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  // Public: Get only available items
  getMenu() {
    return this.http.get<MenuItem[]>(this.apiUrl);
  }

  // Owner: Get ALL items (including unavailable)
  getAllMenuItems() {
    return this.http.get<MenuItem[]>(`${this.apiUrl}?all=true`, { headers: this.getAuthHeaders() });
  }

  addMenuItem(item: any) {
    return this.http.post(this.apiUrl, item, { headers: this.getAuthHeaders() });
  }

  updateMenuItem(id: string, item: any) {
    return this.http.put(`${this.apiUrl}/${id}`, item, { headers: this.getAuthHeaders() });
  }

  deleteMenuItem(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
