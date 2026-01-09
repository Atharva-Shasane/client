import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { interval, Subscription, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="orders-container">
      <div class="header-row">
        <h2>My Order History</h2>
        <span *ngIf="isRefreshing" class="refresh-indicator">Updating...</span>
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
              <button (click)="onReorder(order)" class="reorder-btn">Reorder</button>
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
        border-bottom: 3px solid #ff6600;
        margin-bottom: 2rem;
        padding-bottom: 5px;
      }
      .refresh-indicator {
        font-size: 0.8rem;
        color: #888;
      }
      .loading,
      .empty-state {
        text-align: center;
        padding: 3rem;
        background: #f9f9f9;
        border-radius: 8px;
      }
      .empty-state button {
        background: #ff6600;
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
      }
      .highlight {
        border-color: #ff6600;
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
      .total-amount {
        font-size: 1.1rem;
        font-weight: bold;
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
      }
      .reorder-btn {
        background: #2c3e50;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
    `,
  ],
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orderService = inject(OrderService);
  router = inject(Router);
  toast = inject(ToastService);

  orders = signal<any[]>([]);
  loading = signal<boolean>(true);
  isRefreshing = false;
  private pollSubscription?: Subscription;

  ngOnInit() {
    this.pollSubscription = interval(15000) // Poll every 15s
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
          this.loading.set(false);
          this.isRefreshing = false;
        },
      });
  }

  ngOnDestroy() {
    this.pollSubscription?.unsubscribe();
  }

  cancelOrder(id: string) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.orderService.cancelOrder(id).subscribe({
      next: () => {
        this.toast.success('Order cancelled successfully');
        this.orderService.getMyOrders().subscribe((data) => this.orders.set(data));
      },
      error: (err) => this.toast.error(err.error?.msg || 'Failed to cancel'),
    });
  }

  onReorder(order: any) {
    if (!confirm('Add these items to your cart and proceed? This will clear your current cart.'))
      return;

    this.orderService.reorderToCart(order);
    this.toast.success('Items added to cart');
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
    return now - created < 5 * 60 * 1000; // Highlight orders from last 5 mins
  }
}
