import { Component, OnInit, inject, signal } from '@angular/core';
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
          <h2 class="section-title">Record Business Expense</h2>
          <div class="data-panel">
            <form (submit)="submitExpense($event)" class="expense-form">
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
                <button type="submit" class="submit-btn">Add Expense</button>
              </div>
            </form>
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
          <div class="data-panel full-width">
            <div class="panel-header">
              <h3>Monthly Profit & Loss</h3>
              <div class="legend">
                <span class="dot profit"></span> Profit 
                <span class="dot expense"></span> Expenses
              </div>
            </div>
            <div class="chart-canvas">
              <div class="bars-container">
                <div class="bar-group" *ngFor="let m of annualData()">
                  <div class="dual-bar-track">
                    <div class="bar-fill expense-bar" [style.height]="getReportHeight(m.expenses) + '%'">
                      <div class="bar-tooltip">Exp: ₹{{ m.expenses }}</div>
                    </div>
                    <div class="bar-fill profit-bar" [style.height]="getReportHeight(m.profit) + '%'">
                      <div class="bar-tooltip">Prof: ₹{{ m.profit }}</div>
                    </div>
                  </div>
                  <span class="bar-label">{{ m.month }}</span>
                </div>
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
    @keyframes pulse-ring { 0% { opacity: 0.8; } 50% { opacity: 0.4; } 100% { opacity: 0.8; } }
    
    .form-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; align-items: flex-end; }
    .input-group { display: flex; flex-direction: column; gap: 8px; }
    .input-group label { font-size: 0.8rem; font-weight: 700; color: var(--killa-muted); text-transform: uppercase; }
    .input-group input, .input-group select { background: #222; border: 1px solid #333; padding: 12px; border-radius: 10px; color: #fff; font-family: inherit; }
    .submit-btn { background: var(--killa-orange); color: #fff; border: none; padding: 14px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.2s; }
    
    .section-title { font-size: 1.1rem; text-transform: uppercase; letter-spacing: 2px; color: var(--killa-muted); margin-bottom: 24px; font-weight: 800; margin-top: 40px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; margin-bottom: 48px; }
    .kpi-card { background: var(--killa-gray); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; display: flex; gap: 24px; }
    .kpi-info .value { font-size: 2.5rem; margin: 10px 0; font-weight: 900; letter-spacing: -1px; }
    .sub-metrics { display: flex; gap: 8px; margin-top: 15px; }
    .sub-pill { font-size: 0.75rem; padding: 6px 12px; border-radius: 8px; font-weight: 700; }
    .revenue-pill { background: rgba(255, 102, 0, 0.1); color: var(--killa-orange); }
    .expense-pill { background: rgba(255, 68, 68, 0.1); color: #ff4444; }

    .data-panel { background: var(--killa-gray); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 32px; }
    .full-width { grid-column: 1 / -1; }
    .dual-bar-track { display: flex; align-items: flex-end; height: 100%; gap: 4px; }
    .expense-bar { background: linear-gradient(to top, #ff4444, #ff6666); width: 15px; border-radius: 4px; position: relative; }
    .profit-bar { background: linear-gradient(to top, #00ff00, #33ff33); width: 15px; border-radius: 4px; position: relative; }
    .chart-canvas { height: 300px; display: flex; align-items: flex-end; }
    .bars-container { width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: space-around; }
    .bar-group { display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .bar-label { margin-top: 15px; font-size: 0.75rem; font-weight: 700; color: var(--killa-muted); text-transform: uppercase; }
    .bar-tooltip { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: #fff; color: #000; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; opacity: 0; transition: 0.2s; z-index: 10; pointer-events: none; }
    .bar-fill:hover .bar-tooltip { opacity: 1; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; }
    .profit { background: #00ff00; }
    .expense { background: #ff4444; }
    .loading-overlay { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
    .loader { width: 50px; height: 50px; border: 3px solid transparent; border-top-color: var(--killa-orange); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  todayData = signal<any>(null);
  historyData = signal<AnalyticsData[]>([]);
  annualData = signal<MonthlyProfitData[]>([]);
  isLoading = signal<boolean>(true);
  currentDayLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  ngOnInit() {
    this.refreshAnalytics();
  }

  refreshAnalytics() {
    this.isLoading.set(true);

    this.analyticsService.getTodayAnalytics()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => this.todayData.set(data));

    this.analyticsService.getAnnualProfitLoss().subscribe({
      next: (data) => {
        this.annualData.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
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

    console.log("Saving expense:", expenseData);

    this.analyticsService.addExpense(expenseData).subscribe({
      next: (res) => {
        window.alert("Expense saved successfully!");
        target.reset();
        this.refreshAnalytics();
      },
      error: (err) => {
        console.error("Save failed:", err);
        window.alert("Failed to save. Check terminal.");
      }
    });
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
    return (Math.max(0, val) / max) * 100;
  }
}