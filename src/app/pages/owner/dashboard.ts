import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard-container">
      <h2>Owner Dashboard</h2>

      <div class="stats-bar">
        <span>Active Orders: {{ orders().length }}</span>
        <button (click)="refresh()" class="refresh-btn">🔄 Refresh</button>
      </div>

      <div class="orders-grid">
        <div
          *ngFor="let order of orders()"
          class="order-card"
          [ngClass]="getCardClass(order.orderStatus)"
        >
          <div class="card-header">
            <span class="order-id">#{{ order._id | slice : -4 }}</span>
            <span class="time">{{ order.createdAt | date : 'shortTime' }}</span>
          </div>

          <div class="customer-details">
            <strong>{{ order.userId?.name || 'Guest' }}</strong
            ><br />
            <span class="type">{{ order.orderType }}</span>
          </div>

          <div class="items-list">
            <div *ngFor="let item of order.items">{{ item.quantity }}x {{ item.name }}</div>
          </div>

          <div class="status-control">
            <div class="current-status">{{ order.orderStatus }}</div>

            <div class="actions">
              <button
                *ngIf="order.orderStatus === 'NEW'"
                (click)="updateStatus(order._id, 'PREPARING')"
                class="btn-prepare"
              >
                Accept & Cook
              </button>

              <button
                *ngIf="order.orderStatus === 'PREPARING'"
                (click)="updateStatus(order._id, 'READY')"
                class="btn-ready"
              >
                Mark Ready
              </button>

              <button
                *ngIf="order.orderStatus === 'READY'"
                (click)="updateStatus(order._id, 'COMPLETED')"
                class="btn-complete"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="orders().length === 0" class="empty-state">
        No active orders. Kitchen is quiet.
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 2rem;
        background: #f0f2f5;
        min-height: 100vh;
      }
      h2 {
        margin-top: 0;
        color: #333;
      }

      .stats-bar {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2rem;
        align-items: center;
      }
      .refresh-btn {
        padding: 8px 16px;
        background: #333;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .order-card {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        border-left: 5px solid #ccc;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* Status Colors */
      .status-NEW {
        border-left-color: #3498db;
        background: #eef7fc;
      }
      .status-PREPARING {
        border-left-color: #f39c12;
        background: #fef9e7;
      }
      .status-READY {
        border-left-color: #2ecc71;
        background: #eafaf1;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        color: #555;
      }
      .customer-details {
        border-bottom: 1px solid #ddd;
        padding-bottom: 0.5rem;
      }
      .type {
        font-size: 0.8rem;
        background: #333;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .items-list {
        flex-grow: 1;
        font-size: 0.95rem;
        line-height: 1.4;
      }

      .status-control {
        margin-top: auto;
        border-top: 1px dashed #ccc;
        padding-top: 1rem;
        text-align: center;
      }
      .current-status {
        font-weight: bold;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #666;
      }

      button {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        color: white;
        transition: 0.2s;
      }
      .btn-prepare {
        background: #f39c12;
      }
      .btn-ready {
        background: #2ecc71;
      }
      .btn-complete {
        background: #333;
      }
      button:hover {
        opacity: 0.9;
        transform: scale(1.02);
      }

      .empty-state {
        text-align: center;
        padding: 4rem;
        color: #888;
        font-size: 1.2rem;
      }
    `,
  ],
})
export class OwnerDashboardComponent implements OnInit {
  orderService = inject(OrderService);

  orders = signal<any[]>([]);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.orderService.getOwnerOrders().subscribe({
      next: (data: any) => this.orders.set(data),
      error: (err) => alert('Access Denied: You are not an owner!'),
    });
  }

  updateStatus(id: string, status: string) {
    this.orderService.updateOrderStatus(id, status).subscribe(() => {
      this.refresh(); // Reload list to update UI
    });
  }

  getCardClass(status: string) {
    return `status-${status}`;
  }
}
