import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
    <div class="checkout-wrapper fade-in">
      <div class="container">
        <header class="header">
          <button class="back-link" (click)="router.navigate(['/cart'])">← Back to Cart</button>
          <h1>Finalize Your <span class="highlight">Feast</span></h1>
        </header>

        <div class="checkout-grid">
          <!-- Selection Side -->
          <div class="form-side">
            <!-- Order Type -->
            <div class="config-card glass-card">
              <div class="card-header-icon">📍</div>
              <h3>Dining Experience</h3>
              <div class="preference-grid">
                <label class="pref-option" [class.active]="orderType === 'DINE_IN'">
                  <input type="radio" name="orderType" [(ngModel)]="orderType" value="DINE_IN" />
                  <div class="pref-content">
                    <span class="pref-icon">🍽️</span>
                    <div class="pref-text">
                      <span class="title">Dine In</span>
                      <span class="desc">Reserved Table</span>
                    </div>
                  </div>
                </label>

                <label class="pref-option" [class.active]="orderType === 'TAKEAWAY'">
                  <input type="radio" name="orderType" [(ngModel)]="orderType" value="TAKEAWAY" />
                  <div class="pref-content">
                    <span class="pref-icon">🥡</span>
                    <div class="pref-text">
                      <span class="title">Takeaway</span>
                      <span class="desc">Quick Pickup</span>
                    </div>
                  </div>
                </label>
              </div>

              <!-- Custom Time Picker Logic -->
              <div *ngIf="orderType === 'DINE_IN'" class="schedule-box fade-in">
                <div class="schedule-grid">
                  <div class="schedule-item">
                    <label>Guest Count</label>
                    <div class="number-stepper">
                      <button type="button" (click)="updateGuests(-1)">-</button>
                      <span class="count">{{ numberOfPeople }}</span>
                      <button type="button" (click)="updateGuests(1)">+</button>
                    </div>
                  </div>
                  <div class="schedule-item">
                    <label>Arrival Date</label>
                    <input
                      type="date"
                      class="custom-input"
                      [(ngModel)]="selectedDate"
                      [min]="minDate"
                      (change)="generateTimeSlots()"
                    />
                  </div>
                </div>

                <div class="slots-container">
                  <label>Select Arrival Time</label>
                  <div class="slots-grid">
                    <button
                      type="button"
                      *ngFor="let slot of availableSlots"
                      class="slot-btn"
                      [class.active]="selectedSlot === slot"
                      (click)="selectedSlot = slot"
                    >
                      {{ slot }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="config-card glass-card">
              <div class="card-header-icon">💳</div>
              <h3>Payment Selection</h3>
              <div class="payment-stack">
                <label class="pay-item" [class.active]="paymentMethod === 'CASH'">
                  <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="CASH" />
                  <span class="dot"></span>
                  <div class="pay-info">
                    <span class="label">Pay at Restaurant</span>
                    <span class="desc">Pay via Cash/UPI at our legendary counter</span>
                  </div>
                </label>

                <label class="pay-item" [class.active]="paymentMethod === 'ONLINE'">
                  <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="ONLINE" />
                  <span class="dot"></span>
                  <div class="pay-info">
                    <span class="label">Secure Online Payment</span>
                    <span class="desc">Fast and encrypted checkout with KillaPay</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              (click)="handleCheckout()"
              class="main-order-btn"
              [disabled]="
                loading ||
                cartService.totalItems() === 0 ||
                (orderType === 'DINE_IN' && !selectedSlot)
              "
            >
              <span *ngIf="!loading">
                {{
                  paymentMethod === 'ONLINE' ? 'Verify & Secure Payment' : 'Confirm Legendary Order'
                }}
              </span>
              <span *ngIf="loading">Processing Order...</span>
            </button>
          </div>

          <!-- Sidebar Summary -->
          <div class="summary-side">
            <div class="summary-box glass-card sticky-top">
              <h3>Order Summary</h3>
              <div class="item-scroll">
                <div *ngFor="let item of cartService.cartItems()" class="mini-item">
                  <div class="info">
                    <span class="qty">{{ item.quantity }}x</span>
                    <span class="name">{{ item.name }}</span>
                  </div>
                  <span class="price">₹{{ item.computedPrice * item.quantity }}</span>
                </div>
              </div>

              <div class="bill-details">
                <div class="bill-row">
                  <span>Subtotal</span>
                  <span>₹{{ cartService.totalPrice() }}</span>
                </div>
                <div class="bill-row">
                  <span>Legendary Tax (5%)</span>
                  <span>₹{{ (cartService.totalPrice() * 0.05).toFixed(0) }}</span>
                </div>
                <div class="bill-row grand">
                  <span>Grand Total</span>
                  <span class="val">₹{{ (cartService.totalPrice() * 1.05).toFixed(0) }}</span>
                </div>

                <div
                  class="schedule-summary fade-in"
                  *ngIf="orderType === 'DINE_IN' && selectedSlot"
                >
                  <span class="icon">📅</span> Reserved for {{ selectedSlot }} on {{ selectedDate }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Simulation -->
    <div class="pay-overlay" *ngIf="showPaymentModal">
      <div class="pay-dialog glass-card">
        <div class="loader-circle"></div>
        <h4>Securing Your Transaction</h4>
        <p>Connecting to KillaPay secure nodes... Please stay legendary.</p>
        <div class="status-success fade-in" *ngIf="paymentStep === 'SUCCESS'">
          <span class="icon-check">✔</span> Payment Authorized!
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .checkout-wrapper {
        padding: 120px 0 80px;
        min-height: 100vh;
        background: #0a0a0a;
        color: white;
        font-family: 'Poppins', sans-serif;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .header {
        margin-bottom: 40px;
      }
      .back-link {
        background: none;
        border: none;
        color: #ff6600;
        font-weight: 800;
        cursor: pointer;
        margin-bottom: 15px;
        font-size: 0.9rem;
        transition: 0.2s;
      }
      .back-link:hover {
        color: white;
        transform: translateX(-5px);
      }
      .header h1 {
        font-size: 3.2rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -1.5px;
      }
      .highlight {
        color: #ff6600;
      }

      .checkout-grid {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 40px;
      }

      /* Cards */
      .config-card {
        padding: 40px;
        margin-bottom: 30px;
        border-radius: 32px;
        border: 1px solid #222;
        position: relative;
      }
      .card-header-icon {
        font-size: 1.5rem;
        margin-bottom: 10px;
      }
      .config-card h3 {
        margin: 0 0 30px;
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: #666;
        font-weight: 800;
      }

      /* Preference Cards */
      .preference-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .pref-option {
        border: 2px solid #222;
        border-radius: 24px;
        cursor: pointer;
        transition: 0.3s;
        padding: 25px;
        background: #161616;
      }
      .pref-option input {
        display: none;
      }
      .pref-option.active {
        border-color: #ff6600;
        background: rgba(255, 102, 0, 0.05);
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
      }
      .pref-content {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .pref-icon {
        font-size: 2.2rem;
      }
      .pref-text .title {
        display: block;
        font-weight: 900;
        font-size: 1.2rem;
        color: white;
      }
      .pref-text .desc {
        font-size: 0.8rem;
        color: #666;
        font-weight: 600;
      }

      /* Schedule UI */
      .schedule-box {
        margin-top: 35px;
        background: #0d0d0d;
        padding: 30px;
        border-radius: 24px;
        border: 1px dashed #333;
      }
      .schedule-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 25px;
      }
      .schedule-item label {
        display: block;
        font-size: 0.75rem;
        font-weight: 800;
        color: #666;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .number-stepper {
        display: flex;
        align-items: center;
        background: #1a1a1a;
        border-radius: 14px;
        padding: 6px;
        justify-content: space-between;
        border: 1px solid #333;
      }
      .number-stepper button {
        width: 40px;
        height: 40px;
        border: none;
        background: #333;
        color: white;
        border-radius: 10px;
        font-weight: 900;
        cursor: pointer;
        transition: 0.2s;
      }
      .number-stepper button:hover {
        background: #ff6600;
      }
      .number-stepper .count {
        font-weight: 900;
        font-size: 1.3rem;
        color: #ff6600;
      }
      .custom-input {
        width: 100%;
        padding: 15px;
        border: 1px solid #333;
        background: #1a1a1a;
        color: white;
        border-radius: 14px;
        font-family: inherit;
        font-weight: 600;
        outline: none;
        transition: 0.2s;
      }
      .custom-input:focus {
        border-color: #ff6600;
      }

      .slots-container label {
        display: block;
        font-size: 0.75rem;
        font-weight: 800;
        color: #666;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .slots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 10px;
      }
      .slot-btn {
        padding: 14px;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 14px;
        color: white;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
        font-size: 0.8rem;
      }
      .slot-btn:hover {
        border-color: #ff6600;
        color: #ff6600;
      }
      .slot-btn.active {
        background: #ff6600;
        color: white;
        border-color: #ff6600;
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(255, 102, 0, 0.3);
      }

      /* Payment */
      .payment-stack {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .pay-item {
        display: flex;
        align-items: center;
        gap: 25px;
        padding: 25px 30px;
        border-radius: 24px;
        background: #161616;
        cursor: pointer;
        transition: 0.2s;
        border: 1px solid #222;
      }
      .pay-item .dot {
        width: 16px;
        height: 16px;
        border: 3px solid #333;
        border-radius: 50%;
      }
      .pay-item.active {
        background: rgba(255, 102, 0, 0.05);
        border-color: #ff6600;
      }
      .pay-item.active .dot {
        background: #ff6600;
        border-color: #ff6600;
        box-shadow: 0 0 12px rgba(255, 102, 0, 0.5);
      }
      .pay-item input {
        display: none;
      }
      .pay-info .label {
        display: block;
        font-weight: 800;
        font-size: 1.15rem;
        margin-bottom: 4px;
      }
      .pay-info .desc {
        font-size: 0.85rem;
        color: #666;
        font-weight: 600;
      }

      /* Order Button */
      .main-order-btn {
        width: 100%;
        padding: 26px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 24px;
        font-weight: 900;
        font-size: 1.35rem;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 15px;
        box-shadow: 0 10px 30px rgba(255, 107, 0, 0.3);
        letter-spacing: 0.5px;
      }
      .main-order-btn:hover:not(:disabled) {
        transform: translateY(-5px);
        filter: brightness(1.1);
        box-shadow: 0 15px 40px rgba(255, 107, 0, 0.5);
      }
      .main-order-btn:disabled {
        background: #222;
        color: #555;
        cursor: not-allowed;
        box-shadow: none;
      }

      /* Sidebar */
      .summary-box {
        padding: 45px;
        border-radius: 35px;
        border: 1px solid #222;
      }
      .sticky-top {
        position: sticky;
        top: 120px;
      }
      .summary-box h3 {
        margin: 0 0 30px;
        font-weight: 900;
        border-bottom: 1px solid #222;
        padding-bottom: 20px;
        font-size: 1.6rem;
        letter-spacing: -0.5px;
      }
      .item-scroll {
        max-height: 320px;
        overflow-y: auto;
        margin-bottom: 30px;
        border-bottom: 1px solid #222;
        padding-bottom: 25px;
      }
      .item-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .item-scroll::-webkit-scrollbar-thumb {
        background: #333;
        border-radius: 10px;
      }

      .mini-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        font-size: 1rem;
      }
      .mini-item .qty {
        font-weight: 900;
        color: #ff6600;
        margin-right: 15px;
      }
      .mini-item .name {
        color: #ddd;
      }
      .bill-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        color: #777;
        font-size: 1rem;
        font-weight: 600;
      }
      .bill-row.grand {
        margin-top: 30px;
        padding-top: 25px;
        border-top: 1px solid #222;
      }
      .bill-row.grand .val {
        font-size: 2.2rem;
        font-weight: 900;
        color: #ff6600;
      }
      .schedule-summary {
        margin-top: 30px;
        padding: 20px;
        background: rgba(255, 102, 0, 0.1);
        border-radius: 18px;
        border: 1px solid rgba(255, 102, 0, 0.2);
        font-size: 0.9rem;
        color: #ff6600;
        font-weight: 700;
        text-align: center;
      }

      /* Overlay */
      .pay-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.92);
        backdrop-filter: blur(12px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pay-dialog {
        padding: 60px;
        text-align: center;
        width: 420px;
        border-radius: 45px;
        border: 1px solid #333;
      }
      .loader-circle {
        width: 65px;
        height: 65px;
        border: 6px solid #222;
        border-top-color: #ff6600;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 35px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .status-success {
        color: #2ecc71;
        font-weight: 900;
        font-size: 1.3rem;
        margin-top: 25px;
      }

      @media (max-width: 1000px) {
        .checkout-grid {
          grid-template-columns: 1fr;
        }
        .summary-side {
          order: -1;
        }
        .summary-box {
          position: static;
        }
        .header h1 {
          font-size: 2.5rem;
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
  selectedDate = '';
  selectedSlot = '';
  availableSlots: string[] = [];
  loading = false;
  showPaymentModal = false;
  paymentStep: 'PROCESSING' | 'SUCCESS' = 'PROCESSING';

  ngOnInit() {
    this.selectedDate = new Date().toISOString().slice(0, 10);
    this.generateTimeSlots();
  }

  get minDate() {
    return new Date().toISOString().slice(0, 10);
  }

  updateGuests(change: number) {
    const newVal = this.numberOfPeople + change;
    if (newVal >= 1 && newVal <= 20) this.numberOfPeople = newVal;
  }

  generateTimeSlots() {
    const slots = [];
    for (let h = 11; h < 23; h++) {
      const displayH = h > 12 ? h - 12 : h;
      const suffix = h >= 12 ? 'PM' : 'AM';
      slots.push(`${displayH}:00 ${suffix}`, `${displayH}:30 ${suffix}`);
    }
    this.availableSlots = slots;
  }

  async handleCheckout() {
    if (this.paymentMethod === 'ONLINE') {
      this.showPaymentModal = true;
      this.paymentStep = 'PROCESSING';
      setTimeout(() => {
        this.paymentStep = 'SUCCESS';
        setTimeout(() => {
          this.showPaymentModal = false;
          this.placeFinalOrder('PAID', 'TXN_' + Date.now());
        }, 1500);
      }, 2500);
    } else {
      this.placeFinalOrder();
    }
  }

  placeFinalOrder(paymentStatus: string = 'PENDING', txId: string = '') {
    this.loading = true;
    this.cdr.detectChanges();

    const orderData = {
      orderType: this.orderType,
      numberOfPeople: this.orderType === 'DINE_IN' ? this.numberOfPeople : 0,
      scheduledTime:
        this.orderType === 'DINE_IN' ? `${this.selectedDate} ${this.selectedSlot}` : null,
      paymentMethod: this.paymentMethod,
      paymentStatus: paymentStatus,
      transactionId: txId,
      totalAmount: (this.cartService.totalPrice() * 1.05).toFixed(0),
      items: this.cartService.cartItems().map((i) => ({
        menuItemId: i._id,
        name: i.name,
        quantity: i.quantity,
        variant: i.selectedVariant,
        unitPrice: i.computedPrice,
      })),
    };

    this.orderService.createOrder(orderData).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success(
          paymentStatus === 'PAID'
            ? 'Legendary! Payment Received & Feast Confirmed.'
            : 'Feast Received! Please pay at the counter.'
        );
        this.cartService.clearCart();
        this.router.navigate(['/my-orders']);
      },
      error: (e) => {
        this.loading = false;
        this.toast.error(e.error?.msg || 'Failed to place legendary order.');
      },
    });
  }
}
