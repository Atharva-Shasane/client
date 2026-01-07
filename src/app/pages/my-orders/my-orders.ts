import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order';
import { Router } from '@angular/router';
import { interval, Subscription, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="orders-container">
      <div class="header-row">
        <h2>My Order History</h2>
        <span *ngIf="isRefreshing" class="refresh-indicator">🔄 Updating...</span>
      </div>

      <div *ngIf="loading()" class="loading">Loading orders...</div>

      <div *ngIf="!loading() && orders().length === 0" class="empty-state">
        <p>You haven't placed any orders yet.</p>
        <button (click)="router.navigate(['/menu'])">Order Something Tasty</button>
      </div>

      <div class="orders-list">
        <div *ngFor="let order of orders()" class="order-card" [class.highlight]="isRecent(order)">
          <div class="order-header">
            <span class="order-id">#{{ order._id | slice : -6 }}</span>
            <div class="meta">
              <span class="order-date">{{ order.createdAt | date : 'medium' }}</span>
              <span class="status-badge" [ngClass]="getStatusClass(order.orderStatus)">
                {{ order.orderStatus }}
              </span>
            </div>
          </div>

          <div class="order-items">
            <div *ngFor="let item of order.items" class="item-row">
              <span>{{ item.quantity }}x {{ item.name }}</span>
              <span>₹{{ item.unitPrice * item.quantity }}</span>
            </div>
          </div>

          <div class="order-footer">
            <div class="info">
              <span class="payment-info"
                >{{ order.paymentMethod }} ({{ order.paymentStatus }})</span
              >
              <span class="total-amount">Total: ₹{{ order.totalAmount }}</span>
            </div>

            <div class="actions">
              <button
                *ngIf="order.orderStatus === 'NEW'"
                (click)="cancelOrder(order._id)"
                class="cancel-btn"
              >
                Cancel Order
              </button>

              <button (click)="onReorder(order)" class="reorder-btn">🔄 Reorder</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .orders-container {
        max-width: 800px;
        margin: 3rem auto;
        padding: 0 20px;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 3px solid #ff6b00;
        margin-bottom: 2rem;
        padding-bottom: 5px;
      }
      h2 {
        margin: 0;
      }
      .refresh-indicator {
        font-size: 0.8rem;
        color: #888;
        animation: pulse 1s infinite;
      }
      @keyframes pulse {
        0% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.5;
        }
      }

      .loading {
        text-align: center;
        color: #666;
        font-size: 1.2rem;
      }
      .empty-state {
        text-align: center;
        padding: 3rem;
        background: #f9f9f9;
        border-radius: 8px;
      }
      .empty-state button {
        background: #ff6b00;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
      }

      .order-card {
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.3s;
      }
      .highlight {
        border-color: #ff6b00;
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.15);
      }

      .order-header {
        background: #f8f8f8;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
      }
      .meta {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .order-id {
        font-weight: bold;
        color: #333;
        font-family: monospace;
        font-size: 1.1rem;
      }
      .order-date {
        font-size: 0.85rem;
        color: #666;
      }

      .status-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: bold;
        color: white;
        text-transform: uppercase;
      }
      .status-new {
        background: #3498db;
      }
      .status-preparing {
        background: #f39c12;
      }
      .status-ready {
        background: #9b59b6;
      }
      .status-completed {
        background: #2ecc71;
      }
      .status-cancelled {
        background: #e74c3c;
      }

      .order-items {
        padding: 1rem;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        color: #444;
      }

      .order-footer {
        padding: 1rem;
        background: #fff;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .info {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .payment-info {
        font-size: 0.85rem;
        color: #888;
      }
      .total-amount {
        font-size: 1.1rem;
        font-weight: bold;
        color: #333;
      }

      .actions {
        display: flex;
        gap: 10px;
      }

      .cancel-btn {
        background: white;
        border: 1px solid #e74c3c;
        color: #e74c3c;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: 0.3s;
      }
      .cancel-btn:hover {
        background: #e74c3c;
        color: white;
      }

      .reorder-btn {
        background: #2c3e50;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: 0.3s;
      }
      .reorder-btn:hover {
        background: #34495e;
      }

      @media (max-width: 600px) {
        .order-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }
        .meta {
          width: 100%;
          justify-content: space-between;
        }
        .order-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        .actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orderService = inject(OrderService);
  router = inject(Router);

  orders = signal<any[]>([]);
  loading = signal<boolean>(true);
  isRefreshing = false;

  private pollSubscription?: Subscription;

  ngOnInit() {
    this.loading.set(true);

    this.pollSubscription = interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => {
          this.isRefreshing = true;
          return this.orderService.getMyOrders();
        })
      )
      .subscribe({
        next: (data) => {
          this.orders.set(data);
          this.loading.set(false);
          this.isRefreshing = false;
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.isRefreshing = false;
        },
      });
  }

  ngOnDestroy() {
    if (this.pollSubscription) this.pollSubscription.unsubscribe();
  }

  cancelOrder(id: string) {
    if (!confirm('Cancel order?')) return;
    this.orderService.cancelOrder(id).subscribe({
      next: () => {
        alert('Order Cancelled');
        // Manually refresh orders after cancellation
        this.orderService.getMyOrders().subscribe((data) => this.orders.set(data));
      },
      error: (err) => alert(err.error.msg || 'Failed to cancel'),
    });
  }

  // ✅ CHANGED: Logic to add to cart and redirect
  onReorder(order: any) {
    if (
      !confirm(
        'Add these items to your cart and proceed to checkout? This will clear your current cart.'
      )
    )
      return;

    this.orderService.reorderToCart(order);
    this.router.navigate(['/checkout']);
  }

  getStatusClass(status: string) {
    return {
      'status-new': status === 'NEW',
      'status-preparing': status === 'PREPARING',
      'status-ready': status === 'READY',
      'status-completed': status === 'COMPLETED',
      'status-cancelled': status === 'CANCELLED',
    };
  }

  isRecent(order: any): boolean {
    const created = new Date(order.createdAt).getTime();
    const now = new Date().getTime();
    return now - created < 5 * 60 * 1000;
  }
}
