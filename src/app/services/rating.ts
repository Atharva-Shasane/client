import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rating`;

  private readonly httpOptions = { withCredentials: true };

  /**
   * Checks for the latest completed order without a submitted rating
   */
  checkPendingRating(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check-pending`, this.httpOptions);
  }

  /**
   * Alias to satisfy home.ts component
   */
  checkPendingFeedback(): Observable<any> {
    return this.checkPendingRating();
  }

  /**
   * Standard method for submitting ratings
   */
  submitRating(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, this.httpOptions);
  }

  /**
   * Alias to maintain compatibility with feedback modal
   */
  submitFeedback(data: any): Observable<any> {
    return this.submitRating(data);
  }

  /**
   * Fetch all reviews for Admin/Owner dashboard
   */
  getAllRatings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/all`, this.httpOptions);
  }

  /**
   * Alias to satisfy feedback-admin.ts
   */
  getAdminFeedback(): Observable<any[]> {
    return this.getAllRatings();
  }

  /**
   * OWNER: Respond to a customer review
   */
  submitOwnerReply(id: string, reply: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/reply/${id}`, { reply }, this.httpOptions);
  }

  /**
   * Alias to satisfy feedback-admin.ts
   */
  replyToFeedback(id: string, reply: string): Observable<any> {
    return this.submitOwnerReply(id, reply);
  }
}