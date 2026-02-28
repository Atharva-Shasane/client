import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';
import { FeedbackModalComponent } from '../../components/feedback-modal/feedback';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, FeedbackModalComponent, RouterLink],
  template: `
    <div class="orders-container container">
      <!-- Modular Feedback Component -->
      <app-feedback-modal
        [isVisible]="modalVisible"
        [isViewOnly]="isViewOnly"
        [orderId]="activeOrder?._id"
        [orderNumber]="activeOrder?.orderNumber"
        [items]="activeOrder?.items || []"
        [initialRating]="activeOrder?.feedback?.rating"
        [initialComment]="activeOrder?.feedback?.comment"
        (close)="modalVisible = false"
        (refresh)="loadOrders()"
      ></app-feedback-modal>

      <header class="header">
        <h1>Order <span class="highlight">History</span></h1>
        <p>Manage and track your legendary feasts.</p>
      </header>

      <div class="orders-grid">
        <div class="order-card glass-card" *ngFor="let order of orders()">
          <div class="card-header">
            <div class="meta">
              <span class="id">#{{ order.orderNumber }}</span>
              <span class="date">{{ order.createdAt | date: 'medium' }}</span>
            </div>
            <span class="status" [ngClass]="order.orderStatus.toLowerCase()">
              {{ order.orderStatus }}
            </span>
          </div>

          <div class="card-body">
            <div class="item-summary" *ngFor="let item of order.items">
              <span class="qty">{{ item.quantity }}x</span> {{ item.name }}
            </div>
            <div class="total-bar">
              <span class="lbl">Total Paid:</span>
              <span class="val">₹{{ order.totalAmount }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="feedback-zone" *ngIf="order.orderStatus === 'COMPLETED'">
              <div
                *ngIf="order.feedback && order.feedback.isSubmitted; else addFeedback"
                class="feedback-pill"
                [ngClass]="getRatingClass(order.feedback.rating)"
                (click)="openFeedback(order, true)"
              >
                <div class="rating-info">
                  <span class="rating-num">{{ order.feedback.rating }}.0</span>
                  <span class="stars">{{ '★'.repeat(order.feedback.rating) }}</span>
                </div>
                <span class="view-lbl">View Review</span>
              </div>

              <ng-template #addFeedback>
                <button (click)="openFeedback(order, false)" class="btn-rate">Rate Order</button>
              </ng-template>
            </div>

            <div class="action-buttons">
              <!-- CANCEL BUTTON: Visible only if status is NEW -->
              <button
                *ngIf="order.orderStatus === 'NEW'"
                (click)="onCancel(order._id)"
                class="btn-cancel"
              >
                Cancel Order
              </button>

              <button (click)="onReorder(order)" class="btn-reorder">Order Again</button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="orders().length === 0" class="empty-state glass-card">
        <h3>No feasts found!</h3>
        <a routerLink="/menu" class="btn-primary">Explore Menu</a>
      </div>
    </div>
  `,
  styles: [
    `
      .orders-container {
        padding: 100px 24px 80px;
        max-width: 900px;
        margin: 0 auto;
      }
      h1 {
        font-size: 2.5rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6600;
      }
      .header p {
        color: #666;
        margin-top: 5px;
        font-size: 1rem;
      }

      .orders-grid {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 35px;
      }
      .order-card {
        padding: 25px;
        border: 1px solid #222;
        border-radius: 24px;
        transition: 0.3s;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }
      .id {
        display: block;
        font-family: monospace;
        font-weight: 900;
        color: #ff6600;
        font-size: 1.1rem;
      }
      .date {
        font-size: 0.75rem;
        color: #555;
      }

      .status {
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
      }
      .completed {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
      }
      .new {
        background: rgba(52, 152, 219, 0.1);
        color: #3498db;
      }
      .cancelled {
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
      }

      .card-body {
        margin-bottom: 20px;
      }
      .item-summary {
        font-size: 0.9rem;
        color: #ddd;
        margin-bottom: 6px;
      }
      .qty {
        color: #ff6600;
        font-weight: 900;
        margin-right: 8px;
      }
      .total-bar {
        margin-top: 12px;
        font-weight: 800;
        display: flex;
        gap: 8px;
      }
      .total-bar .val {
        color: #ff6600;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #222;
        padding-top: 20px;
      }
      .action-buttons {
        display: flex;
        gap: 12px;
      }

      .btn-rate {
        background: #ff6600;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-reorder {
        background: #1a1a1a;
        color: white;
        border: 1px solid #333;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-reorder:hover {
        background: #222;
      }

      .btn-cancel {
        background: transparent;
        border: 1px solid #e74c3c;
        color: #e74c3c;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-cancel:hover {
        background: #e74c3c;
        color: white;
      }

      .feedback-pill {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        padding: 8px 16px;
        border-radius: 14px;
        background: #000;
        border: 1px solid #222;
        min-width: 130px;
      }
      .rating-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .rating-num {
        font-size: 1.2rem;
        font-weight: 900;
      }
      .stars {
        font-size: 1rem;
        color: #ffcc00;
      }
      .view-lbl {
        font-size: 0.6rem;
        color: #444;
        font-weight: 800;
        text-transform: uppercase;
        margin-top: 2px;
      }

      .rate-excellent .rating-num {
        color: #2ecc71;
      }
      .rate-good .rating-num {
        color: #f1c40f;
      }
      .rate-poor .rating-num {
        color: #e74c3c;
      }

      .empty-state {
        text-align: center;
        padding: 60px;
        border-radius: 32px;
      }
      .btn-primary {
        background: #ff6600;
        color: white;
        padding: 12px 30px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 800;
        display: inline-block;
        margin-top: 20px;
      }
    `,
  ],
})
export class MyOrdersComponent implements OnInit {
  orderService = inject(OrderService);
  toast = inject(ToastService);
  router = inject(Router);
  orders = signal<any[]>([]);
  modalVisible = false;
  isViewOnly = false;
  activeOrder: any = null;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe((data) => {
      this.orders.set(data);
    });
  }

  getRatingClass(rating: number): string {
    if (rating >= 4) return 'rate-excellent';
    if (rating === 3) return 'rate-good';
    return 'rate-poor';
  }

  openFeedback(order: any, viewOnly: boolean) {
    this.activeOrder = order;
    this.isViewOnly = viewOnly;
    this.modalVisible = true;
  }

  onReorder(order: any) {
    this.orderService.reorderToCart(order);
  }

  onCancel(orderId: string) {
    if (confirm('Are you sure you want to cancel this legendary order? This cannot be undone.')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.toast.success('Order cancelled successfully.');
          this.loadOrders();
        },
        error: (err) => {
          this.toast.error(
            err.error?.msg || 'Cancellation failed. The kitchen may have already started cooking.',
          );
        },
      });
    }
  }
}
