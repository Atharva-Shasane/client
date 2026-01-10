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
    <div class="orders-container container">
      <div class="header-section">
        <div class="title-box">
          <h1>Order <span class="highlight">History</span></h1>
          <p>Track your recent legendary meals.</p>
        </div>
        <div class="sync-status" *ngIf="isRefreshing">
          <div class="pulse-dot"></div>
          Live Syncing...
        </div>
      </div>

      <div *ngIf="loading() && orders().length === 0" class="loading-state">
        <div class="skeleton-order" *ngFor="let i of [1, 2, 3]"></div>
      </div>

      <div *ngIf="!loading() && orders().length === 0" class="empty-state glass-card">
        <div class="icon">🍽️</div>
        <h3>No legends found yet</h3>
        <p>Your order history is currently empty. Ready to change that?</p>
        <button (click)="router.navigate(['/menu'])" class="browse-btn">Explore Menu</button>
      </div>

      <div class="orders-grid">
        <div
          *ngFor="let order of orders()"
          class="order-card glass-card"
          [class.recent]="isRecent(order)"
        >
          <div class="order-header">
            <div class="main-info">
              <span class="order-id">#{{ order._id | slice : -6 }}</span>
              <span class="order-date">{{ order.createdAt | date : 'medium' }}</span>
            </div>
            <div class="status-badge" [ngClass]="order.orderStatus.toLowerCase()">
              {{ order.orderStatus }}
            </div>
          </div>

          <div class="order-body">
            <div class="items-list">
              <div *ngFor="let item of order.items" class="item-row">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">₹{{ item.unitPrice * item.quantity }}</span>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <div class="pay-info">
              <span class="method">{{ order.paymentMethod }}</span>
              <span class="pay-status" [class.paid]="order.paymentStatus === 'PAID'">
                {{ order.paymentStatus }}
              </span>
            </div>
            <div class="total-section">
              <div class="total-box">
                <span class="label">Amount Paid</span>
                <span class="total-val">₹{{ order.totalAmount }}</span>
              </div>
              <div class="actions">
                <button
                  *ngIf="order.orderStatus === 'NEW'"
                  (click)="cancelOrder(order._id)"
                  class="btn-cancel"
                >
                  Cancel
                </button>
                <button (click)="onReorder(order)" class="btn-reorder">Order Again</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .orders-container {
        padding: 80px 24px;
        max-width: 900px !important;
      }
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 50px;
      }
      h1 {
        font-size: 3rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6600;
      }
      .header-section p {
        color: #888;
        margin-top: 5px;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.8rem;
        color: #ff6600;
        font-weight: 700;
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        background: #ff6600;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
        100% {
          opacity: 1;
        }
      }

      .orders-grid {
        display: flex;
        flex-direction: column;
        gap: 25px;
      }
      .order-card {
        padding: 0;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .order-card.recent {
        border-color: #ff6600;
        box-shadow: 0 10px 40px rgba(255, 107, 0, 0.15);
      }

      .order-header {
        padding: 20px 25px;
        background: rgba(255, 255, 255, 0.03);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .order-id {
        font-family: monospace;
        font-size: 1.1rem;
        font-weight: 800;
        color: #ff6600;
      }
      .order-date {
        display: block;
        font-size: 0.8rem;
        color: #666;
        margin-top: 2px;
      }

      .status-badge {
        padding: 6px 16px;
        border-radius: 50px;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .new {
        background: #3498db;
        color: white;
      }
      .preparing {
        background: #f39c12;
        color: white;
      }
      .ready {
        background: #9b59b6;
        color: white;
      }
      .completed {
        background: #2ecc71;
        color: white;
      }
      .cancelled {
        background: #e74c3c;
        color: white;
      }

      .order-body {
        padding: 25px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .item-row {
        display: grid;
        grid-template-columns: 40px 1fr auto;
        gap: 15px;
        margin-bottom: 12px;
        font-size: 0.95rem;
        color: #ddd;
      }
      .item-qty {
        font-weight: 800;
        color: #ff6600;
      }
      .item-price {
        font-weight: 700;
        color: white;
      }

      .order-footer {
        padding: 25px;
        background: rgba(0, 0, 0, 0.2);
      }
      .pay-info {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .pay-status.paid {
        color: #2ecc71;
      }

      .total-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .total-box {
        display: flex;
        flex-direction: column;
      }
      .total-box .label {
        font-size: 0.7rem;
        color: #666;
        text-transform: uppercase;
        font-weight: 800;
      }
      .total-val {
        font-size: 1.8rem;
        font-weight: 900;
        color: #ff6600;
      }

      .actions {
        display: flex;
        gap: 12px;
      }
      .btn-reorder {
        background: white;
        color: black;
        border: none;
        padding: 12px 25px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-reorder:hover {
        transform: scale(1.05);
        background: #ff6600;
        color: white;
      }
      .btn-cancel {
        background: transparent;
        border: 1px solid #ff4444;
        color: #ff4444;
        padding: 12px 25px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      .empty-state {
        text-align: center;
        padding: 80px;
      }
      .empty-state .icon {
        font-size: 4rem;
        margin-bottom: 20px;
      }
      .browse-btn {
        background: #ff6600;
        color: white;
        border: none;
        padding: 15px 40px;
        border-radius: 50px;
        font-weight: 800;
        cursor: pointer;
        margin-top: 25px;
      }

      @media (max-width: 600px) {
        .total-section {
          flex-direction: column;
          align-items: flex-start;
          gap: 20px;
        }
        .actions {
          width: 100%;
        }
        .btn-reorder {
          flex-grow: 1;
        }
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
    this.pollSubscription = interval(15000)
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
        error: () => {
          this.loading.set(false);
          this.isRefreshing = false;
        },
      });
  }

  ngOnDestroy() {
    this.pollSubscription?.unsubscribe();
  }

  cancelOrder(id: string) {
    if (!confirm('Cancel this order?')) return;
    this.orderService.cancelOrder(id).subscribe({
      next: () => {
        this.toast.success('Order cancelled');
        this.orderService.getMyOrders().subscribe((data) => this.orders.set(data));
      },
      error: (err) => this.toast.error(err.error?.msg || 'Failed'),
    });
  }

  onReorder(order: any) {
    this.orderService.reorderToCart(order);
  }

  isRecent(order: any): boolean {
    const created = new Date(order.createdAt).getTime();
    return new Date().getTime() - created < 5 * 60 * 1000;
  }
}
