import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  count: number;
}

export interface AnalyticsData {
  date: string; // YYYY-MM-DD
  totalOrders: number;
  totalRevenue: number;
  orderTypeBreakdown: {
    dineIn: number;
    takeaway: number;
  };
  paymentBreakdown: {
    cash: number;
    online: number;
  };
  topSellingItems: TopSellingItem[];
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/analytics';

  /**
   * Get analytics for the current day
   */
  getTodayAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.apiUrl}/today`);
  }

  /**
   * Get historical analytics
   */
  getHistoryAnalytics(): Observable<AnalyticsData[]> {
    return this.http.get<AnalyticsData[]>(`${this.apiUrl}`);
  }
}
