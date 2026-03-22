import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

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
  private apiUrl = `${environment.apiUrl}/analytics`;

  private readonly httpOptions = { withCredentials: true };

  getTodayStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/today`, this.httpOptions);
  }

  /** Alias for components using getTodayAnalytics */
  getTodayAnalytics() {
    return this.getTodayStats();
  }

  getProfitLoss(year: number): Observable<MonthlyProfitData[]> {
    return this.http.get<MonthlyProfitData[]>(
      `${this.apiUrl}/profit-loss-annual?year=${year}`,
      this.httpOptions
    );
  }

  /** Alias for components using getAnnualProfitLoss */
  getAnnualProfitLoss(year: number) {
    return this.getProfitLoss(year);
  }

  getPaymentComparison(month: number, year: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/payment-comparison?month=${month}&year=${year}`,
      this.httpOptions
    );
  }

  getExpenses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/expenses/list`, this.httpOptions);
  }

  /** Alias for components using getExpenseList */
  getExpenseList() {
    return this.getExpenses();
  }

  addExpense(data: any) {
    return this.http.post(`${this.apiUrl}/expenses`, data, this.httpOptions);
  }

  updateExpense(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/expenses/${id}`, data, this.httpOptions);
  }

  deleteExpense(id: string) {
    return this.http.delete(`${this.apiUrl}/expenses/${id}`, this.httpOptions);
  }
}