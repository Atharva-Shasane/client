import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem } from '../models/menu-item.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:5000/api/menu';

  /**
   * Public: Get only available items for the menu
   */
  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.apiUrl);
  }

  /**
   * AI Integration: Get recommendations for the current user.
   * UPDATED: Changed from GET to POST to send userId in the body.
   * FIX: Changed 'user.id' to 'user._id' to match the User model interface.
   */
  getAiRecommendations(): Observable<MenuItem[]> {
    const user = this.authService.currentUser();
    // Accessing _id instead of id to satisfy TypeScript and match MongoDB structure
    const userId = user ? (user as any)._id || (user as any).id : null;

    return this.http.post<MenuItem[]>(
      `${this.apiUrl}/recommendations`,
      { userId },
      { withCredentials: true },
    );
  }

  /**
   * Owner: Get ALL items (including unavailable) for management dashboard
   */
  getAllMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}?all=true`, { withCredentials: true });
  }

  /**
   * Owner: Add new menu item
   */
  addMenuItem(item: any): Observable<any> {
    return this.http.post(this.apiUrl, item, { withCredentials: true });
  }

  /**
   * Owner: Update existing menu item
   */
  updateMenuItem(id: string, item: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, item, { withCredentials: true });
  }

  /**
   * Owner: Delete menu item from the system
   */
  deleteMenuItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
