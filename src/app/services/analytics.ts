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

/**
 * Interface representing Monthly financial health
 * Used for the dual-bar P&L chart
 */
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

  /**
   * Fetches the current day's performance metrics
   */
  getTodayAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.apiUrl}/today`);
  }

  /**
   * Fetches historical data (last 7 days) for the revenue chart
   */
  getHistoryAnalytics(): Observable<AnalyticsData[]> {
    return this.http.get<AnalyticsData[]>(`${this.apiUrl}`);
  }

  /**
   * Fetches aggregated Profit & Loss data broken down by month
   */
  getAnnualProfitLoss(): Observable<MonthlyProfitData[]> {
    return this.http.get<MonthlyProfitData[]>(`${this.apiUrl}/profit-loss-annual`);
  }

  /**
   * Sends a manual expense record to the database
   * @param expense - { description: string, amount: number, category: string }
   */
  addExpense(expense: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/expenses`, expense);
  }
}