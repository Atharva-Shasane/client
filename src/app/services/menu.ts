import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem } from '../models/menu-item.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private http = inject(HttpClient);
  private auth = inject(AuthService); // Restored auth line
  private apiUrl = 'api/menu';

  getAllMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.apiUrl);
  }

  getRecommendations(userId: string | null = null): Observable<MenuItem[]> {
    return this.http.post<MenuItem[]>(`${this.apiUrl}/recommendations`, { userId });
  }

  addMenuItem(item: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.post<MenuItem>(this.apiUrl, item);
  }

  updateMenuItem(id: string, item: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.apiUrl}/${id}`, item);
  }

  deleteMenuItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
