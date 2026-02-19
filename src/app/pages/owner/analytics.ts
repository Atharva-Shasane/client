import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, AnalyticsData, MonthlyProfitData } from '../../services/analytics';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <header class="dashboard-header">
        <div class="header-content">
          <div class="title-area">
            <h1>KILLA <span class="highlight">ANALYTICS</span></h1>
            <p class="subtitle">Real-time performance metrics and business intelligence</p>
          </div>
          <div class="date-badge">
            <span class="pulse"></span>
            LIVE: {{ currentDayLabel }}
          </div>
        </div>
      </header>

      <div *ngIf="isLoading()" class="loading-overlay">
        <div class="loader"></div>
        <p>Syncing with Killa-Resto Engine...</p>
      </div>

      <div *ngIf="!isLoading()" class="analytics-content fade-in">
        
        <section class="metrics-section">
          <h2 class="section-title">{{ editingId() ? 'Update' : 'Record' }} Business Expense</h2>
          <div class="data-panel" [class.editing-mode]="editingId()">
            <form #expenseForm (submit)="submitExpense($event)" class="expense-form">
              <div class="form-inputs">
                <div class="input-group">
                  <label>Description</label>
                  <input type="text" name="description" placeholder="e.g. Electricity, Rent" required>
                </div>
                <div class="input-group">
                  <label>Amount (₹)</label>
                  <input type="number" name="amount" placeholder="0.00" required>
                </div>
                <div class="input-group">
                  <label>Category</label>
                  <select name="category">
                    <option value="SUPPLIES">Supplies</option>
                    <option value="SALARY">Salary</option>
                    <option value="RENT">Rent</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div class="action-buttons">
                  <button type="submit" class="submit-btn">
                    {{ editingId() ? 'Update Record' : 'Add Expense' }}
                  </button>
                  <button *ngIf="editingId()" type="button" (click)="cancelEdit()" class="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section class="metrics-section">
          <h2 class="section-title">Manage Recent Expenses</h2>
          <div class="data-panel table-panel">
            <table class="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let exp of expenses()" [class.row-editing]="editingId() === exp._id">
                  <td>{{ exp.date | date:'shortDate' }}</td>
                  <td>{{ exp.description }}</td>
                  <td><span class="cat-tag">{{ exp.category }}</span></td>
                  <td class="amt-col">{{ exp.amount | currency:'INR' }}</td>
                  <td style="text-align: right;">
                    <button (click)="startEdit(exp)" class="edit-btn">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="metrics-section">
          <h2 class="section-title">Performance Summary</h2>
          <div class="metrics-grid">
            <div class="kpi-card profit-summary-card">
              <div class="kpi-icon">📊</div>
              <div class="kpi-info">
                <span class="label">Net Profit (Monthly)</span>
                <h3 class="value" [style.color]="getCurrentMonthProfit() >= 0 ? '#00ff00' : '#ff4444'">
                  {{ getCurrentMonthProfit() | currency: 'INR' }}
                </h3>
                <div class="sub-metrics">
                  <div class="sub-pill revenue-pill">Rev: {{ getCurrentMonthRevenue() | currency: 'INR' }}</div>
                  <div class="sub-pill expense-pill">Exp: {{ getCurrentMonthExpenses() | currency: 'INR' }}</div>
                </div>
              </div>
            </div>

            <div class="kpi-card orders-card">
              <div class="kpi-icon">📋</div>
              <div class="kpi-info">
                <span class="label">Today's Total Orders</span>
                <h3 class="value">{{ todayData()?.totalOrders || 0 }}</h3>
              </div>
            </div>

            <div class="kpi-card aov-card">
              <div class="kpi-icon">📈</div>
              <div class="kpi-info">
                <span class="label">Avg Order Value</span>
                <h3 class="value">{{ calculateAOV() | currency: 'INR' }}</h3>
              </div>
            </div>
          </div>
        </section>

        <section class="metrics-section">
          <h2 class="section-title">Annual Financial Health</h2>
          <div class="data-panel full-width chart-card">
            <div class="panel-header">
              <h3>Monthly Revenue vs. Expenses</h3>
              <div class="legend">
                <span class="legend-item"><span class="dot profit"></span> Revenue</span>
                <span class="legend-item"><span class="dot expense"></span> Expenses</span>
              </div>
            </div>

            <div class="chart-wrapper">
              <div class="y-axis">
                <span>MAX</span>
                <span>50%</span>
                <span>0%</span>
              </div>
              
              <div class="chart-canvas">
                <div class="bars-container">
                  <div class="bar-group" *ngFor="let m of annualData()">
                    <div class="dual-bar-track">
                      <div class="bar-fill expense-bar" 
                           [style.height]="getReportHeight(m.expenses) + '%'">
                        <span class="bar-value-tooltip">Exp: ₹{{ m.expenses | number:'1.0-0' }}</span>
                      </div>
                      
                      <div class="bar-fill profit-bar" 
                           [style.height]="getReportHeight(m.revenue) + '%'">
                        <span class="bar-value-tooltip">Rev: ₹{{ m.revenue | number:'1.0-0' }}</span>
                      </div>
                    </div>
                    <span class="bar-label">{{ m.month }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="metrics-section">
          <div class="section-header-flex">
            <h2 class="section-title">Payment Method Analysis</h2>
            <div class="filter-controls">
              <input 
                type="number" 
                class="year-input" 
                [value]="selectedYear()" 
                (change)="onYearChange($event)"
                placeholder="Year"
              >
              <select (change)="onMonthChange($event)" class="month-select">
                <option *ngFor="let month of monthNames; let i = index" [value]="i + 1" [selected]="(i + 1) === selectedMonth()">
                  {{ month }}
                </option>
              </select>
            </div>
          </div>

          <div class="payment-grid">
            <div class="mini-kpi online">
              <span class="label">Online Payments</span>
              <h3>{{ paymentStats()?.totalOnlineCount || 0 }}</h3>
            </div>
            <div class="mini-kpi offline">
              <span class="label">Offline Payments</span>
              <h3>{{ paymentStats()?.totalOfflineCount || 0 }}</h3>
            </div>
          </div>

          <div class="data-panel line-chart-container">
            <div class="line-chart-wrapper">
              <svg viewBox="0 0 1000 300" class="svg-chart">
                <line x1="0" y1="250" x2="1000" y2="250" stroke="#333" />
                
                <polyline
                  fill="none"
                  stroke="#ff4444"
                  stroke-width="3"
                  [attr.points]="getLinePoints('offline')"
                />
                
                <polyline
                  fill="none"
                  stroke="#ffcc00"
                  stroke-width="3"
                  [attr.points]="getLinePoints('online')"
                />
              </svg>
              <div class="chart-labels">
                <span>Day 1</span>
                <span>Day 15</span>
                <span>Day 30</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    :host { --killa-orange: #ff6600; --killa-dark: #0a0a0a; --killa-gray: #1a1a1a; --killa-text: #ffffff; --killa-muted: #aaa; }
    .analytics-container { min-height: 100vh; background: var(--killa-dark); color: var(--killa-text); padding: 40px 24px; font-family: 'Inter', sans-serif; }
    .dashboard-header { margin-bottom: 48px; max-width: 1400px; margin-left: auto; margin-right: auto; }
    .header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
    h1 { font-size: 2.5rem; font-weight: 900; margin: 0; letter-spacing: -2px; }
    .highlight { color: var(--killa-orange); }
    .date-badge { background: var(--killa-gray); padding: 10px 20px; border-radius: 30px; display: inline-flex; align-items: center; gap: 12px; border: 1px solid rgba(255,255,255,0.05); font-weight: 700; }
    .pulse { width: 10px; height: 10px; background: #00ff00; border-radius: 50%; animation: pulse-ring 1.5s infinite; }
    
    .form-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; align-items: flex-end; }
    .input-group { display: flex; flex-direction: column; gap: 8px; }
    .input-group label { font-size: 0.8rem; font-weight: 700; color: var(--killa-muted); text-transform: uppercase; }
    .input-group input, .input-group select { background: #222; border: 1px solid #333; padding: 12px; border-radius: 10px; color: #fff; font-family: inherit; }
    .action-buttons { display: flex; gap: 10px; }
    .submit-btn { background: var(--killa-orange); color: #fff; border: none; padding: 14px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.2s; flex: 2; }
    .cancel-btn { background: #333; color: #fff; border: none; padding: 14px; border-radius: 10px; font-weight: 800; cursor: pointer; flex: 1; }
    .editing-mode { border: 1px solid var(--killa-orange) !important; box-shadow: 0 0 15px rgba(255,102,0,0.2); }

    /* Chart Styles */
    .chart-wrapper { display: flex; gap: 20px; height: 350px; padding: 20px 10px; margin-top: 20px; }
    .y-axis { display: flex; flex-direction: column; justify-content: space-between; color: #666; font-size: 0.7rem; font-weight: 800; padding-bottom: 30px; }
    .chart-canvas { flex-grow: 1; border-left: 1px solid #333; border-bottom: 1px solid #333; position: relative; }
    .bars-container { width: 100%; height: 100%; display: flex; justify-content: space-around; align-items: flex-end; }
    .bar-group { display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; justify-content: flex-end; }
    .dual-bar-track { display: flex; align-items: flex-end; gap: 6px; height: calc(100% - 30px); width: 100%; justify-content: center; }
    .bar-fill { position: relative; width: 18px; border-radius: 4px 4px 0 0; transition: all 0.3s ease; cursor: pointer; }
    .bar-fill:hover { filter: brightness(1.2); transform: scaleX(1.1); }
    .bar-value-tooltip { position: absolute; top: -35px; left: 50%; transform: translateX(-50%) translateY(10px); background: #fff; color: #000; padding: 5px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; opacity: 0; visibility: hidden; transition: 0.2s; z-index: 100; }
    .bar-fill:hover .bar-value-tooltip { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
    .expense-bar { background: linear-gradient(to top, #ff4444, #ff6b6b); }
    .profit-bar { background: linear-gradient(to top, #00ff00, #3dfc3d); }
    .bar-label { margin-top: 12px; font-size: 0.75rem; font-weight: 700; color: #aaa; text-transform: uppercase; }

    /* Filters & Payment KPI Styles */
    .section-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; margin-top: 40px; }
    .filter-controls { display: flex; gap: 12px; align-items: center; }
    .year-input { background: #222; color: #fff; border: 1px solid #444; padding: 8px 12px; border-radius: 8px; width: 100px; font-weight: 700; outline: none; }
    .month-select { background: #222; color: #fff; border: 1px solid #444; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; }
    .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .mini-kpi { background: var(--killa-gray); padding: 24px; border-radius: 15px; border-left: 5px solid #ffcc00; border-right: 1px solid rgba(255,255,255,0.05); }
    .mini-kpi.offline { border-left-color: #ff4444; }
    .mini-kpi h3 { font-size: 2rem; margin: 8px 0 0; }
    .line-chart-container { height: 350px; position: relative; }
    .svg-chart { width: 100%; height: 280px; }
    .chart-labels { display: flex; justify-content: space-between; color: var(--killa-muted); font-size: 0.8rem; margin-top: 10px; }

    /* Table Styles */
    .table-panel { padding: 0; overflow: hidden; margin-bottom: 40px; }
    .expense-table { width: 100%; border-collapse: collapse; }
    .expense-table th { background: #222; color: var(--killa-muted); text-align: left; padding: 15px 20px; font-size: 0.8rem; text-transform: uppercase; }
    .expense-table td { padding: 15px 20px; border-bottom: 1px solid #222; }
    .edit-btn { background: transparent; border: 1px solid var(--killa-orange); color: var(--killa-orange); padding: 6px 15px; border-radius: 8px; cursor: pointer; font-weight: 700; }
    
    /* Common KPI Grid */
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; margin-bottom: 48px; }
    .kpi-card { background: var(--killa-gray); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; display: flex; gap: 24px; }
    .data-panel { background: var(--killa-gray); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 32px; }
    .loader { width: 50px; height: 50px; border: 3px solid transparent; border-top-color: var(--killa-orange); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-in { animation: fadeIn 0.8s ease-out; }
  `]
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  @ViewChild('expenseForm') expenseForm!: ElementRef<HTMLFormElement>;

  todayData = signal<any>(null);
  annualData = signal<MonthlyProfitData[]>([]);
  expenses = signal<any[]>([]);
  paymentStats = signal<any>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear()); //
  editingId = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  currentDayLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ]; //

  ngOnInit() {
    this.refreshAnalytics();
  }

  refreshAnalytics() {
    this.isLoading.set(true);
    this.analyticsService.getTodayAnalytics().pipe(catchError(() => of(null))).subscribe((data) => this.todayData.set(data));
    this.analyticsService.getExpenseList().subscribe(list => this.expenses.set(list));
    
    // API with Year and Month
    this.analyticsService.getPaymentComparison(this.selectedMonth(), this.selectedYear()).subscribe(data => {
      this.paymentStats.set(data);
    });

    this.analyticsService.getAnnualProfitLoss().subscribe({
      next: (data) => {
        this.annualData.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getLinePoints(type: 'online' | 'offline'): string {
    const stats = this.paymentStats()?.dailyStats;
    if (!stats) return "";
    const maxVal = Math.max(...stats.map((d:any) => Math.max(d.online, d.offline)), 1000);
    return stats.map((d: any, i: number) => {
      const x = (i / (stats.length - 1)) * 1000;
      const y = 250 - (d[type] / maxVal) * 200;
      return `${x},${y}`;
    }).join(' ');
  }

  onMonthChange(event: any) {
    this.selectedMonth.set(Number(event.target.value));
    this.refreshAnalytics();
  }

  onYearChange(event: any) {
    const year = Number(event.target.value);
    if (year >= 2020 && year <= 2030) {
      this.selectedYear.set(year);
      this.refreshAnalytics();
    }
  } //

  startEdit(expense: any) {
    this.editingId.set(expense._id);
    const form = this.expenseForm.nativeElement;
    form['description'].value = expense.description;
    form['amount'].value = expense.amount;
    form['category'].value = expense.category;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.expenseForm.nativeElement.reset();
  }

  submitExpense(event: any) {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const formData = new FormData(target);
    const expenseData = {
      description: formData.get('description'),
      amount: Number(formData.get('amount')),
      category: formData.get('category')
    };

    if (this.editingId()) {
      this.analyticsService.updateExpense(this.editingId()!, expenseData).subscribe({
        next: () => {
          window.alert("Expense updated successfully!");
          this.editingId.set(null);
          target.reset();
          this.refreshAnalytics();
        }
      });
    } else {
      this.analyticsService.addExpense(expenseData).subscribe({
        next: () => {
          window.alert("Expense saved successfully!");
          target.reset();
          this.refreshAnalytics();
        }
      });
    }
  }

  getCurrentMonthProfit(): number {
    const data = this.getCurrentMonthData();
    return data ? data.profit : 0;
  }

  getCurrentMonthRevenue(): number {
    const data = this.getCurrentMonthData();
    return data ? data.revenue : 0;
  }

  getCurrentMonthExpenses(): number {
    const data = this.getCurrentMonthData();
    return data ? data.expenses : 0;
  }

  private getCurrentMonthData(): MonthlyProfitData | undefined {
    const label = new Date().toLocaleString('default', { month: 'short' });
    return this.annualData().find(m => m.month === label);
  }

  calculateAOV(): number {
    const data = this.todayData();
    return data && data.totalOrders ? data.totalRevenue / data.totalOrders : 0;
  }

  getReportHeight(val: number): number {
    const data = this.annualData();
    if (data.length === 0) return 0;
    const allValues = data.flatMap(d => [d.revenue, d.expenses]);
    const max = Math.max(...allValues, 1000); 
    return (Math.abs(val) / max) * 100;
  } //
}