import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, MonthlyProfitData } from '../../services/analytics';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-wrapper fade-in">
      <div class="container">
        <!-- HEADER SECTION: Solves Navbar Overlap with fixed spacing -->
        <header class="analytics-header">
          <div class="header-main">
            <div class="brand-group">
              <span class="badge-accent">Business Intelligence</span>
              <h1>Killa <span class="highlight">Analytics</span></h1>
              <p class="subtitle">Live performance tracking and financial health overview.</p>
            </div>
            <div class="live-indicator glass-card">
              <span class="pulse"></span>
              <span class="date-text">Sync: {{ currentDayLabel }}</span>
            </div>
          </div>
        </header>

        <!-- KPI SUMMARY GRID -->
        <section class="metrics-section">
          <div class="kpi-grid">
            <div class="kpi-card glass-card">
              <div class="kpi-icon">📊</div>
              <div class="kpi-body">
                <span class="k-label">Net Profit (Monthly)</span>
                <h3
                  class="k-value"
                  [class.profit]="getCurrentMonthProfit() >= 0"
                  [class.loss]="getCurrentMonthProfit() < 0"
                >
                  {{ getCurrentMonthProfit() | currency: 'INR' }}
                </h3>
                <div class="mini-stats">
                  <span class="m-pill m-rev">Rev: {{ getCurrentMonthRevenue() | number }}</span>
                  <span class="m-pill m-exp">Exp: {{ getCurrentMonthExpenses() | number }}</span>
                </div>
              </div>
            </div>

            <div class="kpi-card glass-card">
              <div class="kpi-icon">🧾</div>
              <div class="kpi-body">
                <span class="k-label">Today's Orders</span>
                <h3 class="k-value">{{ todayData()?.totalOrders || 0 }}</h3>
                <span class="k-sub">Processed during current shift</span>
              </div>
            </div>

            <div class="kpi-card glass-card">
              <div class="kpi-icon">💸</div>
              <div class="kpi-body">
                <span class="k-label">Avg Order Value</span>
                <h3 class="k-value">{{ calculateAOV() | currency: 'INR' }}</h3>
                <span class="k-sub">Live average ticket size</span>
              </div>
            </div>
          </div>
        </section>

        <div class="analytics-split-grid">
          <!-- EXPENSE MANAGEMENT: Re-styled Inputs & Buttons -->
          <section class="form-container">
            <div class="panel-card glass-card">
              <div class="panel-head">
                <h3>{{ editingId() ? 'Update Record' : 'Log New Expense' }}</h3>
                <p>Record business costs for accurate profit calculation.</p>
              </div>
              <form #expenseForm (submit)="submitExpense($event)" class="killa-form">
                <div class="form-group">
                  <label>Item Description</label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g. Electricity, Raw Materials"
                    required
                  />
                </div>
                <div class="row-inputs">
                  <div class="form-group">
                    <label>Amount (₹)</label>
                    <input type="number" name="amount" placeholder="0.00" required />
                  </div>
                  <div class="form-group">
                    <label>Period</label>
                    <select name="expenseMonth" required>
                      <option *ngFor="let m of monthNames" [value]="m">{{ m }}</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>Fiscal Year</label>
                  <input type="number" name="expenseYear" [value]="selectedYear()" required />
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn-submit-killa">
                    {{ editingId() ? 'Sync Update' : 'Record Expense' }}
                  </button>
                  <button
                    *ngIf="editingId()"
                    type="button"
                    (click)="cancelEdit()"
                    class="btn-cancel-killa"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>

          <!-- TREND ANALYSIS: Side-by-Side Unified Graph -->
          <section class="graph-container">
            <div class="panel-card glass-card">
              <div class="panel-head-flex">
                <h3>Annual Financial Health</h3>
                <div class="graph-controls">
                  <input
                    type="number"
                    class="mini-input"
                    [value]="chartYear()"
                    (change)="onChartYearChange($event)"
                  />
                  <div class="legend-pills">
                    <span class="leg"><span class="dot rev"></span> Revenue</span>
                    <span class="leg"><span class="dot exp"></span> Expense</span>
                  </div>
                </div>
              </div>

              <div class="chart-box">
                <div class="y-labels">
                  <span>{{ getMaxVal() | number }}</span>
                  <span>{{ getMaxVal() / 2 | number }}</span>
                  <span>0</span>
                </div>
                <div class="bars-wrapper">
                  <div class="month-stack" *ngFor="let m of annualData()">
                    <div class="bar-pair">
                      <div class="bar-fill b-rev" [style.height.%]="getReportHeight(m.revenue)">
                        <span class="tip">R: {{ m.revenue | number }}</span>
                      </div>
                      <div class="bar-fill b-exp" [style.height.%]="getReportHeight(m.expenses)">
                        <span class="tip">E: {{ m.expenses | number }}</span>
                      </div>
                    </div>
                    <span class="m-name">{{ m.month }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- RECENT ACTIVITY TABLE -->
        <section class="table-section">
          <div class="panel-card glass-card">
            <div class="panel-head">
              <h3>Expense Ledger</h3>
              <p>Historical log of recorded business expenses.</p>
            </div>
            <div class="table-scroll">
              <table class="killa-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Fiscal Period</th>
                    <th>Amount</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let exp of expenses()" [class.is-editing]="editingId() === exp._id">
                    <td>
                      <span class="desc-text">{{ exp.description }}</span>
                    </td>
                    <td>
                      <span class="date-pill">{{ exp.month }} {{ exp.year }}</span>
                    </td>
                    <td>
                      <span class="amt-text">₹ {{ exp.amount | number }}</span>
                    </td>
                    <td class="text-right">
                      <div class="row-btns">
                        <button (click)="startEdit(exp)" class="btn-row btn-edit">Edit</button>
                        <button (click)="deleteExpense(exp._id)" class="btn-row btn-del">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- PAYMENT DISTRIBUTION -->
        <section class="payment-trends">
          <div class="section-title-row">
            <h2>Payment <span class="highlight">Distribution</span></h2>
            <div class="trend-filters">
              <select (change)="onMonthChange($event)" class="mini-select">
                <option
                  *ngFor="let month of monthNames; let i = index"
                  [value]="i + 1"
                  [selected]="i + 1 === selectedMonth()"
                >
                  {{ month }}
                </option>
              </select>
              <input
                type="number"
                class="mini-input"
                [value]="selectedYear()"
                (change)="onYearChange($event)"
              />
            </div>
          </div>

          <div class="payment-grid">
            <div class="pay-stat-card glass-card">
              <div class="p-header">
                <span class="p-ico">💳</span>
                <div class="p-info">
                  <span class="p-label">Online (KillaPay)</span>
                  <h4 class="p-val">{{ paymentStats()?.totalOnlineCount || 0 }} Transactions</h4>
                </div>
              </div>
              <div class="trend-visual">
                <svg viewBox="0 0 1000 150" class="mini-spark">
                  <polyline
                    fill="none"
                    stroke="#ffcc00"
                    stroke-width="4"
                    [attr.points]="getLinePoints('online')"
                  />
                </svg>
              </div>
            </div>

            <div class="pay-stat-card glass-card">
              <div class="p-header">
                <span class="p-ico">💵</span>
                <div class="p-info">
                  <span class="p-label">Offline (Cash/UPI)</span>
                  <h4 class="p-val">{{ paymentStats()?.totalOfflineCount || 0 }} Transactions</h4>
                </div>
              </div>
              <div class="trend-visual">
                <svg viewBox="0 0 1000 150" class="mini-spark">
                  <polyline
                    fill="none"
                    stroke="#ff4444"
                    stroke-width="4"
                    [attr.points]="getLinePoints('offline')"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- LOADER OVERLAY -->
      <div *ngIf="isLoading()" class="killa-loader-overlay">
        <div class="loader-box">
          <div class="spinner"></div>
          <p>Analyzing Business Data...</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --primary: #ff6600;
        --bg: #050505;
        --card: rgba(20, 20, 20, 0.7);
        --border: rgba(255, 255, 255, 0.08);
        --text: #fff;
        --muted: #666;
      }

      .analytics-wrapper {
        background: var(--bg);
        min-height: 100vh;
        color: var(--text);
        padding: 130px 24px 80px; /* High top padding solves Navbar overlap */
        font-family: 'Inter', sans-serif;
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
      }
      .glass-card {
        background: var(--card);
        backdrop-filter: blur(25px);
        border: 1px solid var(--border);
        border-radius: 28px;
      }

      /* Header Styling */
      .analytics-header {
        margin-bottom: 50px;
      }
      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: 20px;
      }
      .badge-accent {
        display: inline-block;
        font-size: 0.65rem;
        font-weight: 900;
        text-transform: uppercase;
        color: var(--primary);
        background: rgba(255, 102, 0, 0.1);
        padding: 5px 12px;
        border-radius: 50px;
        letter-spacing: 2px;
        margin-bottom: 10px;
      }
      h1 {
        font-size: 3rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -2px;
      }
      .highlight {
        color: var(--primary);
      }
      .subtitle {
        color: var(--muted);
        font-size: 1rem;
        margin-top: 5px;
      }

      .live-indicator {
        padding: 12px 25px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-radius: 50px;
      }
      .pulse {
        width: 8px;
        height: 8px;
        background: #00ff88;
        border-radius: 50%;
        box-shadow: 0 0 10px #00ff88;
        animation: pulse-anim 1.5s infinite;
      }
      @keyframes pulse-anim {
        0% {
          opacity: 0.4;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.4;
        }
      }
      .date-text {
        font-size: 0.8rem;
        font-weight: 800;
        color: #aaa;
        text-transform: uppercase;
      }

      /* KPI Cards */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
        margin-bottom: 60px;
      }
      .kpi-card {
        padding: 35px;
        display: flex;
        gap: 25px;
        align-items: center;
        transition: 0.3s;
      }
      .kpi-card:hover {
        transform: translateY(-5px);
        border-color: rgba(255, 255, 255, 0.15);
      }
      .kpi-icon {
        font-size: 2.5rem;
        background: #000;
        width: 70px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 20px;
      }
      .k-label {
        font-size: 0.75rem;
        color: var(--muted);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .k-value {
        font-size: 2.2rem;
        font-weight: 900;
        margin: 5px 0;
      }
      .k-value.profit {
        color: #00ff88;
      }
      .k-value.loss {
        color: #ff4444;
      }
      .mini-stats {
        display: flex;
        gap: 10px;
      }
      .m-pill {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 6px;
      }
      .m-rev {
        background: rgba(0, 255, 136, 0.1);
        color: #00ff88;
      }
      .m-exp {
        background: rgba(255, 68, 68, 0.1);
        color: #ff4444;
      }

      /* Forms & Inputs */
      .analytics-split-grid {
        display: grid;
        grid-template-columns: 420px 1fr;
        gap: 24px;
        margin-bottom: 60px;
      }
      .panel-card {
        padding: 40px;
        height: 100%;
      }
      .panel-head h3 {
        font-size: 1.4rem;
        font-weight: 900;
        margin-bottom: 5px;
      }
      .panel-head p {
        color: var(--muted);
        font-size: 0.85rem;
        margin-bottom: 30px;
      }

      .killa-form .form-group {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .killa-form label {
        font-size: 0.7rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
      }
      .killa-form input,
      .killa-form select {
        background: #000;
        border: 1px solid #222;
        padding: 15px;
        border-radius: 12px;
        color: #fff;
        font-family: inherit;
        font-weight: 700;
        transition: 0.3s;
      }
      .killa-form input:focus {
        border-color: var(--primary);
        outline: none;
        box-shadow: 0 0 15px rgba(255, 102, 0, 0.1);
      }
      .row-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }

      .btn-submit-killa {
        width: 100%;
        padding: 18px;
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: 14px;
        font-weight: 900;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-submit-killa:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(255, 102, 0, 0.4);
      }
      .btn-cancel-killa {
        width: 100%;
        margin-top: 10px;
        background: #222;
        color: #aaa;
        border: none;
        padding: 12px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      /* Chart Styling */
      .panel-head-flex {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
      }
      .graph-controls {
        text-align: right;
      }
      .legend-pills {
        display: flex;
        gap: 15px;
        margin-top: 10px;
      }
      .leg {
        font-size: 0.7rem;
        font-weight: 800;
        color: #555;
        display: flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .dot.rev {
        background: #00ff88;
      }
      .dot.exp {
        background: #ff4444;
      }

      .chart-box {
        height: 350px;
        display: flex;
        gap: 20px;
        border-bottom: 1px solid #1a1a1a;
        padding-bottom: 20px;
      }
      .y-labels {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: #333;
        font-size: 0.65rem;
        font-weight: 900;
        padding-bottom: 20px;
      }
      .bars-wrapper {
        flex-grow: 1;
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
      }
      .month-stack {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        height: 100%;
        width: 45px;
        justify-content: flex-end;
      }
      .bar-pair {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        height: 100%;
      }
      .bar-fill {
        width: 12px;
        border-radius: 4px 4px 0 0;
        position: relative;
        cursor: pointer;
        transition: height 0.6s cubic-bezier(0.17, 0.67, 0.83, 0.67);
      }
      .b-rev {
        background: linear-gradient(to top, #00ff88, #88ffcc);
      }
      .b-exp {
        background: linear-gradient(to top, #ff4444, #ff8888);
      }
      .m-name {
        font-size: 0.6rem;
        font-weight: 900;
        color: #444;
        text-transform: uppercase;
      }
      .bar-fill:hover .tip {
        opacity: 1;
        transform: translateX(-50%) translateY(-5px);
      }
      .tip {
        position: absolute;
        top: -35px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        color: #000;
        padding: 5px 10px;
        border-radius: 8px;
        font-size: 0.65rem;
        font-weight: 900;
        opacity: 0;
        pointer-events: none;
        transition: 0.3s;
        z-index: 10;
      }

      /* Table Styles */
      .table-scroll {
        overflow-x: auto;
        margin-top: 20px;
      }
      .killa-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .killa-table th {
        padding: 20px;
        background: #0a0a0a;
        color: #444;
        font-size: 0.7rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .killa-table td {
        padding: 18px 20px;
        border-bottom: 1px solid #111;
        vertical-align: middle;
      }
      .desc-text {
        font-weight: 700;
        color: #eee;
      }
      .date-pill {
        background: #111;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        color: #666;
        font-weight: 700;
      }
      .amt-text {
        color: #ff4444;
        font-weight: 800;
        font-family: monospace;
      }
      .row-btns {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .btn-row {
        background: none;
        border: 1px solid #222;
        color: #555;
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-row:hover {
        border-color: #ff6600;
        color: #fff;
      }
      .btn-del:hover {
        border-color: #ff4444;
        color: #ff4444;
      }

      /* Payment Trends */
      .section-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        margin-top: 60px;
      }
      .payment-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      .pay-stat-card {
        padding: 30px;
      }
      .p-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 25px;
      }
      .p-ico {
        font-size: 2.2rem;
        background: #000;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 18px;
      }
      .p-label {
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--muted);
        text-transform: uppercase;
      }
      .p-val {
        font-size: 1.3rem;
        font-weight: 900;
        color: #eee;
      }
      .mini-spark {
        width: 100%;
        height: 80px;
      }

      .mini-input,
      .mini-select {
        background: #111;
        border: 1px solid #222;
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        font-weight: 800;
        font-family: inherit;
      }

      /* Loader */
      .killa-loader-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
      }
      .loader-box {
        text-align: center;
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #222;
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1100px) {
        .analytics-split-grid {
          grid-template-columns: 1fr;
        }
        .payment-grid {
          grid-template-columns: 1fr;
        }
        .y-labels {
          display: none;
        }
        h1 {
          font-size: 2.2rem;
        }
      }
    `,
  ],
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  @ViewChild('expenseForm') expenseForm!: ElementRef<HTMLFormElement>;

  todayData = signal<any>(null);
  annualData = signal<MonthlyProfitData[]>([]);
  expenses = signal<any[]>([]);
  paymentStats = signal<any>(null);

  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  chartYear = signal<number>(new Date().getFullYear());

  editingId = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  currentDayLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  ngOnInit() {
    this.refreshAnalytics();
  }

  refreshAnalytics() {
    this.isLoading.set(true);
    // Fetch dashboard KPIs
    this.analyticsService
      .getTodayAnalytics()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => this.todayData.set(data));
    // Fetch expense log
    this.analyticsService.getExpenseList().subscribe((list) => this.expenses.set(list));
    // Fetch online vs offline sparkline data
    this.analyticsService
      .getPaymentComparison(this.selectedMonth(), this.selectedYear())
      .subscribe((data) => this.paymentStats.set(data));

    // Fetch primary bar chart data
    this.analyticsService.getAnnualProfitLoss(this.chartYear()).subscribe({
      next: (data) => {
        const reportData = (data as any).chartData || data;
        this.annualData.set(reportData || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  submitExpense(event: any) {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const formData = new FormData(target);
    const expenseData = {
      description: formData.get('description'),
      amount: Number(formData.get('amount')),
      month: formData.get('expenseMonth'),
      year: Number(formData.get('expenseYear')),
    };

    if (this.editingId()) {
      this.analyticsService.updateExpense(this.editingId()!, expenseData).subscribe(() => {
        this.editingId.set(null);
        target.reset();
        this.refreshAnalytics();
      });
    } else {
      this.analyticsService.addExpense(expenseData).subscribe({
        next: () => {
          target.reset();
          this.refreshAnalytics();
        },
        error: () => window.alert('Failed to save.'),
      });
    }
  }

  deleteExpense(id: string) {
    if (confirm('Permanently delete this record from the ledger?')) {
      this.analyticsService.deleteExpense(id).subscribe({
        next: () => {
          this.refreshAnalytics();
        },
        error: () => window.alert('Delete failed.'),
      });
    }
  }

  startEdit(expense: any) {
    this.editingId.set(expense._id);
    const form = this.expenseForm.nativeElement;
    form['description'].value = expense.description;
    form['amount'].value = expense.amount;
    form['expenseMonth'].value = expense.month || this.monthNames[new Date().getMonth()];
    form['expenseYear'].value = expense.year || new Date().getFullYear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.expenseForm.nativeElement.reset();
  }
  onMonthChange(event: any) {
    this.selectedMonth.set(Number(event.target.value));
    this.refreshAnalytics();
  }
  onYearChange(event: any) {
    const yr = Number(event.target.value);
    if (yr >= 2000) {
      this.selectedYear.set(yr);
      this.refreshAnalytics();
    }
  }
  onChartYearChange(event: any) {
    const yr = Number(event.target.value);
    if (yr >= 2000) {
      this.chartYear.set(yr);
      this.refreshAnalytics();
    }
  }

  private getMonthData() {
    const currentMonthIndex = new Date().getMonth();
    const currentMonthFullName = this.monthNames[currentMonthIndex].toUpperCase();
    const currentMonthShortName = currentMonthFullName.substring(0, 3);

    return this.annualData().find(
      (m) =>
        m.month.toUpperCase() === currentMonthFullName ||
        m.month.toUpperCase() === currentMonthShortName,
    );
  }

  getCurrentMonthProfit() {
    const data = this.getMonthData();
    return data ? data.revenue - data.expenses : 0;
  }
  getCurrentMonthRevenue() {
    const data = this.getMonthData();
    return data ? data.revenue : 0;
  }
  getCurrentMonthExpenses() {
    const data = this.getMonthData();
    return data ? data.expenses : 0;
  }

  calculateAOV() {
    const data = this.todayData();
    return data && data.totalOrders ? data.totalRevenue / data.totalOrders : 0;
  }

  getMaxVal() {
    const data = this.annualData();
    if (!data.length) return 10000;
    const allValues = data.flatMap((m) => [m.revenue, m.expenses]);
    return Math.max(...allValues, 1000);
  }

  getReportHeight(val: number) {
    const globalMax = this.getMaxVal();
    return (val / globalMax) * 100;
  }

  getLinePoints(type: 'online' | 'offline'): string {
    const stats = this.paymentStats()?.dailyStats;
    if (!stats || stats.length < 2) return '';
    const maxVal = Math.max(...stats.map((d: any) => Math.max(d.online, d.offline)), 1);
    return stats
      .map((d: any, i: number) => {
        const x = (i / (stats.length - 1)) * 1000;
        const y = 140 - (d[type] / maxVal) * 120;
        return `${x},${y}`;
      })
      .join(' ');
  }
}
