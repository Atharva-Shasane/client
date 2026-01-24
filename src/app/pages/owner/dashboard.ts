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
              <!-- Card Header: ID, Creation Time, and Status -->
              <div class="card-top">
                <div class="order-meta">
                  <span class="order-id">#{{ order._id | slice: -6 }}</span>
                  <span class="order-time">Placed: {{ order.createdAt | date: 'shortTime' }}</span>
                </div>
                <div class="status-chip" [ngClass]="order.orderStatus.toLowerCase()">
                  {{ order.orderStatus }}
                </div>
              </div>

              <!-- Customer Info & Contact -->
              <div class="customer-info">
                <div class="user-main">
                  <h3>{{ order.userId?.name || 'Guest User' }}</h3>
                  <a [href]="'tel:' + order.userId?.mobile" class="phone-link">
                    📞 {{ order.userId?.mobile || 'N/A' }}
                  </a>
                </div>

                <div class="tags">
                  <span class="tag-type" [class.dine-in]="order.orderType === 'DINE_IN'">
                    {{ order.orderType }}
                  </span>
                  <span class="tag-payment" [class.is-paid]="order.paymentStatus === 'PAID'">
                    {{ order.paymentMethod }} | {{ order.paymentStatus }}
                  </span>
                </div>
              </div>

              <!-- Reservation Details (Only for Dine-In) -->
              <div class="reservation-box" *ngIf="order.orderType === 'DINE_IN'">
                <div class="res-item">
                  <span class="res-label">Guests</span>
                  <span class="res-value">{{ order.numberOfPeople }} People</span>
                </div>
                <div class="res-item">
                  <span class="res-label">Arrival Time</span>
                  <span class="res-value highlight-time">{{
                    order.scheduledTime | date: 'shortTime'
                  }}</span>
                </div>
              </div>

              <!-- Items Ordered -->
              <div class="items-container">
                <div class="items-label">Order Items:</div>
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

              <!-- Workflow Actions -->
              <div class="card-actions">
                <button
                  *ngIf="order.orderStatus === 'NEW'"
                  (click)="updateStatus(order._id, 'PREPARING')"
                  class="btn-action btn-prepare"
                >
                  Start Cooking
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

        <!-- Activity History Section (Completed & Cancelled) -->
        <section class="history-section">
          <div class="section-title">
            <h2>Activity <span class="highlight">History</span></h2>
            <p class="history-subtitle">Showing completed and cancelled orders</p>
          </div>
          <div class="table-container glass-card">
            <table class="activity-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Details & Status</th>
                  <th>Amount</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let order of historyOrders()"
                  [class.row-cancelled]="order.orderStatus === 'CANCELLED'"
                >
                  <td>
                    <span class="mono-id">#{{ order._id | slice: -6 }}</span>
                  </td>
                  <td>
                    <div class="cust-cell">
                      <span class="name">{{ order.userId?.name || 'Guest' }}</span>
                      <span class="sub">{{ order.userId?.mobile }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="details-cell">
                      <div class="status-row">
                        <span class="type-badge">{{ order.orderType }}</span>
                        <span class="history-status" [ngClass]="order.orderStatus.toLowerCase()">
                          {{ order.orderStatus }}
                        </span>
                      </div>
                      <span class="pay-info"
                        >{{ order.paymentMethod }} | {{ order.paymentStatus }}</span
                      >
                    </div>
                  </td>
                  <td>
                    <span
                      class="price-text"
                      [class.text-strikethrough]="order.orderStatus === 'CANCELLED'"
                    >
                      ₹{{ order.totalAmount }}
                    </span>
                  </td>
                  <td>
                    <span class="time-text">{{
                      order.updatedAt || order.createdAt | date: 'shortTime'
                    }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- Payment Verification Modal -->
      <div class="modal-backdrop" *ngIf="showPaymentModal">
        <div class="payment-modal glass-card">
          <div class="modal-icon">💰</div>
          <h3>Verify Cash Payment</h3>
          <p>
            Please confirm receipt of ₹{{ pendingOrder?.totalAmount }} for Order #{{
              pendingOrder?._id | slice: -6
            }}.
          </p>
          <div class="modal-actions">
            <button (click)="showPaymentModal = false" class="btn-cancel">Not Received</button>
            <button (click)="completeWithPayment('PAID')" class="btn-confirm">
              Confirm & Complete
            </button>
          </div>
        </div>
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
      }

      .title-group h1 {
        font-size: 3rem;
        font-weight: 900;
        margin: 0;
        line-height: 1.1;
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
      .btn-refresh.loading .icon {
        animation: spin 1s linear infinite;
        display: inline-block;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        margin-top: 20px;
      }
      .section-title h2 {
        font-size: 1.8rem;
        font-weight: 800;
        margin: 0;
      }
      .history-subtitle {
        font-size: 0.85rem;
        color: #555;
        margin: 0;
        font-weight: 600;
      }

      .status-legend {
        display: flex;
        gap: 20px;
      }
      .legend-item {
        font-size: 0.8rem;
        color: #666;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
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
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
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
        border-top: 6px solid #3498db;
      }
      .status-border-PREPARING {
        border-top: 6px solid #f39c12;
      }
      .status-border-READY {
        border-top: 6px solid #2ecc71;
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }
      .order-id {
        font-family: monospace;
        color: #aaa;
        font-weight: 800;
        font-size: 1.1rem;
        display: block;
      }
      .order-time {
        font-size: 0.8rem;
        color: #555;
        font-weight: 600;
      }
      .status-chip {
        font-size: 0.65rem;
        font-weight: 900;
        padding: 4px 10px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
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

      .customer-info {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #222;
      }
      .user-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .customer-info h3 {
        font-size: 1.4rem;
        font-weight: 800;
        margin: 0;
        color: #fff;
      }
      .phone-link {
        color: #ff6600;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.9rem;
      }

      .tags {
        display: flex;
        gap: 10px;
      }
      .tag-type,
      .tag-payment {
        font-size: 0.75rem;
        font-weight: 800;
        padding: 4px 12px;
        border-radius: 6px;
        background: #222;
        color: #888;
        text-transform: uppercase;
      }
      .tag-type.dine-in {
        color: #ff6600;
        background: rgba(255, 102, 0, 0.1);
      }
      .tag-payment.is-paid {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
      }

      .reservation-box {
        background: rgba(255, 102, 0, 0.05);
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-around;
        border: 1px solid rgba(255, 102, 0, 0.15);
      }
      .res-item {
        text-align: center;
      }
      .res-label {
        display: block;
        font-size: 0.65rem;
        color: #666;
        text-transform: uppercase;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .res-value {
        display: block;
        font-size: 1rem;
        font-weight: 800;
        color: #eee;
      }
      .highlight-time {
        color: #ff6600;
      }

      .items-container {
        background: #0d0d0d;
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 24px;
        flex-grow: 1;
        border: 1px solid #222;
      }
      .items-label {
        font-size: 0.7rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        margin-bottom: 12px;
        letter-spacing: 1px;
      }
      .item-row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }
      .item-qty {
        font-weight: 900;
        color: #ff6600;
        font-size: 1rem;
      }
      .item-name {
        font-weight: 700;
        color: #eee;
        font-size: 0.95rem;
      }
      .item-variant {
        font-size: 0.75rem;
        color: #666;
        text-transform: uppercase;
        font-weight: 800;
        display: block;
        margin-top: 2px;
      }

      .btn-action {
        width: 100%;
        padding: 16px;
        border: none;
        border-radius: 14px;
        font-weight: 900;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-prepare {
        background: #3498db;
        color: #fff;
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
      }
      .btn-ready {
        background: #f39c12;
        color: #fff;
        box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
      }
      .btn-complete {
        background: #2ecc71;
        color: #fff;
        box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
      }
      .btn-action:hover {
        filter: brightness(1.1);
        transform: translateY(-3px);
      }

      .empty-kitchen {
        text-align: center;
        padding: 80px;
        border-radius: 32px;
        border: 1px solid #222;
      }
      .empty-icon {
        font-size: 5rem;
        margin-bottom: 20px;
        opacity: 0.2;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
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
        padding: 45px;
        text-align: center;
        border: 1px solid #333;
        border-radius: 40px;
      }
      .modal-icon {
        font-size: 4rem;
        margin-bottom: 25px;
      }
      .modal-actions {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 15px;
        margin-top: 35px;
      }
      .btn-cancel {
        background: #222;
        color: #888;
        border: none;
        padding: 18px;
        border-radius: 16px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-confirm {
        background: #ff6600;
        color: #fff;
        border: none;
        padding: 18px;
        border-radius: 16px;
        font-weight: 900;
        cursor: pointer;
      }

      .history-section {
        margin-top: 100px;
      }
      .table-container {
        border-radius: 28px;
        overflow: hidden;
        border: 1px solid #222;
      }
      .activity-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .activity-table th {
        padding: 25px;
        background: #111;
        color: #555;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      .activity-table td {
        padding: 22px 25px;
        border-bottom: 1px solid #222;
        font-size: 0.95rem;
        vertical-align: middle;
      }
      .mono-id {
        font-family: monospace;
        color: #ff6600;
        font-weight: 900;
        font-size: 1rem;
      }
      .cust-cell {
        display: flex;
        flex-direction: column;
      }
      .cust-cell .sub {
        font-size: 0.8rem;
        color: #666;
        margin-top: 4px;
        font-weight: 600;
      }

      .details-cell {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .status-row {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .type-badge {
        font-size: 0.65rem;
        font-weight: 900;
        color: #aaa;
        background: #222;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .history-status {
        font-size: 0.65rem;
        font-weight: 900;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .history-status.completed {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
      }
      .history-status.cancelled {
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
      }

      .row-cancelled {
        background: rgba(231, 76, 60, 0.02);
      }
      .text-strikethrough {
        text-decoration: line-through;
        opacity: 0.5;
      }

      .pay-info {
        font-size: 0.8rem;
        color: #888;
        font-weight: 600;
      }
      .price-text {
        font-weight: 900;
        font-size: 1.2rem;
        color: #ff6600;
      }
      .time-text {
        color: #555;
        font-size: 0.85rem;
        font-weight: 600;
      }

      @media (max-width: 1000px) {
        .order-grid {
          grid-template-columns: 1fr;
        }
        .header-main {
          flex-direction: column;
          align-items: flex-start;
          gap: 20px;
        }
        .live-counter {
          text-align: left;
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
    this.orders().filter(
      (o) => o.orderStatus === 'NEW' || o.orderStatus === 'PREPARING' || o.orderStatus === 'READY',
    ),
  );

  historyOrders = computed(() =>
    this.orders().filter((o) => o.orderStatus === 'COMPLETED' || o.orderStatus === 'CANCELLED'),
  );

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    if (this.isRefreshing()) return;
    this.isRefreshing.set(true);

    this.orderService.getOwnerDashboardData().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isRefreshing.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isRefreshing.set(false);
        this.toast.error('Failed to sync live feed.');
      },
    });
  }

  updateStatus(id: string, status: string, paymentStatus?: string) {
    this.orderService.updateOrderStatus(id, status, paymentStatus).subscribe({
      next: () => {
        this.toast.success(`Order #...${id.slice(-4)} marked as ${status}`);
        this.refresh();
      },
      error: () => this.toast.error('Failed to update order status.'),
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

  completeWithPayment(status: 'PAID' | 'PENDING') {
    if (!this.pendingOrder) return;
    this.updateStatus(this.pendingOrder._id, 'COMPLETED', status);
    this.showPaymentModal = false;
    this.pendingOrder = null;
  }
}
