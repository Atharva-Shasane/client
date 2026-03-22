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
        <div class="order-card glass-card fade-in" *ngFor="let order of orders()">
          <div class="card-header">
            <div class="meta">
              <span class="id">#{{ order.orderNumber }}</span>
              <!-- DatePipe automatically handles local timezone conversion -->
              <span class="date">{{ order.createdAt | date: 'medium' }}</span>
            </div>
            <div class="status-group">
              <!-- Live Wait Time for active orders -->
              <div
                class="wait-badge"
                *ngIf="order.orderStatus === 'NEW' || order.orderStatus === 'PREPARING'"
              >
                <span class="pulse"></span> Est. {{ calculateWait(order) }}m
              </div>

              <!-- New Reply Badge -->
              <span *ngIf="order.feedback?.ownerReply" class="reply-badge">Kitchen Replied</span>

              <span class="status" [ngClass]="order.orderStatus.toLowerCase()">
                {{ order.orderStatus }}
              </span>
            </div>
          </div>

          <!-- Visual Progress Bar -->
          <div
            class="progress-track"
            *ngIf="order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED'"
          >
            <div class="p-bar" [style.width]="getProgress(order.orderStatus)"></div>
          </div>

          <div class="card-body">
            <div class="table-info" *ngIf="order.tableNumber">
              <span class="lbl">DINE-IN:</span> Table {{ order.tableNumber }}
            </div>

            <div class="item-list">
              <div class="item-summary" *ngFor="let item of order.items">
                <div class="item-main-row">
                  <span class="qty">{{ item.quantity }} x</span>
                  <span class="name">{{ item.name }}</span>
                  <span class="variant" *ngIf="item.variant !== 'SINGLE'"
                    >({{ item.variant }})</span
                  >
                </div>
                <p class="item-instr" *ngIf="item.instructions">"{{ item.instructions }}"</p>
              </div>
            </div>

            <div class="total-bar">
              <span class="lbl">Total Paid:</span>
              <span class="val">₹ {{ order.totalAmount }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="feedback-zone" *ngIf="order.orderStatus === 'COMPLETED'">
              <!-- Check if feedback exists AND is submitted -->
              <div
                *ngIf="order.feedback && order.feedback.isSubmitted; else addFeedback"
                class="feedback-pill"
                [ngClass]="getRatingClass(order.feedback.rating)"
                (click)="openFeedback(order, true)"
              >
                <div class="rating-info">
                  <span class="rating-num">{{ order.feedback.rating }}.0 ★</span>
                  <span class="view-status">Feedback Given</span>
                </div>
                <span class="view-lbl">View Details & Reply</span>
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
        <div class="empty-icon">🍽️</div>
        <h3>No history found.</h3>
        <p>Your legendary journey begins with your first bite.</p>
        <a routerLink="/menu" class="btn-primary">Explore Menu</a>
      </div>
    </div>
  `,
  styles: [
    `
      .orders-container {
        padding: 100px 24px 80px;
        max-width: 850px;
        margin: 0 auto;
      }
      .header h1 {
        font-size: 2.5rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -1.5px;
      }
      .highlight {
        color: #ff6600;
      }
      .header p {
        color: #555;
        margin-top: 5px;
        font-size: 1rem;
      }
      .orders-grid {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 40px;
      }
      .order-card {
        padding: 25px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 24px;
        background: rgba(10, 10, 10, 0.6);
        backdrop-filter: blur(15px);
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
        color: #444;
      }
      .status-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .wait-badge {
        background: rgba(255, 102, 0, 0.1);
        color: #ff6600;
        font-size: 0.7rem;
        font-weight: 900;
        padding: 4px 10px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .pulse {
        width: 6px;
        height: 6px;
        background: #ff6600;
        border-radius: 50%;
        animation: pulse-ring 1.5s infinite;
      }
      @keyframes pulse-ring {
        0%,
        100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
      .reply-badge {
        background: #00ff88;
        color: #000;
        font-size: 0.6rem;
        font-weight: 900;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .progress-track {
        height: 4px;
        background: #111;
        border-radius: 2px;
        margin-bottom: 20px;
        overflow: hidden;
      }
      .p-bar {
        height: 100%;
        background: #ff6600;
        transition: 1s ease;
      }
      .table-info {
        background: #000;
        border: 1px solid #1a1a1a;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 800;
        margin-bottom: 15px;
        color: #00ff88;
        width: fit-content;
      }
      .item-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }
      .item-summary {
        border-left: 2px solid #111;
        padding-left: 12px;
      }
      .qty {
        color: #ff6600;
        font-weight: 900;
        margin-right: 8px;
      }
      .total-bar {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #111;
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .total-bar .val {
        color: #ff6600;
        font-size: 1.4rem;
        font-weight: 900;
      }
      .status {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.65rem;
        font-weight: 900;
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
      .preparing {
        background: rgba(243, 156, 18, 0.1);
        color: #f39c12;
      }
      .cancelled {
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #111;
        padding-top: 15px;
      }
      .feedback-pill {
        cursor: pointer;
        padding: 10px 15px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: 0.3s;
      }
      .feedback-pill:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateY(-2px);
      }
      .rating-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      .rating-num {
        font-weight: 900;
        color: #ffcc00;
      }
      .view-status {
        font-size: 0.7rem;
        font-weight: 800;
        color: #00ff88;
        text-transform: uppercase;
      }
      .view-lbl {
        font-size: 0.65rem;
        color: #555;
        text-transform: uppercase;
        font-weight: 700;
      }
      .btn-rate {
        background: #ff6600;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .action-buttons {
        display: flex;
        gap: 10px;
      }
      .btn-reorder,
      .btn-cancel {
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-reorder {
        background: #111;
        color: white;
        border: 1px solid #222;
      }
      .btn-cancel {
        background: transparent;
        border: 1px solid #333;
        color: #444;
      }
      .empty-state {
        text-align: center;
        padding: 80px 40px;
        border-radius: 32px;
      }
      .btn-primary {
        background: #ff6600;
        color: white;
        padding: 14px 40px;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 900;
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
    setInterval(() => this.loadOrders(), 20000);
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe({
      next: (data: any[]) => this.orders.set(data),
      error: () => this.toast.show('Failed to sync history', 'error'),
    });
  }

  getProgress(status: string): string {
    const steps: { [key: string]: string } = {
      NEW: '20%',
      PREPARING: '60%',
      READY: '90%',
      COMPLETED: '100%',
    };
    return steps[status] || '0%';
  }

  calculateWait(order: any): number {
    return order.orderStatus === 'NEW' ? 25 : 12;
  }

  getRatingClass(rating: number): string {
    return rating >= 4 ? 'excellent' : rating === 3 ? 'good' : 'poor';
  }

  openFeedback(order: any, viewOnly: boolean) {
    this.activeOrder = order;
    this.isViewOnly = viewOnly;
    this.modalVisible = true;
  }

  onReorder(order: any) {
    this.orderService.reorderToCart(order);
    this.toast.show('Items re-added to cart', 'success');
    this.router.navigate(['/cart']);
  }

  onCancel(orderId: string) {
    if (confirm('Permanently cancel this order?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.toast.show('Order cancelled successfully.', 'success');
          this.loadOrders();
        },
        error: (err: any) => this.toast.show(err.error?.msg || 'Cancellation failed.', 'error'),
      });
    }
  }
}
