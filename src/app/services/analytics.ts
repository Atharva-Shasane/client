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

// Added for Profit & Loss logic
export interface MonthlyProfitData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/analytics';

  getTodayAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.apiUrl}/today`);
  }

  getHistoryAnalytics(): Observable<AnalyticsData[]> {
    return this.http.get<AnalyticsData[]>(`${this.apiUrl}`);
  }

  // New method to fetch P&L data
  getAnnualProfitLoss(): Observable<MonthlyProfitData[]> {
    return this.http.get<MonthlyProfitData[]>(`${this.apiUrl}/profit-loss-annual`);
  }
}