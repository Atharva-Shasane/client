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
        <header class="dash-header">
          <div class="title-group">
            <h1>Kitchen <span class="highlight">Control</span></h1>
            <p>Real-time queue and performance history</p>
          </div>
          <div class="stats-bar">
            <div class="stat-item">
              <span class="val">{{ activeOrders().length }}</span>
              <span class="label">In Queue</span>
            </div>
            <button (click)="refresh()" class="btn-refresh" [class.loading]="isRefreshing()">
              {{ isRefreshing() ? '🔄 Syncing...' : 'Sync Data' }}
            </button>
          </div>
        </header>

        <!-- Live Queue -->
        <section class="queue-section">
          <div class="grid">
            <div
              *ngFor="let order of activeOrders()"
              class="order-card"
              [ngClass]="'status-' + order.orderStatus"
            >
              <div class="card-head">
                <span class="id-tag">#{{ order._id | slice : -6 }}</span>
                <span class="timer">{{ order.createdAt | date : 'shortTime' }}</span>
              </div>

              <div class="cust-info">
                <h3>{{ order.userId?.name || 'Guest' }}</h3>
                <div class="pills">
                  <span class="type-pill">{{ order.orderType }}</span>
                  <span class="pay-pill" [class.paid]="order.paymentStatus === 'PAID'">
                    {{ order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING ' + order.paymentMethod }}
                  </span>
                </div>
              </div>

              <div class="item-list">
                <div *ngFor="let item of order.items" class="food-line">
                  <span class="q">{{ item.quantity }}x</span>
                  <span class="n">{{ item.name }}</span>
                  <span class="v" *ngIf="item.variant !== 'SINGLE'">{{ item.variant }}</span>
                </div>
              </div>

              <div class="card-footer">
                <div class="status-msg">
                  <div class="pulse-dot"></div>
                  {{ order.orderStatus }}
                </div>
                <div class="actions">
                  <button
                    *ngIf="order.orderStatus === 'NEW'"
                    (click)="updateStatus(order._id, 'PREPARING')"
                    class="btn-step cook"
                  >
                    Start Cooking
                  </button>
                  <button
                    *ngIf="order.orderStatus === 'PREPARING'"
                    (click)="updateStatus(order._id, 'READY')"
                    class="btn-step ready"
                  >
                    Mark Ready
                  </button>
                  <button
                    *ngIf="order.orderStatus === 'READY'"
                    (click)="handleCompletion(order)"
                    class="btn-step done"
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeOrders().length === 0" class="empty-kitchen glass-card">
            <p>The kitchen is quiet. No active orders in queue.</p>
          </div>
        </section>

        <!-- Payment Prompt -->
        <div class="modal-overlay" *ngIf="showPaymentModal">
          <div class="modal glass-card">
            <h3>Verify Cash Receipt</h3>
            <p>
              Has the customer paid <strong>₹{{ pendingOrder?.totalAmount }}</strong> for order #{{
                pendingOrder?._id | slice : -6
              }}?
            </p>
            <div class="modal-btns">
              <button (click)="completeWithPayment('PENDING')" class="btn-no">Not Yet</button>
              <button (click)="completeWithPayment('PAID')" class="btn-yes">Yes, Collected</button>
            </div>
          </div>
        </div>

        <!-- History Table -->
        <section class="history-section">
          <h2>Sales <span class="highlight">History</span></h2>
          <div class="table-box glass-card">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of completedOrders()">
                  <td>
                    <span class="id-small">#{{ order._id | slice : -6 }}</span>
                  </td>
                  <td>{{ order.userId?.name || 'Guest' }}</td>
                  <td>
                    <span class="pay-status" [class.green]="order.paymentStatus === 'PAID'">
                      {{ order.paymentStatus }} ({{ order.paymentMethod }})
                    </span>
                  </td>
                  <td>
                    <strong>₹{{ order.totalAmount }}</strong>
                  </td>
                  <td class="time-col">{{ order.updatedAt | date : 'medium' }}</td>
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
        color: white;
        font-family: 'Poppins', sans-serif;
        padding: 120px 24px 60px;
      }
      .container-fluid {
        max-width: 1600px;
        margin: 0 auto;
      }
      .dash-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 60px;
        border-bottom: 1px solid #222;
        padding-bottom: 30px;
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
        color: #666;
        margin: 5px 0 0;
      }

      .stats-bar {
        display: flex;
        align-items: center;
        gap: 30px;
      }
      .stat-item {
        text-align: right;
      }
      .stat-item .val {
        display: block;
        font-size: 2.2rem;
        font-weight: 900;
        color: #ff6600;
        line-height: 1;
      }
      .stat-item .label {
        font-size: 0.75rem;
        font-weight: 800;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .btn-refresh {
        background: white;
        color: black;
        border: none;
        padding: 12px 25px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-refresh.loading {
        opacity: 0.5;
        pointer-events: none;
      }

      /* Queue Grid */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 30px;
      }
      .order-card {
        background: #161616;
        border-radius: 28px;
        padding: 30px;
        border: 1px solid #222;
        transition: 0.3s;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .order-card:hover {
        border-color: #444;
        transform: translateY(-5px);
      }

      .status-NEW {
        border-left: 8px solid #3498db;
      }
      .status-PREPARING {
        border-left: 8px solid #f39c12;
      }
      .status-READY {
        border-left: 8px solid #2ecc71;
      }

      .card-head {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .id-tag {
        color: #666;
        font-weight: 800;
        font-family: monospace;
      }
      .timer {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.85rem;
      }

      .cust-info h3 {
        margin: 0 0 10px;
        font-size: 1.5rem;
        font-weight: 900;
      }
      .pills {
        display: flex;
        gap: 10px;
        margin-bottom: 25px;
      }
      .type-pill {
        font-size: 0.65rem;
        font-weight: 800;
        background: #333;
        padding: 4px 10px;
        border-radius: 6px;
        text-transform: uppercase;
      }
      .pay-pill {
        font-size: 0.65rem;
        font-weight: 800;
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid rgba(231, 76, 60, 0.2);
      }
      .pay-pill.paid {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
        border-color: rgba(46, 204, 113, 0.2);
      }

      .item-list {
        background: #0a0a0a;
        padding: 20px;
        border-radius: 18px;
        margin-bottom: 25px;
        flex-grow: 1;
        border: 1px solid #222;
      }
      .food-line {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 1rem;
      }
      .food-line .q {
        font-weight: 900;
        color: #ff6600;
      }
      .food-line .v {
        font-size: 0.75rem;
        color: #666;
        font-weight: 700;
        text-transform: uppercase;
      }

      .card-footer {
        border-top: 1px solid #222;
        padding-top: 25px;
      }
      .status-msg {
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        color: #888;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 15px;
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        background: #ff6600;
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(255, 102, 0, 0.4);
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 102, 0, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(255, 102, 0, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 102, 0, 0);
        }
      }

      .btn-step {
        width: 100%;
        padding: 15px;
        border: none;
        border-radius: 14px;
        font-weight: 900;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-step.cook {
        background: #3498db;
        color: white;
      }
      .btn-step.ready {
        background: #f39c12;
        color: white;
      }
      .btn-step.done {
        background: #2ecc71;
        color: white;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal {
        padding: 40px;
        border-radius: 32px;
        width: 450px;
        text-align: center;
        border: 1px solid #333;
      }
      .modal-btns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-top: 30px;
      }
      .btn-no {
        background: #222;
        color: #888;
        border: none;
        padding: 15px;
        border-radius: 14px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-yes {
        background: #ff6600;
        color: white;
        border: none;
        padding: 15px;
        border-radius: 14px;
        font-weight: 800;
        cursor: pointer;
      }

      /* History */
      .history-section {
        margin-top: 80px;
      }
      .history-section h2 {
        font-size: 2.2rem;
        font-weight: 900;
        margin-bottom: 30px;
      }
      .table-box {
        overflow-x: auto;
        border-radius: 28px;
        border: 1px solid #222;
      }
      .history-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .history-table th {
        padding: 25px;
        background: #1a1a1a;
        color: #555;
        text-transform: uppercase;
        font-size: 0.7rem;
        font-weight: 800;
      }
      .history-table td {
        padding: 25px;
        border-bottom: 1px solid #222;
        font-size: 0.95rem;
      }
      .id-small {
        font-family: monospace;
        color: #ff6600;
        font-weight: 800;
      }
      .pay-status {
        font-weight: 800;
        font-size: 0.8rem;
      }
      .pay-status.green {
        color: #2ecc71;
      }
      .time-col {
        color: #555;
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
    this.refresh();
  }

  refresh() {
    this.isRefreshing.set(true);
    this.orderService.getOwnerDashboardData().subscribe({
      next: (d) => {
        this.orders.set(d);
        this.isRefreshing.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Sync failed.');
        this.isRefreshing.set(false);
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
