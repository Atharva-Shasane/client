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
        [ownerReply]="activeOrder?.feedback?.ownerReply || ''"
        [dishRatings]="activeOrder?.feedback?.dishRatings || []"
        (close)="modalVisible = false"
        (refresh)="loadOrders()"
      ></app-feedback-modal>

      <header class="header">
        <h1>Order <span class="highlight">History</span></h1>
        <p>Review and track your recent culinary journeys.</p>
      </header>

      <div class="orders-grid">
        <div class="order-card glass-card" *ngFor="let order of orders()">
          <div class="card-header">
            <div class="meta">
              <span class="id">#{{ order.orderNumber }}</span>
              <span class="date">{{ order.createdAt | date: 'medium' }}</span>
            </div>
            <div class="status-group">
              <!-- NEW: Message Badge Indicator -->
              <span *ngIf="order.feedback?.ownerReply" class="reply-badge">New Reply</span>
              <span class="status" [ngClass]="order.orderStatus.toLowerCase()">
                {{ order.orderStatus }}
              </span>
            </div>
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
                <span class="view-lbl">View Response</span>
              </div>

              <ng-template #addFeedback>
                <button (click)="openFeedback(order, false)" class="btn-rate">Rate Order</button>
              </ng-template>
            </div>

            <div class="action-buttons">
              <button
                *ngIf="order.orderStatus === 'NEW'"
                (click)="onCancel(order._id)"
                class="btn-cancel"
              >
                Cancel
              </button>
              <button (click)="onReorder(order)" class="btn-reorder">Reorder</button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="orders().length === 0" class="empty-state glass-card">
        <h3>No history found.</h3>
        <a routerLink="/menu" class="btn-primary">Explore Menu</a>
      </div>
    </div>
  `,
  styles: [
    `
      .orders-container {
        padding: 60px 24px 80px;
        max-width: 850px;
        margin: 0 auto;
      }
      h1 {
        font-size: 2rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6600;
      }
      .header p {
        color: #555;
        margin-top: 5px;
        font-size: 0.9rem;
      }

      .orders-grid {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 30px;
      }
      .order-card {
        padding: 20px;
        border: 1px solid #1a1a1a;
        border-radius: 16px;
        transition: 0.2s;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
      }
      .id {
        display: block;
        font-family: monospace;
        font-weight: 900;
        color: #ff6600;
        font-size: 0.95rem;
      }
      .date {
        font-size: 0.7rem;
        color: #444;
      }

      .status-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .reply-badge {
        background: #ff6600;
        color: white;
        font-size: 0.55rem;
        font-weight: 900;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
        }
      }

      .status {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.6rem;
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
        margin-bottom: 15px;
      }
      .item-summary {
        font-size: 0.85rem;
        color: #bbb;
        margin-bottom: 4px;
      }
      .qty {
        color: #ff6600;
        font-weight: 900;
        margin-right: 6px;
      }
      .total-bar {
        margin-top: 10px;
        font-weight: 800;
        display: flex;
        gap: 6px;
        font-size: 0.9rem;
      }
      .total-bar .val {
        color: #ff6600;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #111;
        padding-top: 15px;
      }
      .action-buttons {
        display: flex;
        gap: 8px;
      }

      .btn-rate {
        background: #ff6600;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-reorder {
        background: #111;
        color: white;
        border: 1px solid #222;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-cancel {
        background: transparent;
        border: 1px solid #333;
        color: #444;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.8rem;
      }

      .feedback-pill {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        padding: 6px 14px;
        border-radius: 10px;
        background: #000;
        border: 1px solid #1a1a1a;
        min-width: 110px;
      }
      .rating-info {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .rating-num {
        font-size: 1rem;
        font-weight: 900;
        color: #fff;
      }
      .stars {
        font-size: 0.85rem;
        color: #ffcc00;
      }
      .view-lbl {
        font-size: 0.5rem;
        color: #555;
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

      .glass-card {
        background: rgba(10, 10, 10, 0.6);
        backdrop-filter: blur(10px);
      }
      .btn-primary {
        background: #ff6600;
        color: white;
        padding: 10px 24px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 800;
        display: inline-block;
        margin-top: 15px;
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
    if (confirm('Cancel this order?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.toast.success('Cancelled.');
          this.loadOrders();
        },
        error: (err) => this.toast.error(err.error?.msg || 'Failed.'),
      });
    }
  }
}
