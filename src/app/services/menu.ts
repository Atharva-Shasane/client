import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MenuItem } from '../models/menu-item.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/menu`;

  private readonly httpOptions = { withCredentials: true };

  getMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.apiUrl, this.httpOptions);
  }

  /** Aliases for component compatibility */
  getMenu() { return this.getMenuItems(); }
  getAllMenuItems() { return this.getMenuItems(); }

  getRecommendations(userId?: string): Observable<MenuItem[]> {
    return this.http.post<MenuItem[]>(
      `${this.apiUrl}/recommendations`,
      { userId: userId || null },
      this.httpOptions
    );
  }

  /** Alias for cart.ts and home.ts */
  getAiRecommendations() {
    return this.getRecommendations();
  }

  addMenuItem(formData: FormData) {
    return this.http.post<MenuItem>(this.apiUrl, formData, this.httpOptions);
  }

  updateMenuItem(id: string, formData: FormData) {
    return this.http.put<MenuItem>(`${this.apiUrl}/${id}`, formData, this.httpOptions);
  }

  deleteMenuItem(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.httpOptions);
  }
}