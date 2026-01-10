import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard-wrapper">
      <div class="container-fluid">
        <!-- Header Section -->
        <header class="dash-header">
          <div class="header-main">
            <div class="title-group">
              <span class="badge-accent">Management Console</span>
              <h1>Kitchen <span class="highlight">Control</span></h1>
              <p>Real-time order synchronization & performance tracking</p>
            </div>
            <div class="header-actions">
              <div class="live-counter">
                <span class="count">{{ activeOrders().length }}</span>
                <span class="label">Live Orders</span>
              </div>
              <button (click)="refresh()" class="btn-refresh" [class.loading]="isRefreshing()">
                <span class="icon">🔄</span>
                {{ isRefreshing() ? 'Syncing...' : 'Refresh Feed' }}
              </button>
            </div>
          </div>
        </header>

        <!-- Active Queue Section -->
        <section class="queue-section">
          <div class="section-title">
            <h2>Active <span class="highlight">Queue</span></h2>
            <div class="status-legend">
              <span class="legend-item"><span class="dot new"></span> New</span>
              <span class="legend-item"><span class="dot cooking"></span> Cooking</span>
              <span class="legend-item"><span class="dot ready"></span> Ready</span>
            </div>
          </div>

          <div class="order-grid" *ngIf="activeOrders().length > 0; else emptyState">
            <div
              *ngFor="let order of activeOrders()"
              class="order-card"
              [ngClass]="'status-border-' + order.orderStatus"
            >
              <div class="card-top">
                <div class="order-meta">
                  <span class="order-id">#{{ order._id | slice : -6 }}</span>
                  <span class="order-time">{{ order.createdAt | date : 'shortTime' }}</span>
                </div>
                <div class="status-chip" [ngClass]="order.orderStatus.toLowerCase()">
                  {{ order.orderStatus }}
                </div>
              </div>

              <div class="customer-info">
                <h3>{{ order.userId?.name || 'Guest User' }}</h3>
                <div class="tags">
                  <span class="tag-type">{{ order.orderType }}</span>
                  <span class="tag-payment" [class.is-paid]="order.paymentStatus === 'PAID'">
                    {{
                      order.paymentStatus === 'PAID' ? 'PAID' : 'DUE (' + order.paymentMethod + ')'
                    }}
                  </span>
                </div>
              </div>

              <div class="items-container">
                <div *ngFor="let item of order.items" class="item-row">
                  <span class="item-qty">{{ item.quantity }}x</span>
                  <div class="item-details">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-variant" *ngIf="item.variant !== 'SINGLE'">{{
                      item.variant
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <button
                  *ngIf="order.orderStatus === 'NEW'"
                  (click)="updateStatus(order._id, 'PREPARING')"
                  class="btn-action btn-prepare"
                >
                  Start Preparing
                </button>
                <button
                  *ngIf="order.orderStatus === 'PREPARING'"
                  (click)="updateStatus(order._id, 'READY')"
                  class="btn-action btn-ready"
                >
                  Mark as Ready
                </button>
                <button
                  *ngIf="order.orderStatus === 'READY'"
                  (click)="handleCompletion(order)"
                  class="btn-action btn-complete"
                >
                  Handover & Complete
                </button>
              </div>
            </div>
          </div>

          <ng-template #emptyState>
            <div class="empty-kitchen glass-card">
              <div class="empty-icon">🍳</div>
              <h3>Kitchen is Clear</h3>
              <p>No active orders are currently in the queue.</p>
            </div>
          </ng-template>
        </section>

        <!-- Payment Verification Modal -->
        <div class="modal-backdrop" *ngIf="showPaymentModal">
          <div class="payment-modal glass-card">
            <div class="modal-icon">💰</div>
            <h3>Verify Cash Payment</h3>
            <p>
              Please confirm receipt of <strong>₹{{ pendingOrder?.totalAmount }}</strong> for Order
              <strong>#{{ pendingOrder?._id | slice : -6 }}</strong
              >.
            </p>
            <div class="modal-actions">
              <button (click)="completeWithPayment('PENDING')" class="btn-cancel">
                Mark Unpaid
              </button>
              <button (click)="completeWithPayment('PAID')" class="btn-confirm">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>

        <!-- Sales History Section -->
        <section class="history-section">
          <div class="section-title">
            <h2>Recent <span class="highlight">Activity</span></h2>
          </div>
          <div class="table-container glass-card">
            <table class="activity-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Payment Info</th>
                  <th>Amount</th>
                  <th>Completed Time</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of completedOrders()">
                  <td>
                    <span class="mono-id">#{{ order._id | slice : -6 }}</span>
                  </td>
                  <td>
                    <div class="cust-cell">
                      <span class="name">{{ order.userId?.name || 'Guest' }}</span>
                      <span class="sub">{{ order.userId?.mobile }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-pill" [class.paid]="order.paymentStatus === 'PAID'">
                      {{ order.paymentStatus }} ({{ order.paymentMethod }})
                    </span>
                  </td>
                  <td>
                    <span class="price-text">₹{{ order.totalAmount }}</span>
                  </td>
                  <td class="time-text">{{ order.updatedAt | date : 'medium' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-wrapper {
        background: #0a0a0a;
        min-height: 100vh;
        color: #fff;
        font-family: 'Poppins', sans-serif;
        padding: 100px 24px 60px;
      }
      .container-fluid {
        max-width: 1440px;
        margin: 0 auto;
      }

      /* Header */
      .dash-header {
        margin-bottom: 50px;
        padding-bottom: 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 30px;
        flex-wrap: wrap;
      }
      .badge-accent {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        color: #ff6600;
        background: rgba(255, 102, 0, 0.1);
        padding: 4px 12px;
        border-radius: 50px;
        margin-bottom: 12px;
        letter-spacing: 1px;
      }
      .title-group h1 {
        font-size: 3rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -1.5px;
      }
      .highlight {
        color: #ff6600;
      }
      .title-group p {
        color: #777;
        font-size: 1rem;
        margin-top: 5px;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 40px;
      }
      .live-counter {
        text-align: right;
      }
      .live-counter .count {
        display: block;
        font-size: 2.8rem;
        font-weight: 900;
        color: #ff6600;
        line-height: 1;
      }
      .live-counter .label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .btn-refresh {
        background: #fff;
        color: #000;
        border: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.3s;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .btn-refresh:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
      }
      .btn-refresh.loading .icon {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Queue */
      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }
      .section-title h2 {
        font-size: 1.8rem;
        font-weight: 800;
      }
      .status-legend {
        display: flex;
        gap: 20px;
      }
      .legend-item {
        font-size: 0.8rem;
        color: #666;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .dot.new {
        background: #3498db;
      }
      .dot.cooking {
        background: #f39c12;
      }
      .dot.ready {
        background: #2ecc71;
      }

      .order-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 24px;
      }
      .order-card {
        background: #161616;
        border: 1px solid #222;
        border-radius: 24px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        transition: 0.3s;
        position: relative;
      }
      .order-card:hover {
        border-color: #444;
        transform: translateY(-5px);
      }

      .status-border-NEW {
        border-top: 5px solid #3498db;
      }
      .status-border-PREPARING {
        border-top: 5px solid #f39c12;
      }
      .status-border-READY {
        border-top: 5px solid #2ecc71;
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
      }
      .order-id {
        font-family: monospace;
        color: #666;
        font-weight: 800;
        font-size: 1rem;
      }
      .order-time {
        font-size: 0.8rem;
        color: #ff6600;
        font-weight: 700;
      }
      .status-chip {
        font-size: 0.65rem;
        font-weight: 900;
        padding: 4px 10px;
        border-radius: 6px;
        text-transform: uppercase;
      }
      .status-chip.new {
        background: rgba(52, 152, 219, 0.1);
        color: #3498db;
      }
      .status-chip.preparing {
        background: rgba(243, 156, 18, 0.1);
        color: #f39c12;
      }
      .status-chip.ready {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
      }

      .customer-info h3 {
        font-size: 1.4rem;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .tags {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
      }
      .tag-type,
      .tag-payment {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 5px;
        background: #222;
        color: #888;
      }
      .tag-payment.is-paid {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
      }

      .items-container {
        background: #0d0d0d;
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 20px;
        flex-grow: 1;
        border: 1px solid #222;
      }
      .item-row {
        display: flex;
        gap: 12px;
        margin-bottom: 10px;
      }
      .item-qty {
        font-weight: 900;
        color: #ff6600;
      }
      .item-name {
        display: block;
        font-weight: 600;
        color: #eee;
        font-size: 0.95rem;
      }
      .item-variant {
        font-size: 0.75rem;
        color: #666;
        text-transform: uppercase;
        font-weight: 700;
      }

      .card-actions {
        margin-top: 10px;
      }
      .btn-action {
        width: 100%;
        padding: 14px;
        border: none;
        border-radius: 12px;
        font-weight: 800;
        font-size: 0.9rem;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-prepare {
        background: #3498db;
        color: #fff;
      }
      .btn-ready {
        background: #f39c12;
        color: #fff;
      }
      .btn-complete {
        background: #2ecc71;
        color: #fff;
      }
      .btn-action:hover {
        filter: brightness(1.1);
        transform: scale(1.02);
      }

      /* Empty State */
      .empty-kitchen {
        text-align: center;
        padding: 60px;
        border-radius: 32px;
      }
      .empty-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        filter: grayscale(1);
        opacity: 0.3;
      }
      .empty-kitchen h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
      }
      .empty-kitchen p {
        color: #666;
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .payment-modal {
        max-width: 440px;
        width: 100%;
        padding: 40px;
        text-align: center;
        border: 1px solid #333;
      }
      .modal-icon {
        font-size: 3.5rem;
        margin-bottom: 20px;
      }
      .modal-actions {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 12px;
        margin-top: 30px;
      }
      .btn-cancel {
        background: #222;
        color: #888;
        border: none;
        padding: 15px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-confirm {
        background: #ff6600;
        color: #fff;
        border: none;
        padding: 15px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      /* Table History */
      .history-section {
        margin-top: 80px;
      }
      .table-container {
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #222;
      }
      .activity-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .activity-table th {
        padding: 20px 25px;
        background: #1a1a1a;
        color: #555;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .activity-table td {
        padding: 20px 25px;
        border-bottom: 1px solid #222;
        font-size: 0.9rem;
      }
      .mono-id {
        font-family: monospace;
        color: #ff6600;
        font-weight: 800;
      }
      .cust-cell {
        display: flex;
        flex-direction: column;
      }
      .cust-cell .sub {
        font-size: 0.75rem;
        color: #555;
      }
      .status-pill {
        font-size: 0.7rem;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 6px;
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
      }
      .status-pill.paid {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
      }
      .price-text {
        font-weight: 800;
        font-size: 1.1rem;
        color: #fff;
      }
      .time-text {
        color: #666;
        font-size: 0.85rem;
      }

      @media (max-width: 768px) {
        .header-main {
          flex-direction: column;
          align-items: flex-start;
        }
        .live-counter {
          text-align: left;
        }
        .order-grid {
          grid-template-columns: 1fr;
        }
        .dashboard-wrapper {
          padding-top: 120px;
        }
      }
    `,
  ],
})
export class OwnerDashboardComponent implements OnInit {
  orderService = inject(OrderService);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  orders = signal<any[]>([]);
  isRefreshing = signal<boolean>(false);
  showPaymentModal = false;
  pendingOrder: any = null;

  activeOrders = computed(() =>
    this.orders().filter((o) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED')
  );
  completedOrders = computed(() => this.orders().filter((o) => o.orderStatus === 'COMPLETED'));

  ngOnInit() {
    // Wrap in setTimeout to avoid NG0100 by deferring state changes to next cycle
    setTimeout(() => {
      this.refresh();
    });
  }

  refresh() {
    if (this.isRefreshing()) return;

    this.isRefreshing.set(true);
    this.cdr.detectChanges(); // Sync UI for the loading spinner

    this.orderService.getOwnerDashboardData().subscribe({
      next: (d) => {
        this.orders.set(d);
        this.isRefreshing.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isRefreshing.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  handleCompletion(order: any) {
    if (order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING') {
      this.pendingOrder = order;
      this.showPaymentModal = true;
    } else {
      this.updateStatus(order._id, 'COMPLETED');
    }
  }

  completeWithPayment(s: 'PAID' | 'PENDING') {
    if (!this.pendingOrder) return;
    this.updateStatus(this.pendingOrder._id, 'COMPLETED', s);
    this.showPaymentModal = false;
    this.pendingOrder = null;
  }

  updateStatus(id: string, status: string, paymentStatus?: string) {
    this.orderService.updateOrderStatus(id, status, paymentStatus).subscribe({
      next: () => {
        this.toast.success(`Order moved to ${status}`);
        this.refresh();
      },
      error: () => this.toast.error('Update failed.'),
    });
  }
}
