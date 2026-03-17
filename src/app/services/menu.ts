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
   * Public: Get available menu items
   */
  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.apiUrl);
  }

  /**
   * Public: Get AI recommendations
   */
  getAiRecommendations(): Observable<MenuItem[]> {
    const user = this.authService.currentUser();
    // Using any cast to access ID properties if type definition is inconsistent
    const userId = (user as any)?._id || (user as any)?.id || null;
    
    return this.http.post<MenuItem[]>(`${this.apiUrl}/recommendations`, {
      userId: userId,
    });
  }

  /**
   * Owner: Get ALL items (including unavailable) for management dashboard
   */
  getAllMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}?all=true`, {
      withCredentials: true,
    });
  }

  /**
   * Owner: Add new menu item
   * UPDATED: Now accepts FormData to support Cloudinary image uploads
   */
  addMenuItem(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData, { withCredentials: true });
  }

  /**
   * Owner: Update existing menu item
   * UPDATED: Now accepts FormData to support Cloudinary image updates
   */
  updateMenuItem(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData, { withCredentials: true });
  }

  /**
   * Owner: Delete menu item from the system
   */
  deleteMenuItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}