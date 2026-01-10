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
    <div class="checkout-container">
      <div class="header">
        <button class="back-link" (click)="router.navigate(['/cart'])">← Edit Cart</button>
        <h2>Finalize <span class="highlight">Order</span></h2>
      </div>

      <div class="grid-layout">
        <!-- Main Form -->
        <div class="form-side">
          <!-- Order Type Card -->
          <div class="config-card glass-card">
            <h3>Dining Preference</h3>
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
                    <span class="desc">Self-Pickup</span>
                  </div>
                </div>
              </label>
            </div>

            <!-- Custom Schedule UI -->
            <div *ngIf="orderType === 'DINE_IN'" class="schedule-box fade-in">
              <div class="schedule-header">
                <span class="icon">📅</span>
                <h4>Schedule Your Visit</h4>
              </div>

              <div class="schedule-grid">
                <!-- Guest Count -->
                <div class="schedule-item">
                  <label>Number of Guests</label>
                  <div class="number-stepper">
                    <button type="button" (click)="updateGuests(-1)">-</button>
                    <span class="count">{{ numberOfPeople }}</span>
                    <button type="button" (click)="updateGuests(1)">+</button>
                  </div>
                </div>

                <!-- Date Picker -->
                <div class="schedule-item">
                  <label>Visit Date</label>
                  <input
                    type="date"
                    class="custom-date-input"
                    [(ngModel)]="selectedDate"
                    [min]="minDate"
                    (change)="generateTimeSlots()"
                  />
                </div>
              </div>

              <!-- Time Slot Grid -->
              <div class="time-slot-container">
                <label>Available Slots</label>
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

          <!-- Payment Card -->
          <div class="config-card glass-card">
            <h3>Payment Selection</h3>
            <div class="payment-options">
              <label class="pay-item" [class.active]="paymentMethod === 'CASH'">
                <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="CASH" />
                <span class="dot"></span>
                <span class="label">Pay at Restaurant (Cash/UPI)</span>
              </label>

              <label class="pay-item" [class.active]="paymentMethod === 'ONLINE'">
                <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="ONLINE" />
                <span class="dot"></span>
                <span class="label">Secure Online Payment</span>
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
              {{ paymentMethod === 'ONLINE' ? 'Pay & Place Order' : 'Confirm Order' }}
            </span>
            <span *ngIf="loading">Processing Legends...</span>
          </button>
        </div>

        <!-- Sidebar Summary -->
        <div class="summary-side">
          <div class="sticky-box glass-card">
            <div class="summary-header">
              <h3>Order Detail</h3>
              <span class="item-count">{{ cartService.totalItems() }} items</span>
            </div>

            <div class="item-list">
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
                <span>Restaurant GST (5%)</span>
                <span>₹{{ (cartService.totalPrice() * 0.05).toFixed(0) }}</span>
              </div>
              <div class="bill-row grand">
                <span>Total Amount</span>
                <span>₹{{ (cartService.totalPrice() * 1.05).toFixed(0) }}</span>
              </div>

              <!-- Selected Time Display -->
              <div class="schedule-summary" *ngIf="orderType === 'DINE_IN' && selectedSlot">
                <span class="icon">🕒</span> Scheduled for {{ selectedSlot }} on {{ selectedDate }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Overlay -->
    <div class="pay-overlay" *ngIf="showPaymentModal">
      <div class="pay-dialog glass-card">
        <div class="loader-circle"></div>
        <h4>Securing Payment</h4>
        <p>Connecting to secure server... Please do not refresh.</p>
        <div class="payment-status" *ngIf="paymentStep === 'SUCCESS'">
          <span class="check">✔</span> Authorized Successfully!
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .checkout-container {
        max-width: 1200px;
        margin: 3rem auto;
        padding: 0 20px;
        font-family: 'Poppins', sans-serif;
      }
      .header {
        margin-bottom: 2rem;
      }
      .back-link {
        background: none;
        border: none;
        color: #ff6600;
        font-weight: 700;
        cursor: pointer;
        margin-bottom: 10px;
      }
      .header h2 {
        font-size: 2.5rem;
        font-weight: 800;
        color: #1a1a1a;
        margin: 0;
      }
      .highlight {
        color: #ff6600;
      }

      .grid-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 2.5rem;
      }

      /* Cards */
      .config-card {
        padding: 2.5rem;
        margin-bottom: 2rem;
        border-radius: 24px;
      }
      .config-card h3 {
        margin-top: 0;
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #888;
        margin-bottom: 1.5rem;
      }

      /* Preference Selector */
      .preference-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .pref-option {
        border: 2px solid #eee;
        border-radius: 20px;
        cursor: pointer;
        transition: 0.3s;
        padding: 20px;
      }
      .pref-option input {
        display: none;
      }
      .pref-option.active {
        border-color: #ff6600;
        background: #fffcf9;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 107, 0, 0.1);
      }
      .pref-content {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .pref-icon {
        font-size: 2rem;
      }
      .pref-text .title {
        display: block;
        font-weight: 800;
        font-size: 1.1rem;
        color: #333;
      }
      .pref-text .desc {
        font-size: 0.8rem;
        color: #888;
      }

      /* Custom Schedule UI */
      .schedule-box {
        margin-top: 2rem;
        background: #fdfdfd;
        padding: 25px;
        border-radius: 20px;
        border: 1px solid #eee;
      }
      .schedule-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .schedule-header h4 {
        margin: 0;
        font-weight: 700;
        color: #333;
      }
      .schedule-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }

      .schedule-item label {
        display: block;
        font-size: 0.8rem;
        font-weight: 700;
        color: #888;
        margin-bottom: 8px;
        text-transform: uppercase;
      }

      .number-stepper {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 5px;
        justify-content: space-between;
      }
      .number-stepper button {
        width: 35px;
        height: 35px;
        border: none;
        background: #f0f0f0;
        border-radius: 8px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .number-stepper button:hover {
        background: #ff6600;
        color: white;
      }
      .number-stepper .count {
        font-weight: 800;
        font-size: 1.1rem;
      }

      .custom-date-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 12px;
        font-family: inherit;
        font-weight: 600;
      }

      .time-slot-container label {
        display: block;
        font-size: 0.8rem;
        font-weight: 700;
        color: #888;
        margin-bottom: 12px;
        text-transform: uppercase;
      }
      .slots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 10px;
      }
      .slot-btn {
        padding: 10px;
        background: white;
        border: 1px solid #eee;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
        font-size: 0.85rem;
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
      }

      /* Payment */
      .payment-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pay-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 20px;
        border-radius: 12px;
        background: #f9f9f9;
        cursor: pointer;
        transition: 0.2s;
      }
      .pay-item .dot {
        width: 12px;
        height: 12px;
        border: 2px solid #ccc;
        border-radius: 50%;
      }
      .pay-item.active {
        background: #fffcf9;
        border: 1px solid #ff6600;
      }
      .pay-item.active .dot {
        background: #ff6600;
        border-color: #ff6600;
      }
      .pay-item input {
        display: none;
      }

      /* Order Button */
      .main-order-btn {
        width: 100%;
        padding: 22px;
        background: #1a1a1a;
        color: white;
        border: none;
        border-radius: 18px;
        font-weight: 800;
        font-size: 1.2rem;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 1rem;
      }
      .main-order-btn:hover:not(:disabled) {
        background: #ff6600;
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(255, 107, 0, 0.3);
      }

      /* Sidebar */
      .sticky-box {
        padding: 2rem;
        position: sticky;
        top: 100px;
      }
      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 1.5rem;
      }
      .item-count {
        font-size: 0.8rem;
        color: #888;
        font-weight: 600;
      }
      .item-list {
        border-bottom: 1px solid #eee;
        padding-bottom: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .mini-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 0.95rem;
      }
      .mini-item .qty {
        font-weight: 800;
        color: #ff6600;
        margin-right: 8px;
      }
      .bill-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        color: #666;
        font-size: 0.9rem;
      }
      .bill-row.grand {
        margin-top: 1.5rem;
        font-size: 1.4rem;
        font-weight: 800;
        color: #1a1a1a;
      }
      .schedule-summary {
        margin-top: 1.5rem;
        padding: 12px;
        background: #fff8f0;
        border-radius: 10px;
        border: 1px solid #ffead0;
        font-size: 0.85rem;
        color: #b05000;
        font-weight: 600;
      }

      /* Payment Modal */
      .pay-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pay-dialog {
        padding: 3rem;
        text-align: center;
        width: 350px;
      }
      .loader-circle {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top-color: #ff6600;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 900px) {
        .grid-layout {
          grid-template-columns: 1fr;
        }
        .summary-side {
          order: -1;
        }
        .schedule-grid {
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

  // Custom Scheduling State
  selectedDate = '';
  selectedSlot = '';
  availableSlots: string[] = [];

  loading = false;
  showPaymentModal = false;
  paymentStep: 'PROCESSING' | 'SUCCESS' = 'PROCESSING';

  ngOnInit() {
    this.setDefaultValues();
    this.generateTimeSlots();
  }

  setDefaultValues() {
    const now = new Date();
    this.selectedDate = now.toISOString().slice(0, 10);
  }

  get minDate() {
    return new Date().toISOString().slice(0, 10);
  }

  updateGuests(change: number) {
    const newCount = this.numberOfPeople + change;
    if (newCount >= 1 && newCount <= 20) {
      this.numberOfPeople = newCount;
    }
  }

  /**
   * Generates dining slots from 11:00 AM to 11:00 PM
   */
  generateTimeSlots() {
    const slots = [];
    const startHour = 11;
    const endHour = 23;

    for (let h = startHour; h < endHour; h++) {
      const hour = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      slots.push(`${hour}:00 ${ampm}`);
      slots.push(`${hour}:30 ${ampm}`);
    }

    // In a real app, you might filter out slots that have passed for 'today'
    this.availableSlots = slots;
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

    // Format the final scheduled time for the backend
    const finalSchedule =
      this.orderType === 'DINE_IN' ? `${this.selectedDate} ${this.selectedSlot}` : null;

    const orderData = {
      orderType: this.orderType,
      numberOfPeople: this.orderType === 'DINE_IN' ? this.numberOfPeople : 0,
      scheduledTime: finalSchedule,
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
            ? 'Legendary! Payment Received & Order Placed.'
            : 'Order Confirmed! Please pay at the counter.'
        );
        this.cartService.clearCart();
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.msg || 'Failed to finalize order.');
      },
    });
  }
}
