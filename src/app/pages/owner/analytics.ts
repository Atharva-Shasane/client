import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, AnalyticsData } from '../../services/analytics';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <!-- Dashboard Header -->
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

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-overlay">
        <div class="loader"></div>
        <p>Syncing with Killa-Resto Engine...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading()" class="analytics-content fade-in">
        <!-- Today's Primary KPI Grid -->
        <section class="metrics-section">
          <h2 class="section-title">Today's Performance</h2>
          <div class="metrics-grid">
            <!-- Revenue -->
            <div class="kpi-card revenue-card">
              <div class="kpi-icon">💸</div>
              <div class="kpi-info">
                <span class="label">Gross Revenue</span>
                <h3 class="value">{{ todayData()?.totalRevenue || 0 | currency: 'INR' }}</h3>
                <div class="sub-metrics">
                  <div class="sub-pill cash">
                    Cash: {{ todayData()?.paymentBreakdown?.cash || 0 | currency: 'INR' }}
                  </div>
                  <div class="sub-pill online">
                    Online: {{ todayData()?.paymentBreakdown?.online || 0 | currency: 'INR' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Volume -->
            <div class="kpi-card orders-card">
              <div class="kpi-icon">🔥</div>
              <div class="kpi-info">
                <span class="label">Total Orders</span>
                <h3 class="value">{{ todayData()?.totalOrders || 0 }}</h3>
                <div class="sub-metrics">
                  <div class="sub-pill dine-in">
                    Dine-In: {{ todayData()?.orderTypeBreakdown?.dineIn || 0 }}
                  </div>
                  <div class="sub-pill takeaway">
                    Takeaway: {{ todayData()?.orderTypeBreakdown?.takeaway || 0 }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Efficiency -->
            <div class="kpi-card aov-card">
              <div class="kpi-icon">📈</div>
              <div class="kpi-info">
                <span class="label">Avg Order Value</span>
                <h3 class="value">{{ calculateAOV() | currency: 'INR' }}</h3>
                <p class="helper-text">Per customer transaction</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Secondary Visualizations -->
        <div class="data-grid">
          <!-- Revenue History Chart -->
          <div class="data-panel chart-panel">
            <div class="panel-header">
              <h3>Revenue History (Last 7 Days)</h3>
              <div class="legend"><span class="dot"></span> Revenue (₹)</div>
            </div>
            <div class="chart-canvas">
              <div class="bars-container">
                <div class="bar-group" *ngFor="let day of historyData()">
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      [style.height]="getBarHeight(day.totalRevenue) + '%'"
                      [attr.data-value]="day.totalRevenue"
                    >
                      <div class="bar-tooltip">₹{{ day.totalRevenue }}</div>
                    </div>
                  </div>
                  <span class="bar-label">{{ formatShortDate(day.date) }}</span>
                </div>
              </div>
              <div *ngIf="historyData().length === 0" class="no-history">
                Awaiting historical data sync...
              </div>
            </div>
          </div>

          <!-- Top Selling Items (Matches Server model) -->
          <div class="data-panel leaderboard-panel">
            <div class="panel-header">
              <h3>Top Selling Items Today</h3>
              <span class="stat-count">{{ todayData()?.topSellingItems?.length || 0 }} Items</span>
            </div>
            <div class="leaderboard">
              <div
                class="list-item"
                *ngFor="let item of todayData()?.topSellingItems; let i = index"
              >
                <div class="rank">{{ i + 1 }}</div>
                <div class="item-detail">
                  <span class="item-name">{{ item.name }}</span>
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [style.width]="getPopularityWidth(item.count) + '%'"
                    ></div>
                  </div>
                </div>
                <div class="item-count">{{ item.count }} <small>sold</small></div>
              </div>
              <div *ngIf="!todayData()?.topSellingItems?.length" class="empty-state">
                No items sold yet today.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --killa-orange: #ff6600;
        --killa-dark: #0a0a0a;
        --killa-gray: #1a1a1a;
        --killa-text: #ffffff;
        --killa-muted: #aaa;
        --killa-card-border: rgba(255, 255, 255, 0.05);
        --font-main: 'Inter', sans-serif;
      }

      .analytics-container {
        min-height: 100vh;
        background: var(--killa-dark);
        color: var(--killa-text);
        padding: 40px 24px;
        font-family: var(--font-main);
      }

      /* Header */
      .dashboard-header {
        margin-bottom: 48px;
        max-width: 1400px;
        margin-left: auto;
        margin-right: auto;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
      }

      h1 {
        font-size: 2.5rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -2px;
      }

      .highlight {
        color: var(--killa-orange);
      }

      .subtitle {
        color: var(--killa-muted);
        margin-top: 8px;
        font-size: 1.1rem;
      }

      .date-badge {
        background: var(--killa-gray);
        padding: 10px 20px;
        border-radius: 30px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid var(--killa-card-border);
        font-weight: 700;
        font-size: 0.9rem;
      }

      .pulse {
        width: 10px;
        height: 10px;
        background: #00ff00;
        border-radius: 50%;
        box-shadow: 0 0 10px #00ff00;
        animation: pulse-ring 1.5s infinite;
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(0.95);
          opacity: 0.8;
        }
        50% {
          transform: scale(1);
          opacity: 0.4;
        }
        100% {
          transform: scale(0.95);
          opacity: 0.8;
        }
      }

      /* Loading */
      .loading-overlay {
        height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }

      .loader {
        width: 50px;
        height: 50px;
        border: 3px solid transparent;
        border-top-color: var(--killa-orange);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* KPI Cards */
      .section-title {
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--killa-muted);
        margin-bottom: 24px;
        font-weight: 800;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 24px;
        margin-bottom: 48px;
      }

      .kpi-card {
        background: var(--killa-gray);
        border: 1px solid var(--killa-card-border);
        border-radius: 20px;
        padding: 30px;
        display: flex;
        gap: 24px;
        transition: 0.3s;
      }

      .kpi-card:hover {
        border-color: var(--killa-orange);
        transform: translateY(-5px);
      }

      .kpi-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 102, 0, 0.1);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
      }

      .kpi-info .label {
        font-size: 0.9rem;
        color: var(--killa-muted);
        font-weight: 600;
      }

      .kpi-info .value {
        font-size: 2.5rem;
        margin: 10px 0;
        font-weight: 900;
        letter-spacing: -1px;
      }

      .sub-metrics {
        display: flex;
        gap: 8px;
        margin-top: 15px;
      }

      .sub-pill {
        font-size: 0.75rem;
        padding: 6px 12px;
        border-radius: 8px;
        font-weight: 700;
      }

      .cash {
        background: rgba(0, 255, 0, 0.1);
        color: #00ff00;
      }
      .online {
        background: rgba(0, 150, 255, 0.1);
        color: #0096ff;
      }
      .dine-in {
        background: rgba(243, 156, 18, 0.1);
        color: #f39c12;
      }
      .takeaway {
        background: rgba(155, 89, 182, 0.1);
        color: #9b59b6;
      }
      .helper-text {
        font-size: 0.85rem;
        color: #555;
      }

      /* Data Grid Panels */
      .data-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: 24px;
      }

      .data-panel {
        background: var(--killa-gray);
        border: 1px solid var(--killa-card-border);
        border-radius: 24px;
        padding: 32px;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40px;
      }

      .panel-header h3 {
        font-size: 1.3rem;
        margin: 0;
        font-weight: 800;
      }

      /* Chart Styles */
      .chart-canvas {
        height: 300px;
        display: flex;
        align-items: flex-end;
      }

      .bars-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 10px;
      }

      .bar-group {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
      }

      .bar-track {
        width: 40px;
        height: 100%;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 10px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        position: relative;
      }

      .bar-fill {
        width: 100%;
        background: linear-gradient(to top, var(--killa-orange), #ff9900);
        border-radius: 8px;
        transition: height 1s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        position: relative;
        cursor: pointer;
      }

      .bar-fill:hover {
        filter: brightness(1.2);
      }

      .bar-tooltip {
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        color: #000;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 800;
        white-space: nowrap;
        opacity: 0;
        transition: 0.2s;
        pointer-events: none;
      }

      .bar-fill:hover .bar-tooltip {
        opacity: 1;
        transform: translateX(-50%) translateY(-5px);
      }

      .bar-label {
        margin-top: 15px;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--killa-muted);
        text-transform: uppercase;
      }

      /* Leaderboard Styles */
      .leaderboard {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .list-item {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .rank {
        width: 32px;
        height: 32px;
        background: var(--killa-orange);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 0.9rem;
        flex-shrink: 0;
      }

      .item-detail {
        flex: 1;
      }

      .item-name {
        display: block;
        font-weight: 700;
        margin-bottom: 8px;
        font-size: 1rem;
      }

      .progress-track {
        height: 6px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      .progress-fill {
        height: 100%;
        background: var(--killa-orange);
        border-radius: 3px;
        transition: 1s;
      }

      .item-count {
        font-weight: 900;
        font-size: 1.2rem;
        text-align: right;
      }

      .item-count small {
        display: block;
        font-size: 0.7rem;
        color: var(--killa-muted);
        text-transform: uppercase;
      }

      .fade-in {
        animation: fadeIn 0.8s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 1100px) {
        .data-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  todayData = signal<AnalyticsData | null>(null);
  historyData = signal<AnalyticsData[]>([]);
  isLoading = signal<boolean>(true);
  currentDayLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  ngOnInit() {
    this.refreshAnalytics();
  }

  refreshAnalytics() {
    this.isLoading.set(true);

    // Fetch both today's and history data
    this.analyticsService
      .getTodayAnalytics()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        this.todayData.set(data);
        this.checkLoadingComplete();
      });

    this.analyticsService
      .getHistoryAnalytics()
      .pipe(catchError(() => of([])))
      .subscribe((data) => {
        // Sort history by date chronologically
        const sorted = (data || []).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        // Limit to last 7 days for the chart
        this.historyData.set(sorted.slice(-7));
        this.checkLoadingComplete();
      });
  }

  private checkLoadingComplete() {
    // If we've made both calls, hide loader
    // Note: In simple logic we hide after data arrives or errors
    this.isLoading.set(false);
  }

  calculateAOV(): number {
    const data = this.todayData();
    if (!data || !data.totalOrders) return 0;
    return data.totalRevenue / data.totalOrders;
  }

  getBarHeight(revenue: number): number {
    const history = this.historyData();
    if (history.length === 0) return 0;
    const maxRevenue = Math.max(...history.map((d) => d.totalRevenue), 1);
    return (revenue / maxRevenue) * 100;
  }

  getPopularityWidth(count: number): number {
    const items = this.todayData()?.topSellingItems || [];
    if (items.length === 0) return 0;
    const maxCount = Math.max(...items.map((i) => i.count), 1);
    return (count / maxCount) * 100;
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
