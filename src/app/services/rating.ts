import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PendingFeedback {
  pending: boolean;
  order?: {
    _id: string;
    orderNumber: string;
    items: any[];
    totalAmount: number;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/rating';

  checkPendingFeedback(): Observable<PendingFeedback> {
    return this.http.get<PendingFeedback>(`${this.apiUrl}/check-pending`, {
      withCredentials: true,
    });
  }

  dismissFeedback(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/dismiss`, { orderId }, { withCredentials: true });
  }

  submitFeedback(data: { orderId: string; rating: number; comment?: string }): Observable<any> {
    return this.http.post(this.apiUrl, data, { withCredentials: true });
  }
}
