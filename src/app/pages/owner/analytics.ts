import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, MonthlyProfitData } from '../../services/analytics';
import { catchError, forkJoin, of } from 'rxjs';

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Expense {
  _id: string;
  description: string;
  amount: number;
  month: string;
  year: number;
}

interface TodayData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface PaymentStats {
  dailyStats: { day: number; online: number; offline: number }[];
  totalOnlineCount: number;
  totalOfflineCount: number;
}

interface InsightCard {
  icon: string;
  title: string;
  body: string;
  type: 'positive' | 'warning' | 'neutral';
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="aw-root">

      <!-- ── HEADER ─────────────────────────────────────────────────────── -->
      <header class="aw-header">
        <div class="aw-header-inner">
          <div>
            <div class="aw-eyebrow">Business Intelligence</div>
            <h1 class="aw-title">Analytics <span class="aw-accent">Dashboard</span></h1>
            <p class="aw-sub">Live financial performance · {{ currentDayLabel }}</p>
          </div>
          <div class="aw-live-badge">
            <span class="aw-pulse"></span>
            <span>LIVE</span>
          </div>
        </div>
      </header>

      <div class="aw-body">

        <!-- ── KPI STRIP ──────────────────────────────────────────────────── -->
        <section class="aw-kpi-strip">
          <div class="aw-kpi" [class.kpi-pos]="getCurrentMonthProfit() >= 0" [class.kpi-neg]="getCurrentMonthProfit() < 0">
            <span class="kpi-eyebrow">Net Profit · {{ currentMonthName }}</span>
            <div class="kpi-main">
              <span class="kpi-symbol">{{ getCurrentMonthProfit() >= 0 ? '▲' : '▼' }}</span>
              <span class="kpi-number">{{ getCurrentMonthProfit() | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="kpi-pills">
              <span class="pill pill-g">Rev ₹{{ getCurrentMonthRevenue() | number:'1.0-0' }}</span>
              <span class="pill pill-r">Exp ₹{{ getCurrentMonthExpenses() | number:'1.0-0' }}</span>
            </div>
          </div>

          <div class="aw-kpi">
            <span class="kpi-eyebrow">Today's Orders</span>
            <div class="kpi-main">
              <span class="kpi-number kpi-white">{{ todayData()?.totalOrders ?? 0 }}</span>
            </div>
            <span class="kpi-foot">Completed during current shift</span>
          </div>

          <div class="aw-kpi">
            <span class="kpi-eyebrow">Today's Revenue</span>
            <div class="kpi-main">
              <span class="kpi-number kpi-white">{{ (todayData()?.totalRevenue ?? 0) | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <span class="kpi-foot">Gross collected today</span>
          </div>

          <div class="aw-kpi">
            <span class="kpi-eyebrow">Avg Order Value</span>
            <div class="kpi-main">
              <span class="kpi-number kpi-white">{{ calculateAOV() | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <span class="kpi-foot">Per ticket · today</span>
          </div>

          <div class="aw-kpi">
            <span class="kpi-eyebrow">Annual Revenue</span>
            <div class="kpi-main">
              <span class="kpi-number kpi-white">{{ getAnnualRevenue() | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <span class="kpi-foot">{{ chartYear() }} total</span>
          </div>
        </section>

        <!-- ── AI OWNER INSIGHTS ──────────────────────────────────────────── -->
        <section class="aw-section">
          <div class="aw-section-head">
            <h2>Owner <span class="aw-accent">Insights</span></h2>
            <p class="aw-section-sub">Auto-generated observations from your current data</p>
          </div>
          <div class="aw-insights-grid">
            <div
              *ngFor="let card of ownerInsights()"
              class="insight-card"
              [class.insight-pos]="card.type === 'positive'"
              [class.insight-warn]="card.type === 'warning'"
              [class.insight-neutral]="card.type === 'neutral'"
            >
              <div class="ins-icon">{{ card.icon }}</div>
              <div class="ins-body">
                <div class="ins-title">{{ card.title }}</div>
                <div class="ins-text">{{ card.body }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── ANNUAL CHART ───────────────────────────────────────────────── -->
        <section class="aw-section">
          <div class="aw-section-head">
            <div>
              <h2>Annual Financial <span class="aw-accent">Health</span></h2>
              <p class="aw-section-sub">
                Monthly Revenue vs Expenses breakdown — hover any bar for exact values
              </p>
            </div>
            <div class="chart-controls">
              <label class="ctrl-label">Year</label>
              <input
                type="number"
                class="ctrl-input"
                [value]="chartYear()"
                (change)="onChartYearChange($event)"
              />
              <div class="chart-legend">
                <span class="leg-item"><span class="leg-dot ld-rev"></span>Revenue</span>
                <span class="leg-item"><span class="leg-dot ld-exp"></span>Expenses</span>
                <span class="leg-item"><span class="leg-dot ld-prof"></span>Profit</span>
              </div>
            </div>
          </div>

          <!-- SVG Chart -->
          <div class="chart-wrap" *ngIf="annualData().length; else noChart">
            <div class="svg-chart-container">
              <svg
                class="annual-svg"
                [attr.viewBox]="'0 0 ' + svgW + ' ' + svgH"
                preserveAspectRatio="xMidYMid meet"
              >
                <!-- ── Y-axis grid lines + labels ── -->
                <ng-container *ngFor="let tick of yAxisTicks(); let i = index">
                  <line
                    [attr.x1]="svgPadL"
                    [attr.y1]="getGridY(tick)"
                    [attr.x2]="svgW - svgPadR"
                    [attr.y2]="getGridY(tick)"
                    stroke="rgba(255,255,255,0.07)"
                    stroke-width="1"
                  />
                  <text
                    [attr.x]="svgPadL - 8"
                    [attr.y]="getGridY(tick) + 4"
                    text-anchor="end"
                    font-size="10"
                    fill="#555"
                    font-family="DM Sans, Segoe UI, sans-serif"
                  >{{ tick | number:'1.0-0' }}</text>
                </ng-container>

                <!-- ── Bars per month ── -->
                <ng-container *ngFor="let m of annualData(); let i = index">
                  <!-- Hover zone (invisible, full height) -->
                  <rect
                    [attr.x]="getColX(i)"
                    [attr.y]="svgPadT"
                    [attr.width]="colW"
                    [attr.height]="chartH"
                    fill="transparent"
                    style="cursor:pointer"
                    (mouseenter)="setHoveredMonth(m)"
                    (mouseleave)="setHoveredMonth(null)"
                  />

                  <!-- Revenue bar -->
                  <rect
                    [attr.x]="getColX(i) + barOff(0)"
                    [attr.y]="getSvgBarY(m.revenue)"
                    [attr.width]="barW"
                    [attr.height]="getSvgBarH(m.revenue)"
                    rx="3"
                    fill="#00e87a"
                    [attr.opacity]="hoveredMonth()?.month === m.month ? 1 : 0.85"
                  />
                  <!-- Expenses bar -->
                  <rect
                    [attr.x]="getColX(i) + barOff(1)"
                    [attr.y]="getSvgBarY(m.expenses)"
                    [attr.width]="barW"
                    [attr.height]="getSvgBarH(m.expenses)"
                    rx="3"
                    fill="#ff4444"
                    [attr.opacity]="hoveredMonth()?.month === m.month ? 1 : 0.85"
                  />
                  <!-- Profit bar -->
                  <rect
                    [attr.x]="getColX(i) + barOff(2)"
                    [attr.y]="getSvgBarY(Math.abs(m.profit))"
                    [attr.width]="barW"
                    [attr.height]="getSvgBarH(Math.abs(m.profit))"
                    rx="3"
                    [attr.fill]="m.profit >= 0 ? '#ffcc00' : '#ff6600'"
                    [attr.opacity]="hoveredMonth()?.month === m.month ? 1 : 0.85"
                  />

                  <!-- Month label -->
                  <text
                    [attr.x]="getColX(i) + colW / 2"
                    [attr.y]="svgPadT + chartH + 18"
                    text-anchor="middle"
                    font-size="9"
                    fill="#555"
                    font-weight="700"
                    font-family="DM Sans, Segoe UI, sans-serif"
                    letter-spacing="0.5"
                  >{{ m.month.substring(0,3).toUpperCase() }}</text>
                </ng-container>

                <!-- ── Hover Tooltip (rendered last = on top) ── -->
                <ng-container *ngIf="hoveredMonth() as hm">
                  <!-- Tooltip box -->
                  <rect
                    [attr.x]="getTooltipX(hm)"
                    [attr.y]="svgPadT + 4"
                    width="148"
                    height="88"
                    rx="8"
                    fill="#1c1c1c"
                    stroke="rgba(255,255,255,0.14)"
                    stroke-width="1"
                  />
                  <text
                    [attr.x]="getTooltipX(hm) + 12"
                    [attr.y]="svgPadT + 22"
                    font-size="11"
                    font-weight="700"
                    fill="#f0f0f0"
                    font-family="DM Sans, Segoe UI, sans-serif"
                  >{{ hm.month }}</text>
                  <!-- Revenue row -->
                  <circle [attr.cx]="getTooltipX(hm)+12" [attr.cy]="svgPadT+38" r="4" fill="#00e87a"/>
                  <text [attr.x]="getTooltipX(hm)+22" [attr.y]="svgPadT+42" font-size="10" fill="#aaa" font-family="DM Sans, Segoe UI, sans-serif">
                    Rev: <tspan fill="#f0f0f0" font-weight="600">₹{{ hm.revenue | number:'1.0-0' }}</tspan>
                  </text>
                  <!-- Expenses row -->
                  <circle [attr.cx]="getTooltipX(hm)+12" [attr.cy]="svgPadT+56" r="4" fill="#ff4444"/>
                  <text [attr.x]="getTooltipX(hm)+22" [attr.y]="svgPadT+60" font-size="10" fill="#aaa" font-family="DM Sans, Segoe UI, sans-serif">
                    Exp: <tspan fill="#f0f0f0" font-weight="600">₹{{ hm.expenses | number:'1.0-0' }}</tspan>
                  </text>
                  <!-- Profit row -->
                  <circle [attr.cx]="getTooltipX(hm)+12" [attr.cy]="svgPadT+74" r="4" [attr.fill]="hm.profit >= 0 ? '#ffcc00' : '#ff6600'"/>
                  <text [attr.x]="getTooltipX(hm)+22" [attr.y]="svgPadT+78" font-size="10" fill="#aaa" font-family="DM Sans, Segoe UI, sans-serif">
                    Profit: <tspan [attr.fill]="hm.profit >= 0 ? '#ffcc00' : '#ff6600'" font-weight="600">₹{{ hm.profit | number:'1.0-0' }}</tspan>
                  </text>
                </ng-container>
              </svg>
            </div>
            <div class="chart-x-title">Month · {{ chartYear() }}</div>
          </div>

          <ng-template #noChart>
            <div class="empty-chart">No revenue data available for {{ chartYear() }}</div>
          </ng-template>
        </section>

        <!-- ── PAYMENT DISTRIBUTION ──────────────────────────────────────── -->
        <section class="aw-section">
          <div class="aw-section-head">
            <div>
              <h2>Payment <span class="aw-accent">Distribution</span></h2>
              <p class="aw-section-sub">Daily online vs cash transaction volume — hover to inspect</p>
            </div>
            <div class="chart-controls">
              <label class="ctrl-label">Month</label>
              <select class="ctrl-input ctrl-select" (change)="onMonthChange($event)">
                <option
                  *ngFor="let m of monthNames; let i = index"
                  [value]="i + 1"
                  [selected]="i + 1 === selectedMonth()"
                >{{ m }}</option>
              </select>
              <label class="ctrl-label">Year</label>
              <input
                type="number"
                class="ctrl-input"
                [value]="selectedYear()"
                (change)="onYearChange($event)"
              />
            </div>
          </div>

          <div class="payment-split">
            <!-- Summary cards -->
            <div class="pay-cards">
              <div class="pay-card pay-online">
                <div class="pay-card-top">
                  <span class="pay-icon">💳</span>
                  <div>
                    <div class="pay-label">Online (KillaPay)</div>
                    <div class="pay-count">{{ paymentStats()?.totalOnlineCount || 0 }} transactions</div>
                  </div>
                </div>
                <div class="pay-amount">
                  ₹{{ getTotalOnlineRevenue() | number:'1.0-0' }}
                </div>
              </div>
              <div class="pay-card pay-cash">
                <div class="pay-card-top">
                  <span class="pay-icon">💵</span>
                  <div>
                    <div class="pay-label">Cash / UPI</div>
                    <div class="pay-count">{{ paymentStats()?.totalOfflineCount || 0 }} transactions</div>
                  </div>
                </div>
                <div class="pay-amount">
                  ₹{{ getTotalOfflineRevenue() | number:'1.0-0' }}
                </div>
              </div>
              <div class="pay-card pay-ratio">
                <div class="pay-card-top">
                  <span class="pay-icon">📊</span>
                  <div>
                    <div class="pay-label">Digital Adoption</div>
                    <div class="pay-count">Online transaction share</div>
                  </div>
                </div>
                <div class="pay-amount">{{ getOnlineRatio() }}%</div>
              </div>
            </div>

            <!-- Sparkline chart with hover -->
            <div class="spark-wrap">
              <div class="spark-title-row">
                <span class="spark-y-label">Daily Revenue (₹)</span>
              </div>
              <div class="spark-chart-area" (mousemove)="onSparkHover($event)" (mouseleave)="sparkHoverDay.set(null)" #sparkRef>
                <svg class="spark-svg" viewBox="0 0 1000 200" preserveAspectRatio="none">
                  <!-- Grid lines -->
                  <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                  <line x1="0" y1="100" x2="1000" y2="100" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                  <line x1="0" y1="150" x2="1000" y2="150" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>

                  <!-- Online area fill -->
                  <path
                    [attr.d]="getSparkAreaPath('online')"
                    fill="rgba(255,204,0,0.1)"
                  />
                  <!-- Cash area fill -->
                  <path
                    [attr.d]="getSparkAreaPath('offline')"
                    fill="rgba(255,68,68,0.1)"
                  />

                  <!-- Online line -->
                  <polyline
                    fill="none"
                    stroke="#ffcc00"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                    [attr.points]="getLinePoints('online')"
                  />
                  <!-- Cash line -->
                  <polyline
                    fill="none"
                    stroke="#ff4444"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                    [attr.points]="getLinePoints('offline')"
                  />

                  <!-- Hover vertical line -->
                  <line
                    *ngIf="sparkHoverDay() !== null"
                    [attr.x1]="getSparkX(sparkHoverDay()!)"
                    y1="0"
                    [attr.x2]="getSparkX(sparkHoverDay()!)"
                    y2="200"
                    stroke="rgba(255,255,255,0.3)"
                    stroke-width="1"
                    stroke-dasharray="4 3"
                  />
                  <!-- Hover dots -->
                  <circle
                    *ngIf="sparkHoverDay() !== null"
                    [attr.cx]="getSparkX(sparkHoverDay()!)"
                    [attr.cy]="getSparkY('online', sparkHoverDay()!)"
                    r="5"
                    fill="#ffcc00"
                  />
                  <circle
                    *ngIf="sparkHoverDay() !== null"
                    [attr.cx]="getSparkX(sparkHoverDay()!)"
                    [attr.cy]="getSparkY('offline', sparkHoverDay()!)"
                    r="5"
                    fill="#ff4444"
                  />
                </svg>

                <!-- Hover tooltip -->
                <div
                  class="spark-tooltip"
                  *ngIf="sparkHoverDay() !== null"
                  [style.left.px]="sparkTooltipX()"
                >
                  <div class="st-day">Day {{ getDayData(sparkHoverDay()!)?.day }}</div>
                  <div class="st-row"><span class="st-dot" style="background:#ffcc00"></span>Online: ₹{{ getDayData(sparkHoverDay()!)?.online | number:'1.0-0' }}</div>
                  <div class="st-row"><span class="st-dot" style="background:#ff4444"></span>Cash: ₹{{ getDayData(sparkHoverDay()!)?.offline | number:'1.0-0' }}</div>
                </div>
              </div>
              <!-- X labels -->
              <div class="spark-x-labels">
                <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>{{ getDaysInMonth() }}</span>
              </div>
              <div class="spark-legend">
                <span class="leg-item"><span class="leg-dot" style="background:#ffcc00"></span>Online</span>
                <span class="leg-item"><span class="leg-dot" style="background:#ff4444"></span>Cash/UPI</span>
                <span class="spark-x-title">Day of Month · {{ monthNames[selectedMonth()-1] }} {{ selectedYear() }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ── EXPENSE FORM + LEDGER SPLIT ───────────────────────────────── -->
        <section class="aw-section">
          <div class="expense-split">

            <!-- Form -->
            <div class="exp-form-panel">
              <div class="aw-section-head" style="margin-bottom:28px">
                <div>
                  <h2>{{ editingId() ? 'Update' : 'Log' }} <span class="aw-accent">Expense</span></h2>
                  <p class="aw-section-sub">Record business costs for accurate P&L tracking</p>
                </div>
              </div>

              <form #expenseForm (ngSubmit)="submitExpense()" class="exp-form">
                <div class="ef-group">
                  <label class="ef-label">Description</label>
                  <input
                    class="ef-input"
                    type="text"
                    name="description"
                    [(ngModel)]="formDesc"
                    placeholder="e.g. Electricity, Raw Materials, Staff Wages"
                    required
                  />
                </div>

                <div class="ef-row">
                  <div class="ef-group">
                    <label class="ef-label">Amount (₹)</label>
                    <input
                      class="ef-input"
                      type="number"
                      name="amount"
                      [(ngModel)]="formAmount"
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>
                  <div class="ef-group">
                    <label class="ef-label">Period</label>
                    <select class="ef-input ef-select" name="expenseMonth" [(ngModel)]="formMonth">
                      <option *ngFor="let m of monthNames" [value]="m">{{ m }}</option>
                    </select>
                  </div>
                </div>

                <div class="ef-group">
                  <label class="ef-label">Fiscal Year</label>
                  <input
                    class="ef-input"
                    type="number"
                    name="expenseYear"
                    [(ngModel)]="formYear"
                    required
                  />
                </div>

                <div class="ef-actions">
                  <button type="submit" class="btn-primary-k">
                    {{ editingId() ? '↑ Sync Update' : '+ Record Expense' }}
                  </button>
                  <button *ngIf="editingId()" type="button" (click)="cancelEdit()" class="btn-ghost-k">
                    Cancel
                  </button>
                </div>

                <div *ngIf="formError()" class="ef-error">{{ formError() }}</div>
                <div *ngIf="formSuccess()" class="ef-success">{{ formSuccess() }}</div>
              </form>
            </div>

            <!-- Ledger table -->
            <div class="exp-ledger-panel">
              <div class="aw-section-head" style="margin-bottom:20px">
                <div>
                  <h2>Expense <span class="aw-accent">Ledger</span></h2>
                  <p class="aw-section-sub">{{ expenses().length }} records · total ₹{{ getTotalExpenses() | number:'1.0-0' }}</p>
                </div>
              </div>

              <div class="ledger-scroll">
                <table class="killa-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th class="ta-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let exp of expenses()"
                      [class.row-editing]="editingId() === exp._id"
                    >
                      <td><span class="cell-desc">{{ exp.description }}</span></td>
                      <td><span class="cell-period">{{ exp.month }} {{ exp.year }}</span></td>
                      <td><span class="cell-amt">₹{{ exp.amount | number:'1.0-0' }}</span></td>
                      <td class="ta-right">
                        <button (click)="startEdit(exp)" class="btn-tbl btn-tbl-edit">Edit</button>
                        <button (click)="deleteExpense(exp._id)" class="btn-tbl btn-tbl-del">Delete</button>
                      </td>
                    </tr>
                    <tr *ngIf="!expenses().length">
                      <td colspan="4" class="empty-row">No expenses recorded yet.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

      </div><!-- /aw-body -->

      <!-- ── LOADER ─────────────────────────────────────────────────────── -->
      <div *ngIf="isLoading()" class="aw-loader">
        <div class="loader-inner">
          <div class="loader-ring"></div>
          <p>Crunching numbers...</p>
        </div>
      </div>

    </div><!-- /aw-root -->
  `,
  styles: [`
    /* ─── ROOT ─────────────────────────────────────────────────────────── */
    :host {
      --orange: #ff6600;
      --orange-dim: rgba(255,102,0,0.15);
      --green: #00e87a;
      --red: #ff4444;
      --yellow: #ffcc00;
      --bg0: #050505;
      --bg1: #0d0d0d;
      --bg2: #141414;
      --bg3: #1a1a1a;
      --border: rgba(255,255,255,0.07);
      --border-bright: rgba(255,255,255,0.14);
      --text: #f0f0f0;
      --muted: #555;
      --muted2: #333;
      display: block;
    }

    .aw-root {
      background: var(--bg0);
      min-height: 100vh;
      color: var(--text);
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
    }

    /* ─── HEADER ────────────────────────────────────────────────────────── */
    .aw-header {
      padding: 120px 40px 40px;
      background: linear-gradient(180deg, #0a0a0a 0%, transparent 100%);
      border-bottom: 1px solid var(--border);
    }
    .aw-header-inner {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .aw-eyebrow {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--orange);
      margin-bottom: 10px;
    }
    .aw-title {
      font-size: 3.2rem;
      font-weight: 900;
      letter-spacing: -2px;
      margin: 0 0 6px;
      line-height: 1;
    }
    .aw-accent { color: var(--orange); }
    .aw-sub { color: var(--muted); font-size: 0.9rem; margin: 0; }
    .aw-live-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(0,232,122,0.08);
      border: 1px solid rgba(0,232,122,0.2);
      padding: 10px 20px;
      border-radius: 40px;
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 2px;
      color: var(--green);
    }
    .aw-pulse {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }

    /* ─── BODY ──────────────────────────────────────────────────────────── */
    .aw-body {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 40px 80px;
      display: flex;
      flex-direction: column;
      gap: 60px;
    }

    /* ─── KPI STRIP ─────────────────────────────────────────────────────── */
    .aw-kpi-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }
    .aw-kpi {
      background: var(--bg1);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.2s;
    }
    .aw-kpi:hover { border-color: var(--border-bright); }
    .kpi-eyebrow {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--muted);
    }
    .kpi-main { display: flex; align-items: baseline; gap: 6px; }
    .kpi-number {
      font-size: 1.8rem;
      font-weight: 900;
      letter-spacing: -1px;
      line-height: 1;
    }
    .kpi-white { color: var(--text); }
    .kpi-pos .kpi-number { color: var(--green); }
    .kpi-neg .kpi-number { color: var(--red); }
    .kpi-symbol { font-size: 1rem; }
    .kpi-pos .kpi-symbol { color: var(--green); }
    .kpi-neg .kpi-symbol { color: var(--red); }
    .kpi-foot { font-size: 0.72rem; color: var(--muted); }
    .kpi-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 5px;
    }
    .pill-g { background: rgba(0,232,122,0.1); color: var(--green); }
    .pill-r { background: rgba(255,68,68,0.1); color: var(--red); }

    /* ─── SECTION ───────────────────────────────────────────────────────── */
    .aw-section { display: flex; flex-direction: column; gap: 24px; }
    .aw-section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 20px;
    }
    .aw-section-head h2 {
      font-size: 1.8rem;
      font-weight: 900;
      letter-spacing: -1px;
      margin: 0 0 4px;
    }
    .aw-section-sub { color: var(--muted); font-size: 0.82rem; margin: 0; }

    /* ─── OWNER INSIGHTS ────────────────────────────────────────────────── */
    .aw-insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .insight-card {
      background: var(--bg1);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 22px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      transition: transform 0.2s, border-color 0.2s;
    }
    .insight-card:hover { transform: translateY(-3px); }
    .insight-pos { border-left: 3px solid var(--green); }
    .insight-warn { border-left: 3px solid var(--yellow); }
    .insight-neutral { border-left: 3px solid var(--muted2); }
    .ins-icon { font-size: 1.6rem; flex-shrink: 0; }
    .ins-title { font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 6px; }
    .ins-text { font-size: 0.88rem; color: var(--text); line-height: 1.5; }

    /* ─── ANNUAL CHART ──────────────────────────────────────────────────── */
    .chart-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .ctrl-label { font-size: 0.65rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    .ctrl-input {
      background: var(--bg2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.85rem;
      width: 80px;
    }
    .ctrl-select { width: 120px; }
    .chart-legend { display: flex; gap: 16px; }
    .leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    .leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .ld-rev { background: var(--green); }
    .ld-exp { background: var(--red); }
    .ld-prof { background: var(--yellow); }

    /* ✅ SVG CHART — no float, no percentage-height chains, no overflow clipping */
    .chart-wrap {
      background: var(--bg1);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 24px 24px 12px;
    }
    .svg-chart-container {
      width: 100%;
    }
    .annual-svg {
      width: 100%;
      height: auto;
      display: block;
      overflow: visible;
    }
    .chart-x-title {
      text-align: center;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 12px;
      clear: both;
    }
    .empty-chart {
      background: var(--bg1);
      border: 1px dashed var(--border);
      border-radius: 24px;
      padding: 60px;
      text-align: center;
      color: var(--muted);
      font-size: 0.9rem;
    }

    /* Chart tooltip */
    .chart-tooltip {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #1c1c1c;
      border: 1px solid var(--border-bright);
      border-radius: 12px;
      padding: 12px 16px;
      min-width: 160px;
      font-size: 0.75rem;
      opacity: 0;
      pointer-events: none;
      z-index: 10;
      transition: opacity 0.15s;
      white-space: nowrap;
    }
    .chart-tooltip.visible { opacity: 1; }
    .tt-month { font-weight: 900; font-size: 0.8rem; margin-bottom: 8px; color: var(--text); }
    .tt-row { display: flex; align-items: center; gap: 6px; padding: 2px 0; font-size: 0.72rem; color: #aaa; }
    .tt-row strong { color: var(--text); }
    .tt-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .tt-pos .tt-dot { background: var(--yellow); }
    .tt-neg .tt-dot { background: var(--orange); }
    .tt-rev .tt-dot { background: var(--green); }
    .tt-exp .tt-dot { background: var(--red); }

    /* ─── PAYMENT SECTION ───────────────────────────────────────────────── */
    .payment-split {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 24px;
    }
    .pay-cards { display: flex; flex-direction: column; gap: 16px; }
    .pay-card {
      background: var(--bg1);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 22px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: border-color 0.2s;
    }
    .pay-card:hover { border-color: var(--border-bright); }
    .pay-online { border-left: 3px solid var(--yellow); }
    .pay-cash { border-left: 3px solid var(--red); }
    .pay-ratio { border-left: 3px solid var(--orange); }
    .pay-card-top { display: flex; align-items: center; gap: 14px; }
    .pay-icon { font-size: 1.5rem; background: var(--bg2); width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .pay-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
    .pay-count { font-size: 0.82rem; font-weight: 700; color: var(--text); margin-top: 3px; }
    .pay-amount { font-size: 1.3rem; font-weight: 900; color: var(--text); }

    /* Sparkline */
    .spark-wrap {
      background: var(--bg1);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .spark-title-row { display: flex; align-items: center; gap: 12px; }
    .spark-y-label { font-size: 0.65rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    .spark-chart-area {
      position: relative;
      width: 100%;
      height: 140px;
    }
    .spark-svg { width: 100%; height: 100%; }
    .spark-tooltip {
      position: absolute;
      top: 0;
      background: #1c1c1c;
      border: 1px solid var(--border-bright);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.72rem;
      pointer-events: none;
      z-index: 5;
      min-width: 140px;
      transform: translateX(-50%);
    }
    .st-day { font-weight: 900; color: var(--text); margin-bottom: 6px; font-size: 0.78rem; }
    .st-row { display: flex; align-items: center; gap: 6px; color: #aaa; padding: 2px 0; }
    .st-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .spark-x-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--muted);
    }
    .spark-legend { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .spark-x-title { font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin-left: auto; }

    /* ─── EXPENSE FORM + LEDGER ─────────────────────────────────────────── */
    .expense-split {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 24px;
      align-items: start;
    }
    .exp-form-panel, .exp-ledger-panel {
      background: var(--bg1);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 36px;
    }
    .exp-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .ef-group { display: flex; flex-direction: column; gap: 8px; }
    .ef-label { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); }
    .ef-input {
      background: var(--bg0);
      border: 1px solid var(--muted2);
      color: var(--text);
      padding: 14px 16px;
      border-radius: 12px;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .ef-input:focus { outline: none; border-color: var(--orange); box-shadow: 0 0 0 3px var(--orange-dim); }
    .ef-select { appearance: none; cursor: pointer; }
    .ef-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ef-actions { display: flex; flex-direction: column; gap: 10px; }
    .btn-primary-k {
      padding: 16px;
      background: var(--orange);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-weight: 900;
      font-size: 0.9rem;
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: opacity 0.2s, transform 0.2s;
    }
    .btn-primary-k:hover { opacity: 0.88; transform: translateY(-2px); }
    .btn-ghost-k {
      padding: 12px;
      background: var(--bg2);
      color: var(--muted);
      border: 1px solid var(--border);
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .btn-ghost-k:hover { border-color: var(--border-bright); color: var(--text); }
    .ef-error { background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.3); color: var(--red); padding: 12px 16px; border-radius: 10px; font-size: 0.8rem; }
    .ef-success { background: rgba(0,232,122,0.1); border: 1px solid rgba(0,232,122,0.3); color: var(--green); padding: 12px 16px; border-radius: 10px; font-size: 0.8rem; }

    /* Ledger table */
    .ledger-scroll { overflow-x: auto; }
    .killa-table { width: 100%; border-collapse: collapse; }
    .killa-table th {
      padding: 14px 16px;
      background: var(--bg2);
      color: var(--muted);
      font-size: 0.62rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      text-align: left;
    }
    .killa-table th:first-child { border-radius: 8px 0 0 8px; }
    .killa-table th:last-child { border-radius: 0 8px 8px 0; }
    .killa-table td {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    .row-editing td { background: rgba(255,102,0,0.05); }
    .row-editing { border-left: 2px solid var(--orange); }
    .cell-desc { font-weight: 700; color: #e0e0e0; font-size: 0.88rem; }
    .cell-period { background: var(--bg2); padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; color: var(--muted); font-weight: 700; }
    .cell-amt { color: var(--red); font-weight: 800; font-variant-numeric: tabular-nums; }
    .ta-right { text-align: right; }
    .btn-tbl {
      background: none;
      border: 1px solid var(--border);
      color: var(--muted);
      padding: 5px 12px;
      border-radius: 7px;
      font-size: 0.7rem;
      font-weight: 800;
      cursor: pointer;
      margin-left: 6px;
      transition: border-color 0.15s, color 0.15s;
    }
    .btn-tbl-edit:hover { border-color: var(--orange); color: var(--orange); }
    .btn-tbl-del:hover { border-color: var(--red); color: var(--red); }
    .empty-row { text-align: center; color: var(--muted); padding: 40px; font-size: 0.85rem; }

    /* ─── LOADER ────────────────────────────────────────────────────────── */
    .aw-loader {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.88);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .loader-inner { text-align: center; }
    .loader-ring {
      width: 48px; height: 48px;
      border: 4px solid var(--bg2);
      border-top-color: var(--orange);
      border-radius: 50%;
      margin: 0 auto 18px;
      animation: spin 0.8s linear infinite;
    }
    .loader-inner p { color: var(--muted); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── RESPONSIVE ────────────────────────────────────────────────────── */
    @media (max-width: 1200px) {
      .aw-kpi-strip { grid-template-columns: repeat(3, 1fr); }
      .payment-split { grid-template-columns: 1fr; }
      .expense-split { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .aw-header { padding: 100px 20px 30px; }
      .aw-body { padding: 24px 20px 60px; }
      .aw-kpi-strip { grid-template-columns: 1fr 1fr; }
      .aw-title { font-size: 2.2rem; }
      .chart-inner { margin-left: 0; }
      .chart-y-axis { display: none; }
    }
  `],
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  @ViewChild('sparkRef') sparkRef!: ElementRef<HTMLDivElement>;

  // ── Signals ──────────────────────────────────────────────────────────────
  todayData      = signal<TodayData | null>(null);
  annualData     = signal<MonthlyProfitData[]>([]);
  expenses       = signal<Expense[]>([]);
  paymentStats   = signal<PaymentStats | null>(null);

  selectedMonth  = signal<number>(new Date().getMonth() + 1);
  selectedYear   = signal<number>(new Date().getFullYear());
  chartYear      = signal<number>(new Date().getFullYear());
  isLoading      = signal<boolean>(true);
  hoveredMonth   = signal<MonthlyProfitData | null>(null);
  sparkHoverDay  = signal<number | null>(null);

  formError      = signal<string>('');
  formSuccess    = signal<string>('');
  editingId      = signal<string | null>(null);

  // ── Static data ──────────────────────────────────────────────────────────
  readonly monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  readonly currentDayLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  readonly currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'long' });
  readonly Math = Math;

  // ── Form state ───────────────────────────────────────────────────────────
  formDesc   = '';
  formAmount: number | null = null;
  formMonth  = this.monthNames[new Date().getMonth()];
  formYear   = new Date().getFullYear();

  // ── Computed: Owner Insights ─────────────────────────────────────────────
  ownerInsights = computed<InsightCard[]>(() => {
    const insights: InsightCard[] = [];
    const annual = this.annualData();
    const today  = this.todayData();

    if (!annual.length) return [];

    // 1. Best performing month
    const best = [...annual].sort((a, b) => b.profit - a.profit)[0];
    if (best && best.profit > 0) {
      insights.push({
        icon: '🏆',
        title: 'Best Month',
        body: `${best.month} was your strongest month with ₹${best.profit.toLocaleString('en-IN')} net profit.`,
        type: 'positive',
      });
    }

    // 2. Worst month / loss alert
    const worst = [...annual].sort((a, b) => a.profit - b.profit)[0];
    if (worst && worst.profit < 0) {
      insights.push({
        icon: '⚠️',
        title: 'Loss Alert',
        body: `${worst.month} recorded a loss of ₹${Math.abs(worst.profit).toLocaleString('en-IN')}. Review expenses for that period.`,
        type: 'warning',
      });
    }

    // 3. Revenue trend (last 3 months)
    const last3 = annual.slice(-3).filter(m => m.revenue > 0);
    if (last3.length === 3) {
      const isGrowing = last3[2].revenue > last3[1].revenue && last3[1].revenue > last3[0].revenue;
      const isDeclining = last3[2].revenue < last3[1].revenue && last3[1].revenue < last3[0].revenue;
      if (isGrowing) {
        insights.push({
          icon: '📈',
          title: 'Growing Trend',
          body: `Revenue has increased 3 months in a row. Keep up the momentum!`,
          type: 'positive',
        });
      } else if (isDeclining) {
        insights.push({
          icon: '📉',
          title: 'Declining Revenue',
          body: `Revenue has dropped for 3 consecutive months. Consider promotions or menu changes.`,
          type: 'warning',
        });
      }
    }

    // 4. Expense vs revenue ratio
    const currentMonthData = this.getMonthData();
    if (currentMonthData && currentMonthData.revenue > 0) {
      const ratio = (currentMonthData.expenses / currentMonthData.revenue) * 100;
      if (ratio > 80) {
        insights.push({
          icon: '🔴',
          title: 'High Expense Ratio',
          body: `This month's expenses are ${ratio.toFixed(0)}% of revenue. Consider cutting costs to improve margins.`,
          type: 'warning',
        });
      } else if (ratio < 50) {
        insights.push({
          icon: '💰',
          title: 'Strong Margins',
          body: `Expenses are only ${ratio.toFixed(0)}% of revenue this month. Excellent cost control!`,
          type: 'positive',
        });
      }
    }

    // 5. AOV insight
    if (today && today.totalOrders > 0) {
      const aov = today.totalRevenue / today.totalOrders;
      insights.push({
        icon: '🧾',
        title: `Today's Avg Ticket`,
        body: `Average order value is ₹${aov.toLocaleString('en-IN', { maximumFractionDigits: 0 })} today across ${today.totalOrders} orders.`,
        type: aov > 300 ? 'positive' : 'neutral',
      });
    }

    // 6. Payment mix
    const ps = this.paymentStats();
    if (ps) {
      const total = ps.totalOnlineCount + ps.totalOfflineCount;
      if (total > 0) {
        const pct = Math.round((ps.totalOnlineCount / total) * 100);
        insights.push({
          icon: '💳',
          title: 'Digital Payments',
          body: `${pct}% of transactions this month are digital. ${pct > 60 ? 'Great digital adoption!' : 'Encourage customers to pay online.'}`,
          type: pct > 50 ? 'positive' : 'neutral',
        });
      }
    }

    return insights;
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.isLoading.set(true);
    this.formError.set('');
    this.formSuccess.set('');

    forkJoin({
      today:    this.analyticsService.getTodayAnalytics().pipe(catchError(() => of(null))),
      expenses: this.analyticsService.getExpenseList().pipe(catchError(() => of([]))),
      payment:  this.analyticsService.getPaymentComparison(this.selectedMonth(), this.selectedYear()).pipe(catchError(() => of(null))),
      annual:   this.analyticsService.getAnnualProfitLoss(this.chartYear()).pipe(catchError(() => of([]))),
    }).subscribe(({ today, expenses, payment, annual }) => {
      this.todayData.set(today as TodayData | null);
      this.expenses.set((expenses as Expense[]) || []);
      this.paymentStats.set(payment as PaymentStats | null);

      const annualArr = Array.isArray(annual) ? annual : [];
      this.annualData.set(annualArr.map((m: any) => ({
        ...m,
        profit: (m.profit !== undefined) ? m.profit : m.revenue - m.expenses,
      })));

      this.isLoading.set(false);
    });
  }

  refreshPayment() {
    this.analyticsService
      .getPaymentComparison(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of(null)))
      .subscribe(data => this.paymentStats.set(data as PaymentStats | null));
  }

  refreshAnnual() {
    this.analyticsService
      .getAnnualProfitLoss(this.chartYear())
      .pipe(catchError(() => of([])))
      .subscribe((data: any) => {
        const arr = Array.isArray(data) ? data : [];
        this.annualData.set(arr.map((m: any) => ({
          ...m,
          profit: m.profit !== undefined ? m.profit : m.revenue - m.expenses,
        })));
      });
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  submitExpense() {
    this.formError.set('');
    this.formSuccess.set('');

    if (!this.formDesc.trim() || !this.formAmount) {
      this.formError.set('Please fill in all required fields.');
      return;
    }
    if (this.formAmount <= 0) {
      this.formError.set('Amount must be greater than zero.');
      return;
    }

    const payload = {
      description: this.formDesc.trim(),
      amount: Number(this.formAmount),
      month: this.formMonth,
      year: Number(this.formYear),
    };

    if (this.editingId()) {
      this.analyticsService.updateExpense(this.editingId()!, payload).subscribe({
        next: () => {
          this.formSuccess.set('Expense updated successfully.');
          this.cancelEdit();
          this.refreshAll();
        },
        error: () => this.formError.set('Failed to update expense. Try again.'),
      });
    } else {
      this.analyticsService.addExpense(payload).subscribe({
        next: () => {
          this.formSuccess.set('Expense recorded successfully.');
          this.resetForm();
          this.refreshAll();
        },
        error: () => this.formError.set('Failed to save expense. Try again.'),
      });
    }
  }

  resetForm() {
    this.formDesc   = '';
    this.formAmount = null;
    this.formMonth  = this.monthNames[new Date().getMonth()];
    this.formYear   = new Date().getFullYear();
  }

  deleteExpense(id: string) {
    if (!confirm('Permanently remove this expense from the ledger?')) return;
    this.analyticsService.deleteExpense(id).subscribe({
      next: () => this.refreshAll(),
      error: () => alert('Delete failed.'),
    });
  }

  startEdit(expense: Expense) {
    this.editingId.set(expense._id);
    this.formDesc   = expense.description;
    this.formAmount = expense.amount;
    this.formMonth  = expense.month || this.monthNames[new Date().getMonth()];
    this.formYear   = expense.year || new Date().getFullYear();
    this.formError.set('');
    this.formSuccess.set('');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.resetForm();
    this.formError.set('');
    this.formSuccess.set('');
  }

  // ── Event handlers ───────────────────────────────────────────────────────
  onMonthChange(event: Event) {
    this.selectedMonth.set(Number((event.target as HTMLSelectElement).value));
    this.refreshPayment();
  }
  onYearChange(event: Event) {
    const yr = Number((event.target as HTMLInputElement).value);
    if (yr >= 2000 && yr <= 2100) {
      this.selectedYear.set(yr);
      this.refreshPayment();
    }
  }
  onChartYearChange(event: Event) {
    const yr = Number((event.target as HTMLInputElement).value);
    if (yr >= 2000 && yr <= 2100) {
      this.chartYear.set(yr);
      this.refreshAnnual();
    }
  }

  setHoveredMonth(m: MonthlyProfitData | null) {
    this.hoveredMonth.set(m);
  }

  // ── Sparkline hover ──────────────────────────────────────────────────────
  onSparkHover(event: MouseEvent) {
    const stats = this.paymentStats()?.dailyStats;
    if (!stats?.length) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const pct = (event.clientX - rect.left) / rect.width;
    const idx = Math.round(pct * (stats.length - 1));
    this.sparkHoverDay.set(Math.max(0, Math.min(stats.length - 1, idx)));
  }

  sparkTooltipX() {
    const idx = this.sparkHoverDay();
    if (idx === null) return 0;
    const stats = this.paymentStats()?.dailyStats;
    if (!stats?.length) return 0;
    const rect = this.sparkRef?.nativeElement?.getBoundingClientRect();
    if (!rect) return 0;
    return (idx / (stats.length - 1)) * rect.width;
  }

  getDayData(idx: number) {
    return this.paymentStats()?.dailyStats?.[idx] ?? null;
  }

  getSparkX(idx: number): number {
    const stats = this.paymentStats()?.dailyStats;
    if (!stats?.length) return 0;
    return (idx / (stats.length - 1)) * 1000;
  }

  getSparkY(type: 'online' | 'offline', idx: number): number {
    const stats = this.paymentStats()?.dailyStats;
    if (!stats?.length) return 100;
    const maxVal = Math.max(...stats.map(d => Math.max(d.online, d.offline)), 1);
    const val = stats[idx]?.[type] ?? 0;
    return 190 - (val / maxVal) * 170;
  }

  // ── SVG Chart constants ───────────────────────────────────────────────────
  readonly svgW    = 900;   // viewBox width
  readonly svgH    = 320;   // viewBox height
  readonly svgPadL = 56;    // left padding for y-axis labels
  readonly svgPadR = 12;    // right padding
  readonly svgPadT = 16;    // top padding
  readonly svgPadB = 30;    // bottom padding for x-axis labels
  get chartH()  { return this.svgH - this.svgPadT - this.svgPadB; }  // 274
  get chartW()  { return this.svgW - this.svgPadL - this.svgPadR; }  // 832
  get colW()    { return this.chartW / 12; }                           // ~69
  get barW()    { return Math.max(6, this.colW / 5 - 1); }            // ~12
  barOff(i: 0|1|2): number {
    const total = this.barW * 3 + 4;
    const start = (this.colW - total) / 2;
    return start + i * (this.barW + 2);
  }

  // ── SVG chart helpers ─────────────────────────────────────────────────────
  yAxisTicks(): number[] {
    const max = this.getMaxVal();
    // top → bottom: max down to 0
    return [max, max * 0.75, max * 0.5, max * 0.25, 0];
  }

  getMaxVal(): number {
    const data = this.annualData();
    if (!data.length) return 10000;
    const vals = data.flatMap(m => [m.revenue, m.expenses, Math.abs(m.profit)]);
    return Math.max(...vals, 1000);
  }

  /** SVG y-coordinate for a grid line at value `v` (max=top, 0=bottom) */
  getGridY(v: number): number {
    const max = this.getMaxVal();
    return this.svgPadT + this.chartH * (1 - v / max);
  }

  /** X position of the left edge of column `i` */
  getColX(i: number): number {
    return this.svgPadL + i * this.colW;
  }

  /** SVG y of the top of a bar for value `v` */
  getSvgBarY(v: number): number {
    const max = this.getMaxVal();
    const h = (v / max) * this.chartH;
    return this.svgPadT + this.chartH - h;
  }

  /** SVG height of a bar for value `v` (min 2px when > 0) */
  getSvgBarH(v: number): number {
    if (!v) return 0;
    const max = this.getMaxVal();
    return Math.max((v / max) * this.chartH, 2);
  }

  /** Tooltip x — clamp so it never goes off-canvas */
  getTooltipX(m: MonthlyProfitData): number {
    const idx = this.annualData().indexOf(m);
    const cx  = this.getColX(idx) + this.colW / 2;
    return Math.min(Math.max(cx - 74, this.svgPadL), this.svgW - this.svgPadR - 152);
  }

  // Kept for any legacy callers
  getBarHeight(val: number): number {
    const max = this.getMaxVal();
    if (max === 0) return 0;
    return Math.max((val / max) * 100, val > 0 ? 1 : 0);
  }
  getBarHeightPx(val: number): number {
    return this.getSvgBarH(val);
  }

  // ── KPI computed helpers ──────────────────────────────────────────────────
  private getMonthData(): MonthlyProfitData | undefined {
    const currentIdx = new Date().getMonth();
    const shortName  = this.monthNames[currentIdx].substring(0, 3).toUpperCase();
    const fullName   = this.monthNames[currentIdx].toUpperCase();
    return this.annualData().find(m => {
      const mUp = m.month.toUpperCase();
      return mUp === shortName || mUp === fullName;
    });
  }

  getCurrentMonthProfit()   { return this.getMonthData()?.profit   ?? 0; }
  getCurrentMonthRevenue()  { return this.getMonthData()?.revenue  ?? 0; }
  getCurrentMonthExpenses() { return this.getMonthData()?.expenses ?? 0; }

  calculateAOV(): number {
    const d = this.todayData();
    return d?.totalOrders ? d.totalRevenue / d.totalOrders : 0;
  }

  getAnnualRevenue(): number {
    return this.annualData().reduce((sum, m) => sum + m.revenue, 0);
  }

  getTotalExpenses(): number {
    return this.expenses().reduce((sum, e) => sum + e.amount, 0);
  }

  getTotalOnlineRevenue(): number {
    return this.paymentStats()?.dailyStats?.reduce((s, d) => s + d.online, 0) ?? 0;
  }

  getTotalOfflineRevenue(): number {
    return this.paymentStats()?.dailyStats?.reduce((s, d) => s + d.offline, 0) ?? 0;
  }

  getOnlineRatio(): number {
    const ps = this.paymentStats();
    if (!ps) return 0;
    const total = ps.totalOnlineCount + ps.totalOfflineCount;
    return total > 0 ? Math.round((ps.totalOnlineCount / total) * 100) : 0;
  }

  getDaysInMonth(): number {
    return new Date(this.selectedYear(), this.selectedMonth(), 0).getDate();
  }

  // ── Sparkline points ──────────────────────────────────────────────────────
  getLinePoints(type: 'online' | 'offline'): string {
    const stats = this.paymentStats()?.dailyStats;
    if (!stats || stats.length < 1) return '';
    if (stats.length === 1) return `0,100 1000,100`;
    const maxVal = Math.max(...stats.map(d => Math.max(d.online, d.offline)), 1);
    return stats
      .map((d, i) => {
        const x = (i / (stats.length - 1)) * 1000;
        const y = 190 - (d[type] / maxVal) * 170;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  getSparkAreaPath(type: 'online' | 'offline'): string {
    const pts = this.getLinePoints(type);
    if (!pts) return '';
    return `M0,200 L${pts.split(' ').join(' L')} L1000,200 Z`;
  }
}