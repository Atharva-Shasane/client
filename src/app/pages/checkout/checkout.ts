import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checkout-container">
      <div class="header">
        <button class="back-link" (click)="router.navigate(['/cart'])">← Back to Cart</button>
        <h2>Complete Your Order</h2>
      </div>

      <div class="grid-layout">
        <div class="form-section glass-card">
          <!-- Step 1: Order Preferences -->
          <div class="section-group">
            <h3>1. Order Preferences</h3>
            <div class="radio-card-group">
              <label class="radio-card" [class.active]="orderType === 'DINE_IN'">
                <input type="radio" name="orderType" [(ngModel)]="orderType" value="DINE_IN" />
                <span class="icon">🍽️</span>
                <span class="label">Dine In</span>
              </label>
              <label class="radio-card" [class.active]="orderType === 'TAKEAWAY'">
                <input type="radio" name="orderType" [(ngModel)]="orderType" value="TAKEAWAY" />
                <span class="icon">🥡</span>
                <span class="label">Takeaway</span>
              </label>
            </div>

            <div *ngIf="orderType === 'DINE_IN'" class="fade-in mt-4">
              <div class="input-row">
                <div class="input-group">
                  <label>Guests</label>
                  <input type="number" [(ngModel)]="numberOfPeople" min="1" max="20" />
                </div>
                <div class="input-group">
                  <label>Arrival Time</label>
                  <input type="datetime-local" [(ngModel)]="scheduledTime" [min]="minTime" />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Payment -->
          <div class="section-group">
            <h3>2. Payment Method</h3>
            <div class="radio-card-group">
              <label class="radio-card" [class.active]="paymentMethod === 'CASH'">
                <input type="radio" name="paymentMethod" [(ngModel)]="paymentMethod" value="CASH" />
                <span class="icon">💵</span>
                <span class="label">Cash / Counter</span>
              </label>
              <label class="radio-card" [class.active]="paymentMethod === 'ONLINE'">
                <input
                  type="radio"
                  name="paymentMethod"
                  [(ngModel)]="paymentMethod"
                  value="ONLINE"
                />
                <span class="icon">💳</span>
                <span class="label">Online Payment</span>
              </label>
            </div>

            <p class="payment-note" *ngIf="paymentMethod === 'CASH'">
              ℹ️ You can pay at the restaurant counter using Cash, UPI, or Card upon arrival.
            </p>
            <p class="payment-note" *ngIf="paymentMethod === 'ONLINE'">
              🔒 Secured by Killa-Pay. Supports UPI, Cards, and NetBanking.
            </p>
          </div>

          <button
            (click)="handleCheckout()"
            class="place-btn"
            [disabled]="loading || cartService.totalItems() === 0"
          >
            <span *ngIf="!loading">
              {{ paymentMethod === 'ONLINE' ? 'Pay & Place Order' : 'Confirm Order' }}
            </span>
            <span *ngIf="loading">Processing...</span>
          </button>
        </div>

        <!-- Order Summary -->
        <div class="summary-section glass-card">
          <h3>Summary</h3>
          <div class="summary-list">
            <div *ngFor="let item of cartService.cartItems()" class="summary-item">
              <div class="item-info">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <span class="item-price">₹{{ item.computedPrice * item.quantity }}</span>
            </div>
          </div>
          <div class="total-box">
            <div class="row">
              <span>Subtotal</span><span>₹{{ cartService.totalPrice() }}</span>
            </div>
            <div class="row">
              <span>GST (5%)</span><span>₹{{ (cartService.totalPrice() * 0.05).toFixed(0) }}</span>
            </div>
            <div class="row grand-total">
              <span>Total</span><span>₹{{ (cartService.totalPrice() * 1.05).toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PAYMENT GATEWAY MODAL (Simulated) -->
    <div class="payment-modal-overlay" *ngIf="showPaymentModal">
      <div class="payment-modal glass-card">
        <div class="gateway-header">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
            height="24"
            alt="Gateway"
          />
          <span class="security">🔒 Secure Checkout</span>
        </div>
        <div class="gateway-body">
          <h4>Payment for Order #{{ tempOrderId }}</h4>
          <div class="amount-display">₹{{ (cartService.totalPrice() * 1.05).toFixed(0) }}</div>

          <div class="loading-state" *ngIf="paymentStep === 'PROCESSING'">
            <div class="spinner"></div>
            <p>Contacting your bank...</p>
          </div>

          <div class="success-state" *ngIf="paymentStep === 'SUCCESS'">
            <div class="check-icon">✓</div>
            <p>Payment Authorized Successfully!</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .checkout-container {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 0 20px;
        font-family: 'Poppins', sans-serif;
      }
      .header {
        margin-bottom: 2rem;
      }
      .back-link {
        background: none;
        border: none;
        color: #ff6b00;
        cursor: pointer;
        font-weight: 600;
        margin-bottom: 10px;
      }
      h2 {
        font-size: 2rem;
        font-weight: 800;
        color: #1a1a1a;
      }

      .grid-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 2rem;
      }
      .section-group {
        margin-bottom: 2.5rem;
      }
      h3 {
        font-size: 1.1rem;
        color: #666;
        margin-bottom: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .radio-card-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .radio-card {
        background: #f8f9fa;
        border: 2px solid #eee;
        padding: 20px;
        border-radius: 15px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        transition: 0.3s;
      }
      .radio-card input {
        display: none;
      }
      .radio-card.active {
        border-color: #ff6b00;
        background: #fffcf9;
        transform: scale(1.02);
      }
      .radio-card .icon {
        font-size: 1.5rem;
      }
      .radio-card .label {
        font-weight: 700;
        color: #333;
      }

      .input-row {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 15px;
        margin-top: 15px;
      }
      .input-group label {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        color: #666;
        margin-bottom: 5px;
      }
      input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: inherit;
      }

      .payment-note {
        font-size: 0.85rem;
        color: #ff6b00;
        margin-top: 15px;
        font-weight: 500;
      }

      .place-btn {
        width: 100%;
        padding: 18px;
        background: #1a1a1a;
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 800;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .place-btn:hover:not(:disabled) {
        background: #ff6b00;
        box-shadow: 0 10px 20px rgba(255, 107, 0, 0.3);
      }

      .summary-section {
        padding: 2rem;
        height: fit-content;
      }
      .summary-list {
        margin-bottom: 20px;
      }
      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 0.95rem;
      }
      .item-qty {
        font-weight: 800;
        color: #ff6b00;
        margin-right: 8px;
      }
      .total-box {
        border-top: 2px dashed #eee;
        padding-top: 20px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        color: #666;
      }
      .grand-total {
        font-size: 1.5rem;
        color: #1a1a1a;
        font-weight: 800;
        margin-top: 10px;
      }

      /* Payment Modal Styles */
      .payment-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .payment-modal {
        width: 90%;
        max-width: 400px;
        padding: 2rem;
        background: white;
        text-align: center;
      }
      .gateway-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
      }
      .security {
        font-size: 0.75rem;
        color: #27ae60;
        font-weight: bold;
      }
      .amount-display {
        font-size: 2.5rem;
        font-weight: 800;
        color: #1a1a1a;
        margin: 1rem 0;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #ff6b00;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      .check-icon {
        font-size: 3rem;
        color: #27ae60;
        margin: 20px 0;
      }

      @media (max-width: 900px) {
        .grid-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  orderService = inject(OrderService);
  router = inject(Router);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  orderType: 'DINE_IN' | 'TAKEAWAY' = 'DINE_IN';
  paymentMethod: 'CASH' | 'ONLINE' = 'CASH';
  numberOfPeople = 2;
  scheduledTime = '';
  loading = false;

  // Payment UI state
  showPaymentModal = false;
  paymentStep: 'PROCESSING' | 'SUCCESS' = 'PROCESSING';
  tempOrderId = Math.floor(100000 + Math.random() * 900000);

  ngOnInit() {
    this.setDefaultTime();
  }

  setDefaultTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 30); // 30 mins from now
    this.scheduledTime = now.toISOString().slice(0, 16);
  }

  get minTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  async handleCheckout() {
    if (this.paymentMethod === 'ONLINE') {
      this.processOnlinePayment();
    } else {
      this.placeFinalOrder();
    }
  }

  processOnlinePayment() {
    this.showPaymentModal = true;
    this.paymentStep = 'PROCESSING';

    // Simulate Payment Gateway Delay
    setTimeout(() => {
      this.paymentStep = 'SUCCESS';
      setTimeout(() => {
        this.showPaymentModal = false;
        this.placeFinalOrder('PAID', 'TXN_' + Date.now());
      }, 1500);
    }, 2500);
  }

  placeFinalOrder(paymentStatus: string = 'PENDING', txId: string = '') {
    this.loading = true;
    this.cdr.detectChanges();

    const orderData = {
      orderType: this.orderType,
      numberOfPeople: this.orderType === 'DINE_IN' ? this.numberOfPeople : 0,
      scheduledTime: this.orderType === 'DINE_IN' ? this.scheduledTime : null,
      paymentMethod: this.paymentMethod,
      paymentStatus: paymentStatus,
      transactionId: txId,
      totalAmount: (this.cartService.totalPrice() * 1.05).toFixed(0),
      items: this.cartService.cartItems().map((item) => ({
        menuItemId: item._id,
        name: item.name,
        quantity: item.quantity,
        variant: item.selectedVariant,
        unitPrice: item.computedPrice,
      })),
    };

    this.orderService.createOrder(orderData).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success(
          paymentStatus === 'PAID'
            ? 'Payment Received & Order Placed!'
            : 'Order Placed! Please pay at counter.'
        );
        this.cartService.clearCart();
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.msg || 'Failed to place order.');
      },
    });
  }
}
