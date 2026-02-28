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
          <button class="back-link" (click)="router.navigate(['cart'])">← Return to Cart</button>
          <span class="badge">Final Step</span>
          <h1>Complete Your <span class="highlight">Order</span></h1>
        </header>

        <div class="checkout-grid">
          <!-- Selection Side -->
          <div class="form-side">
            <div class="config-card glass-card">
              <div class="card-head">
                <span class="icon">🏠</span>
                <h3>Dining Preference</h3>
              </div>

              <div class="option-grid">
                <label class="select-card" [class.active]="orderType === 'DINE_IN'">
                  <input type="radio" name="orderType" [(ngModel)]="orderType" value="DINE_IN" />
                  <div class="card-content">
                    <span class="card-title">Dine In</span>
                    <span class="card-desc">Reserve a table at our venue</span>
                  </div>
                </label>
                <label class="select-card" [class.active]="orderType === 'TAKEAWAY'">
                  <input type="radio" name="orderType" [(ngModel)]="orderType" value="TAKEAWAY" />
                  <div class="card-content">
                    <span class="card-title">Takeaway</span>
                    <span class="card-desc">Pick up your feast at the counter</span>
                  </div>
                </label>
              </div>

              <!-- Extra info for Dine-in -->
              <div *ngIf="orderType === 'DINE_IN'" class="extra-config fade-in">
                <div class="row">
                  <div class="field">
                    <label>Guest Count</label>
                    <div class="stepper">
                      <button (click)="updateGuests(-1)">-</button>
                      <span class="val">{{ numberOfPeople }}</span>
                      <button (click)="updateGuests(1)">+</button>
                    </div>
                  </div>
                  <div class="field">
                    <label>Arrival Date</label>
                    <input
                      type="date"
                      [(ngModel)]="selectedDate"
                      [min]="minDate"
                      class="dark-input"
                      (change)="generateTimeSlots()"
                    />
                  </div>
                </div>
                <div class="slots-area">
                  <label>Arrival Time Slot</label>
                  <div class="slots-grid">
                    <button
                      *ngFor="let slot of availableSlots"
                      [class.active]="selectedSlot === slot"
                      (click)="selectedSlot = slot"
                      class="slot-btn"
                    >
                      {{ slot }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="config-card glass-card">
              <div class="card-head">
                <span class="icon">💳</span>
                <h3>Payment Method</h3>
              </div>

              <div class="payment-list">
                <label class="payment-card" [class.active]="paymentMethod === 'CASH'">
                  <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="CASH" />
                  <div class="p-info">
                    <span class="p-title">Pay at Restaurant</span>
                    <span class="p-desc">Cash or UPI at the counter</span>
                  </div>
                </label>
                <label class="payment-card" [class.active]="paymentMethod === 'ONLINE'">
                  <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="ONLINE" />
                  <div class="p-info">
                    <span class="p-title">KillaPay Secure Online</span>
                    <span class="p-desc">Instant confirmation with card/UPI</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              (click)="handleCheckout()"
              class="submit-order-btn"
              [disabled]="
                loading ||
                cartService.totalItems() === 0 ||
                (orderType === 'DINE_IN' && !selectedSlot)
              "
            >
              <span *ngIf="!loading">{{
                paymentMethod === 'ONLINE' ? 'Verify & Pay Now' : 'Confirm Order'
              }}</span>
              <span *ngIf="loading">Processing Order...</span>
            </button>
          </div>

          <!-- Sidebar Summary -->
          <div class="summary-side">
            <div class="summary-box glass-card sticky-top">
              <h3>Receipt</h3>
              <div class="items-list-mini">
                <div *ngFor="let item of cartService.cartItems()" class="mini-row">
                  <div class="m-info">
                    <span class="m-qty">{{ item.quantity }}x</span>
                    <span class="m-name">{{ item.name }}</span>
                  </div>
                  <span class="m-price">₹{{ item.computedPrice * item.quantity }}</span>
                </div>
              </div>

              <div class="totals-area">
                <div class="t-row">
                  <span>Total Payable</span>
                  <span class="t-val">₹{{ cartService.totalPrice() }}</span>
                </div>
                <p class="tax-note">Fixed pricing with no hidden charges</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Overlay -->
    <div class="pay-overlay" *ngIf="showPaymentModal">
      <div class="pay-dialog glass-card animate-pop">
        <div class="spinner"></div>
        <h4>Securing Transaction</h4>
        <p>Connecting to KillaPay servers...</p>
        <div class="success-msg fade-in" *ngIf="paymentStep === 'SUCCESS'">Payment Authorized!</div>
      </div>
    </div>
  `,
  styles: [
    `
      .checkout-wrapper {
        padding: 100px 0 80px;
        min-height: 100vh;
        background: #050505;
        color: white;
        font-family: 'Inter', sans-serif;
      }
      .container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .header h1 {
        font-size: 2.5rem;
        font-weight: 900;
        margin: 10px 0;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6600;
      }
      .back-link {
        background: none;
        border: none;
        color: #ff6600;
        cursor: pointer;
        font-weight: 800;
        margin-bottom: 20px;
        transition: 0.2s;
      }
      .back-link:hover {
        color: #fff;
      }

      .checkout-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 30px;
      }

      .config-card {
        padding: 30px;
        border-radius: 32px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        margin-bottom: 25px;
      }
      .card-head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 25px;
      }
      .card-head .icon {
        font-size: 1.2rem;
        background: #111;
        padding: 8px;
        border-radius: 10px;
        border: 1px solid #222;
      }
      .card-head h3 {
        font-size: 1rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #666;
      }

      .option-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .select-card {
        padding: 20px;
        border: 2px solid #222;
        border-radius: 20px;
        cursor: pointer;
        background: #111;
        display: block;
        transition: 0.3s;
      }
      .select-card.active {
        border-color: #ff6600;
        background: rgba(255, 102, 0, 0.05);
      }
      .select-card input {
        display: none;
      }
      .card-title {
        display: block;
        font-weight: 900;
        font-size: 1.1rem;
        color: #fff;
      }
      .card-desc {
        color: #555;
        font-size: 0.8rem;
        font-weight: 600;
        margin-top: 4px;
        display: block;
      }

      .extra-config {
        margin-top: 30px;
        background: rgba(0, 0, 0, 0.2);
        padding: 20px;
        border-radius: 20px;
        border: 1px dashed #333;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      .field label {
        display: block;
        font-size: 0.7rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .stepper {
        display: flex;
        align-items: center;
        gap: 15px;
        background: #111;
        padding: 6px;
        border-radius: 10px;
        width: fit-content;
        border: 1px solid #222;
      }
      .stepper button {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        background: #222;
        color: white;
        cursor: pointer;
        font-weight: 900;
      }
      .stepper .val {
        font-weight: 900;
        font-size: 1.1rem;
        color: #ff6600;
        min-width: 35px;
        text-align: center;
      }
      .dark-input {
        background: #111;
        border: 1px solid #222;
        padding: 12px;
        border-radius: 10px;
        color: white;
        width: 100%;
        font-family: inherit;
        font-weight: 700;
      }

      .slots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 8px;
        margin-top: 10px;
      }
      .slot-btn {
        padding: 10px;
        background: #111;
        border: 1px solid #222;
        border-radius: 10px;
        color: #fff;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 700;
        transition: 0.2s;
      }
      .slot-btn.active {
        background: #ff6600;
        border-color: #ff6600;
      }

      .payment-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .payment-card {
        padding: 20px;
        border: 2px solid #222;
        border-radius: 20px;
        cursor: pointer;
        background: #111;
        display: block;
        transition: 0.3s;
      }
      .payment-card.active {
        border-color: #ff6600;
        background: rgba(255, 102, 0, 0.05);
      }
      .payment-card input {
        display: none;
      }
      .p-title {
        display: block;
        font-weight: 800;
        font-size: 1.1rem;
        color: #fff;
      }
      .p-desc {
        color: #555;
        font-size: 0.8rem;
        font-weight: 600;
        margin-top: 3px;
      }

      .submit-order-btn {
        width: 100%;
        padding: 22px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 18px;
        font-weight: 900;
        font-size: 1.2rem;
        cursor: pointer;
        margin-top: 10px;
        transition: 0.3s;
      }
      .submit-order-btn:disabled {
        opacity: 0.2;
        cursor: not-allowed;
      }

      .summary-box {
        padding: 35px;
        border-radius: 32px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .sticky-top {
        position: sticky;
        top: 100px;
      }
      .summary-box h3 {
        font-size: 1.3rem;
        font-weight: 900;
        margin-bottom: 25px;
        border-bottom: 1px solid #1a1a1a;
        padding-bottom: 15px;
        color: #fff;
      }
      .items-list-mini {
        max-height: 250px;
        overflow-y: auto;
        margin-bottom: 25px;
      }
      .mini-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        align-items: baseline;
      }
      .m-qty {
        color: #ff6600;
        font-weight: 900;
        margin-right: 10px;
      }
      .m-name {
        color: #fff;
        font-weight: 600;
        font-size: 0.95rem;
      }
      .m-price {
        color: #666;
        font-weight: 700;
        font-size: 0.85rem;
      }

      .totals-area {
        border-top: 1px solid #1a1a1a;
        padding-top: 25px;
      }
      .t-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .t-row span {
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
      }
      .t-val {
        font-size: 2.8rem !important;
        font-weight: 900 !important;
        color: #ff6600 !important;
        letter-spacing: -2px;
      }
      .tax-note {
        font-size: 0.65rem;
        color: #00ff88;
        font-weight: 800;
        text-transform: uppercase;
        margin-top: 8px;
        letter-spacing: 1px;
      }

      .pay-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(20px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .pay-dialog {
        padding: 50px;
        text-align: center;
        border-radius: 40px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 440px;
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #222;
        border-top-color: #ff6600;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 25px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .success-msg {
        color: #00ff88;
        font-weight: 900;
        font-size: 1.3rem;
        margin-top: 20px;
      }

      .glass-card {
        background: rgba(18, 18, 18, 0.7);
        backdrop-filter: blur(30px);
      }

      @media (max-width: 1000px) {
        .checkout-grid {
          grid-template-columns: 1fr;
        }
        .summary-side {
          order: -1;
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
    const next = this.numberOfPeople + change;
    if (next >= 1 && next <= 20) this.numberOfPeople = next;
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

  handleCheckout() {
    if (this.paymentMethod === 'ONLINE') {
      this.showPaymentModal = true;
      this.paymentStep = 'PROCESSING';
      setTimeout(() => {
        this.paymentStep = 'SUCCESS';
        setTimeout(() => {
          this.showPaymentModal = false;
          this.placeFinalOrder('PAID', 'KILLA-' + Date.now());
        }, 1500);
      }, 2000);
    } else {
      this.placeFinalOrder();
    }
  }

  placeFinalOrder(paymentStatus: string = 'PENDING', txId: string = '') {
    setTimeout(() => {
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
        totalAmount: this.cartService.totalPrice(),
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
          this.toast.success('Legendary order received!');
          this.cartService.clearCart();
          this.router.navigate(['/my-orders']);
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.msg || 'Failed to place order.');
          this.cdr.detectChanges();
        },
      });
    }, 0);
  }
}
