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
   * Fetches aggregated Profit & Loss data broken down by month for a specific year
   */
  getAnnualProfitLoss(year: number): Observable<MonthlyProfitData[]> {
    return this.http.get<MonthlyProfitData[]>(`${this.apiUrl}/profit-loss-annual?year=${year}`);
  }

  /**
   * Sends a manual expense record to the database
   * Updated to handle Month and Year data
   */
  addExpense(expense: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/expenses`, expense);
  }

  /**
   * Fetches all recorded expenses for the management table
   */
  getExpenseList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/expenses/list`);
  }

  /**
   * Updates an existing expense record (Description, Amount, Month, Year)
   */
  updateExpense(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/expenses/${id}`, data);
  }

  /**
   * Fetches daily online vs offline totals for a specific month and year
   */
  getPaymentComparison(month: number, year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/payment-comparison?month=${month}&year=${year}`);
  }

  deleteExpense(id: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/expenses/${id}`);
  }
}