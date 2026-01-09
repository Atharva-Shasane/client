import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="header-text">
          <h1>Owner <span class="accent">Dashboard</span></h1>
          <p>Manage your kitchen and view sales history</p>
        </div>
        <button (click)="refresh()" class="btn btn-refresh" [disabled]="isRefreshing()">
          {{ isRefreshing() ? 'Refreshing...' : '🔄 Refresh Orders' }}
        </button>
      </div>

      <!-- SECTION 1: LIVE KITCHEN QUEUE -->
      <section class="order-section">
        <div class="section-title">
          <div class="title-with-icon">
            <span class="section-icon">🔥</span>
            <h2>Live Kitchen Queue</h2>
          </div>
          <span class="badge count">{{ activeOrders().length }} Active</span>
        </div>

        <div class="orders-grid">
          <div
            *ngFor="let order of activeOrders()"
            class="order-card"
            [ngClass]="'status-' + order.orderStatus"
          >
            <div class="card-header">
              <span class="order-id">#{{ order._id | slice : -6 }}</span>
              <span class="order-time">{{ order.createdAt | date : 'shortTime' }}</span>
            </div>

            <div class="customer-info">
              <div class="cust-name">{{ order.userId?.name || 'Guest User' }}</div>
              <div class="meta-tags">
                <span class="type-tag">{{ order.orderType }}</span>
                <!-- Payment Badge -->
                <span
                  class="pay-tag"
                  [ngClass]="{
                    paid: order.paymentStatus === 'PAID',
                    'pending-cash':
                      order.paymentStatus === 'PENDING' && order.paymentMethod === 'CASH',
                    failed: order.paymentStatus === 'FAILED'
                  }"
                >
                  {{
                    order.paymentStatus === 'PAID'
                      ? '✅ PAID (' + order.paymentMethod + ')'
                      : '⚠️ UNPAID - ' + order.paymentMethod
                  }}
                </span>
              </div>
            </div>

            <div class="order-items">
              <div *ngFor="let item of order.items" class="item-row">
                <span class="qty">{{ item.quantity }}x</span>
                <span class="name">{{ item.name }}</span>
                <span class="variant" *ngIf="item.variant !== 'SINGLE'">({{ item.variant }})</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="status-indicator">
                <span class="dot"></span>
                <strong>{{ order.orderStatus }}</strong>
              </div>
              <div class="action-buttons">
                <button
                  *ngIf="order.orderStatus === 'NEW'"
                  (click)="updateStatus(order._id, 'PREPARING')"
                  class="btn btn-prepare"
                >
                  Accept & Cook
                </button>
                <button
                  *ngIf="order.orderStatus === 'PREPARING'"
                  (click)="updateStatus(order._id, 'READY')"
                  class="btn btn-ready"
                >
                  Mark Ready
                </button>
                <button
                  *ngIf="order.orderStatus === 'READY'"
                  (click)="updateStatus(order._id, 'COMPLETED')"
                  class="btn btn-complete"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeOrders().length === 0" class="empty-state glass-card">
          <p>No active orders in the queue. Everything is served!</p>
        </div>
      </section>

      <div class="spacer"></div>

      <!-- SECTION 2: ORDER HISTORY -->
      <section class="order-section history">
        <div class="section-title">
          <div class="title-with-icon">
            <span class="section-icon">📜</span>
            <h2>Order History</h2>
          </div>
          <span class="badge history-count">{{ completedOrders().length }} Total Records</span>
        </div>

        <div class="history-table-container glass-card">
          <table class="history-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items Summary</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of completedOrders()">
                <td>
                  <span class="id-tag">#{{ order._id | slice : -6 }}</span>
                </td>
                <td>{{ order.userId?.name || 'Guest' }}</td>
                <td>{{ getItemsSummary(order) }}</td>
                <td>
                  <span class="status-pill" [class.success]="order.paymentStatus === 'PAID'">
                    {{ order.paymentStatus }}
                  </span>
                </td>
                <td>
                  <strong>₹{{ order.totalAmount }}</strong>
                </td>
                <td class="time-col">{{ order.updatedAt | date : 'medium' }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="completedOrders().length === 0" class="empty-history">
            No completed orders found in history yet.
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 40px 20px 100px;
        max-width: 1400px;
        margin: 0 auto;
        font-family: 'Poppins', sans-serif;
      }
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 50px;
      }
      h1 {
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -1px;
        margin: 0;
      }
      .accent {
        color: #ff6b00;
      }
      .header-text p {
        color: #666;
        margin: 5px 0 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 25px;
        border-bottom: 2px solid #eee;
        padding-bottom: 15px;
      }
      .title-with-icon {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .section-icon {
        font-size: 1.5rem;
      }
      .section-title h2 {
        font-size: 1.6rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .badge {
        padding: 5px 15px;
        border-radius: 30px;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .count {
        background: #ff6b00;
        color: white;
        box-shadow: 0 4px 10px rgba(255, 107, 0, 0.2);
      }
      .history-count {
        background: #eee;
        color: #666;
      }

      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 25px;
      }

      /* Order Card Styling */
      .order-card {
        background: white;
        border-radius: 20px;
        padding: 25px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        border-left: 8px solid #ccc;
        display: flex;
        flex-direction: column;
        transition: 0.3s;
        position: relative;
      }
      .order-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
      }

      .status-NEW {
        border-left-color: #3498db;
      }
      .status-PREPARING {
        border-left-color: #f39c12;
      }
      .status-READY {
        border-left-color: #2ecc71;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        color: #aaa;
        font-size: 0.85rem;
        margin-bottom: 15px;
      }
      .cust-name {
        font-size: 1.25rem;
        font-weight: 800;
        color: #333;
      }

      .meta-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .type-tag {
        background: #333;
        color: white;
        font-size: 0.7rem;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
      }

      /* Payment Tags */
      .pay-tag {
        font-size: 0.75rem;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        border: 1px solid transparent;
      }
      .pay-tag.pending-cash {
        background: #fff3cd;
        color: #856404;
        border-color: #ffeeba;
      }
      .pay-tag.paid {
        background: #d4edda;
        color: #155724;
        border-color: #c3e6cb;
      }

      .order-items {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 12px;
        margin: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .item-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
      }
      .qty {
        font-weight: 800;
        color: #ff6b00;
        min-width: 25px;
      }
      .variant {
        font-size: 0.8rem;
        color: #888;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ccc;
      }
      .status-NEW .dot {
        background: #3498db;
      }
      .status-PREPARING .dot {
        background: #f39c12;
      }
      .status-READY .dot {
        background: #2ecc71;
      }

      .btn {
        padding: 10px 20px;
        border-radius: 10px;
        border: none;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
        font-size: 0.9rem;
      }
      .btn-refresh {
        background: #1a1a1a;
        color: white;
      }
      .btn-prepare {
        background: #f39c12;
        color: white;
        box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
      }
      .btn-ready {
        background: #2ecc71;
        color: white;
        box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
      }
      .btn-complete {
        background: #1a1a1a;
        color: white;
      }

      .spacer {
        height: 80px;
      }

      /* History Table */
      .history-table-container {
        overflow-x: auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      }
      .history-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        min-width: 800px;
      }
      .history-table th {
        padding: 20px;
        background: #fdfdfd;
        color: #999;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 2px solid #f5f5f5;
      }
      .history-table td {
        padding: 20px;
        border-bottom: 1px solid #f5f5f5;
        color: #444;
        font-size: 0.95rem;
      }
      .id-tag {
        font-family: monospace;
        color: #888;
        font-weight: bold;
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .status-pill {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 800;
        background: #eee;
        color: #666;
      }
      .status-pill.success {
        background: #d4edda;
        color: #155724;
      }
      .time-col {
        color: #888;
        font-size: 0.85rem;
      }

      .empty-state {
        text-align: center;
        padding: 60px;
        color: #888;
        font-style: italic;
        background: white;
        border-radius: 20px;
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

  // SECTION 1: Computed signal for active orders
  activeOrders = computed(() =>
    this.orders().filter((o: any) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED')
  );

  // SECTION 2: Computed signal for all history (No 1-day limit)
  completedOrders = computed(() => this.orders().filter((o: any) => o.orderStatus === 'COMPLETED'));

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isRefreshing.set(true);
    this.orderService.getOwnerDashboardData().subscribe({
      next: (data: any) => {
        this.orders.set(data);
        this.isRefreshing.set(false);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.toast.error('Failed to sync dashboard.');
        this.isRefreshing.set(false);
      },
    });
  }

  updateStatus(id: string, status: string) {
    this.orderService.updateOrderStatus(id, status).subscribe({
      next: () => {
        this.toast.success(`Order updated to ${status}`);
        this.refresh();
      },
      error: () => this.toast.error('Update failed.'),
    });
  }

  getItemsSummary(order: any): string {
    if (!order.items || order.items.length === 0) return 'No items';
    const firstItem = order.items[0].name;
    const others = order.items.length - 1;
    return others > 0 ? `${firstItem} + ${others} others` : firstItem;
  }
}
