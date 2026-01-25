import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MenuItem } from '../models/menu-item.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:5000/api/menu';

  // Public: Get only available items
  getMenu() {
    return this.http.get<MenuItem[]>(this.apiUrl);
  }

  // AI Integration: Get recommendations for current user
  getAiRecommendations() {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/recommendations`, { withCredentials: true });
  }

  // Owner: Get ALL items
  getAllMenuItems() {
    return this.http.get<MenuItem[]>(`${this.apiUrl}?all=true`, { withCredentials: true });
  }

  addMenuItem(item: any) {
    return this.http.post(this.apiUrl, item, { withCredentials: true });
  }

  updateMenuItem(id: string, item: any) {
    return this.http.put(`${this.apiUrl}/${id}`, item, { withCredentials: true });
  }

  deleteMenuItem(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
