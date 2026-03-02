import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';

interface CheckoutCartItem {
  _id?: string;
  name: string;
  quantity: number;
  selectedVariant: string;
  computedPrice: number;
  instructions?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checkout-wrapper fade-in">
      <div class="container">
        <!-- STEPS - RESPONSIVE MOBILE ADAPTIVE -->
        <div class="checkout-hud glass-card">
          <div class="stepper">
            <div
              class="step"
              [class.active]="currentStep() >= 1"
              [class.complete]="currentStep() > 1"
            >
              <span class="num">{{ currentStep() > 1 ? '✓' : '1' }}</span>
              <span class="lbl">Style</span>
            </div>
            <div class="connector"></div>
            <div
              class="step"
              [class.active]="currentStep() >= 2"
              [class.complete]="currentStep() > 2"
            >
              <span class="num">{{ currentStep() > 2 ? '✓' : '2' }}</span>
              <span class="lbl">Details</span>
            </div>
            <div class="connector"></div>
            <div class="step" [class.active]="currentStep() >= 3">
              <span class="num">3</span>
              <span class="lbl">Pay</span>
            </div>
          </div>
        </div>

        <div class="checkout-main-grid">
          <div class="flow-container">
            <!-- STEP 1: Preference -->
            <div class="step-card glass-card animate-slide-up" *ngIf="currentStep() === 1">
              <h2>Dining Preference</h2>
              <div class="choice-grid">
                <button
                  class="choice-box"
                  [class.selected]="orderType === 'DINE_IN'"
                  (click)="orderType = 'DINE_IN'"
                >
                  <span class="icon">🍽️</span>
                  <h3>Dine In</h3>
                  <p>Experience the legendary ambiance.</p>
                </button>
                <button
                  class="choice-box"
                  [class.selected]="orderType === 'TAKEAWAY'"
                  (click)="orderType = 'TAKEAWAY'"
                >
                  <span class="icon">🥡</span>
                  <h3>Takeaway</h3>
                  <p>Perfectly packed for the road.</p>
                </button>
              </div>
              <button class="btn-next" (click)="goToStep(2)">Next: Location Details</button>
            </div>

            <!-- STEP 2: Location/Table -->
            <div class="step-card glass-card animate-slide-up" *ngIf="currentStep() === 2">
              <div class="header-inline">
                <button class="back-link" (click)="goToStep(1)">← Change Style</button>
                <h2>{{ orderType === 'DINE_IN' ? 'Table Selection' : 'Pickup Slot' }}</h2>
              </div>

              <div *ngIf="orderType === 'DINE_IN'" class="table-map">
                <p class="section-hint">Select a table from our visual layout:</p>
                <div class="table-grid-responsive">
                  <button
                    *ngFor="let t of tables"
                    class="t-btn"
                    [class.sel]="selectedTable === t"
                    (click)="selectedTable = t"
                  >
                    T{{ t }}
                  </button>
                </div>
              </div>

              <div class="form-row">
                <div class="input-grp">
                  <label>Guests</label>
                  <div class="counter-input">
                    <button (click)="updateGuests(-1)">-</button>
                    <span>{{ numberOfPeople }}</span>
                    <button (click)="updateGuests(1)">+</button>
                  </div>
                </div>
                <div class="input-grp">
                  <label>Arrival Slot</label>
                  <select [(ngModel)]="selectedSlot" class="killa-select">
                    <option *ngFor="let s of availableSlots" [value]="s">{{ s }}</option>
                  </select>
                </div>
              </div>

              <div class="status-box">
                <div class="timer">
                  ⏲️ Wait Time: <span>{{ estimatedWaitTime() }}m</span>
                </div>
                <p>Kitchen is currently managing {{ activeOrderCount() }} legendary feasts.</p>
              </div>

              <button
                class="btn-next"
                [disabled]="orderType === 'DINE_IN' && !selectedTable"
                (click)="goToStep(3)"
              >
                Next: Payment Method
              </button>
            </div>

            <!-- STEP 3: Payment -->
            <div class="step-card glass-card animate-slide-up" *ngIf="currentStep() === 3">
              <button class="back-link" (click)="goToStep(2)">← Change Details</button>
              <h2>Secure Payment</h2>
              <div class="pay-options">
                <button
                  class="pay-box"
                  [class.sel]="paymentMethod === 'CASH'"
                  (click)="paymentMethod = 'CASH'"
                >
                  <span class="p-title">Pay at Killa Counter</span>
                  <span class="p-sub">Cash or UPI accepted on arrival</span>
                </button>
                <button
                  class="pay-box"
                  [class.sel]="paymentMethod === 'ONLINE'"
                  (click)="paymentMethod = 'ONLINE'"
                >
                  <span class="p-title">Instant KillaPay</span>
                  <span class="p-sub">Secure checkout with Credit/Debit/UPI</span>
                </button>
              </div>

              <div class="final-checkout">
                <div class="total-summary-mobile">
                  <span>Total Amount:</span>
                  <span class="total">₹ {{ cartService.totalPrice() }}</span>
                </div>
                <button
                  class="btn-final-order"
                  [disabled]="loading || activeOrderCount() > 20"
                  (click)="handleCheckout()"
                >
                  {{ loading ? 'Securing Order...' : 'Confirm legendary order' }}
                </button>
              </div>
            </div>
          </div>

          <!-- SIDEBAR RECEIPT -->
          <aside class="checkout-sidebar">
            <div class="receipt glass-card">
              <h3>Receipt</h3>
              <div class="items-scroller">
                <div *ngFor="let item of getCheckoutItems()" class="receipt-item">
                  <div class="r-text">
                    <span class="r-qty">{{ item.quantity }}x</span>
                    <span class="r-name">{{ item.name }}</span>
                    <span class="r-instr" *ngIf="item.instructions">"{{ item.instructions }}"</span>
                  </div>
                  <span class="r-price">₹ {{ item.computedPrice * item.quantity }}</span>
                </div>
              </div>
              <div class="receipt-total">
                <div class="line">
                  <span>Net Payable</span><span>₹ {{ cartService.totalPrice() }}</span>
                </div>
                <p class="tax-info">Price inclusive of all taxes & kitchen fees.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <!-- KillaPay Overlay -->
      <div class="killa-pay-modal" *ngIf="showPaymentModal">
        <div class="pay-card glass-card animate-pop">
          <div class="killa-loader"></div>
          <h2>KillaPay Gateway</h2>
          <p>Authorizing transaction secure tunnel...</p>
          <div class="success-check" *ngIf="paymentStep === 'SUCCESS'">✓ Payment Confirmed</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .checkout-wrapper {
        padding: 120px 0 80px;
        min-height: 100vh;
        background: #050505;
        color: white;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }

      .checkout-hud {
        padding: 25px;
        border-radius: 30px;
        margin-bottom: 40px;
      }
      .stepper {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        opacity: 0.3;
        transition: 0.4s;
      }
      .step.active {
        opacity: 1;
      }
      .step.complete .num {
        background: #00ff88;
        border-color: #00ff88;
        color: #000;
      }
      .num {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 0.8rem;
      }
      .lbl {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .connector {
        height: 2px;
        width: 60px;
        background: rgba(255, 255, 255, 0.1);
        margin-bottom: 25px;
      }

      .checkout-main-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 30px;
      }

      .step-card {
        padding: 40px;
        border-radius: 35px;
      }
      .step-card h2 {
        font-size: 2rem;
        font-weight: 900;
        margin-bottom: 30px;
        letter-spacing: -1px;
      }

      .choice-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 30px;
      }
      .choice-box {
        background: #111;
        border: 2px solid #222;
        padding: 30px;
        border-radius: 25px;
        cursor: pointer;
        color: white;
        transition: 0.3s;
        text-align: left;
      }
      .choice-box.selected {
        border-color: #ff6600;
        background: rgba(255, 102, 0, 0.05);
        box-shadow: 0 0 20px rgba(255, 102, 0, 0.2);
      }
      .choice-box .icon {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 15px;
      }
      .choice-box h3 {
        margin-bottom: 5px;
        font-weight: 800;
      }
      .choice-box p {
        color: #666;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .table-grid-responsive {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
        gap: 10px;
        margin-top: 15px;
      }
      .t-btn {
        aspect-ratio: 1;
        background: #111;
        border: 1px solid #222;
        border-radius: 12px;
        color: white;
        font-weight: 900;
        cursor: pointer;
        transition: 0.2s;
      }
      .t-btn.sel {
        background: #ff6600;
        border-color: #ff6600;
        box-shadow: 0 0 15px rgba(255, 102, 0, 0.4);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 30px 0;
      }
      .input-grp label {
        display: block;
        font-size: 0.7rem;
        font-weight: 900;
        color: #555;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .counter-input {
        display: flex;
        align-items: center;
        gap: 15px;
        background: #000;
        border: 1px solid #222;
        border-radius: 12px;
        padding: 8px;
        width: fit-content;
      }
      .counter-input button {
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 6px;
        background: #222;
        color: white;
        cursor: pointer;
        font-weight: 900;
      }
      .counter-input span {
        font-weight: 900;
        font-size: 1.1rem;
        min-width: 30px;
        text-align: center;
      }
      .killa-select {
        width: 100%;
        background: #000;
        border: 1px solid #222;
        border-radius: 12px;
        padding: 12px;
        color: white;
        font-weight: 700;
      }

      .status-box {
        background: rgba(255, 102, 0, 0.05);
        border: 1px solid rgba(255, 102, 0, 0.1);
        padding: 20px;
        border-radius: 20px;
        margin-bottom: 30px;
      }
      .timer {
        font-size: 1.2rem;
        font-weight: 900;
        margin-bottom: 5px;
      }
      .timer span {
        color: #ff6600;
      }
      .status-box p {
        font-size: 0.8rem;
        color: #666;
      }

      .btn-next,
      .btn-final-order {
        width: 100%;
        padding: 20px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 20px;
        font-weight: 900;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-next:disabled,
      .btn-final-order:disabled {
        opacity: 0.2;
        cursor: not-allowed;
      }

      .pay-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 30px;
      }
      .pay-box {
        background: #000;
        border: 2px solid #222;
        padding: 25px;
        border-radius: 20px;
        text-align: left;
        cursor: pointer;
        color: white;
        transition: 0.3s;
      }
      .pay-box.sel {
        border-color: #ff6600;
        background: rgba(255, 102, 0, 0.05);
      }
      .p-title {
        display: block;
        font-weight: 800;
        font-size: 1.1rem;
      }
      .p-sub {
        font-size: 0.8rem;
        color: #555;
      }

      .receipt {
        padding: 30px;
        border-radius: 30px;
      }
      .items-scroller {
        max-height: 250px;
        overflow-y: auto;
        margin: 20px 0;
        padding-right: 10px;
      }
      .receipt-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        border-bottom: 1px solid #222;
        padding-bottom: 10px;
      }
      .r-text {
        display: flex;
        flex-direction: column;
      }
      .r-qty {
        color: #ff6600;
        font-weight: 900;
        font-size: 0.8rem;
      }
      .r-name {
        font-weight: 700;
        font-size: 0.9rem;
      }
      .r-instr {
        font-size: 0.75rem;
        font-style: italic;
        color: #555;
      }
      .receipt-total {
        border-top: 2px dashed #333;
        padding-top: 20px;
      }
      .receipt-total .line {
        display: flex;
        justify-content: space-between;
        font-weight: 900;
        font-size: 1.2rem;
        color: #ff6600;
      }
      .tax-info {
        font-size: 0.65rem;
        color: #444;
        margin-top: 10px;
      }

      .killa-pay-modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(15px);
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .pay-card {
        padding: 60px;
        text-align: center;
        border-radius: 40px;
        max-width: 400px;
        width: 100%;
      }
      .killa-loader {
        width: 50px;
        height: 50px;
        border: 5px solid #222;
        border-top-color: #ff6600;
        border-radius: 50%;
        animation: k-spin 1s linear infinite;
        margin: 0 auto 30px;
      }
      @keyframes k-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .success-check {
        color: #00ff88;
        font-weight: 900;
        font-size: 1.4rem;
        margin-top: 25px;
      }

      .glass-card {
        background: rgba(20, 20, 20, 0.7);
        backdrop-filter: blur(30px);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      @media (max-width: 900px) {
        .checkout-main-grid {
          grid-template-columns: 1fr;
        }
        .checkout-sidebar {
          order: -1;
        }
        .choice-grid {
          grid-template-columns: 1fr;
        }
        .stepper {
          gap: 10px;
        }
        .connector {
          width: 30px;
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

  currentStep = signal(1);
  orderType: 'DINE_IN' | 'TAKEAWAY' = 'DINE_IN';
  paymentMethod: 'CASH' | 'ONLINE' = 'CASH';
  numberOfPeople = 2;
  selectedSlot = '';
  selectedTable: number | null = null;
  availableSlots: string[] = [];
  tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  loading = false;
  showPaymentModal = false;
  paymentStep: 'PROCESSING' | 'SUCCESS' = 'PROCESSING';

  activeOrderCount = signal(0);
  estimatedWaitTime = computed(() => 15 + this.activeOrderCount() * 3);

  ngOnInit() {
    this.generateTimeSlots();
    this.selectedSlot = this.availableSlots[0];
    this.fetchActiveOrderVolume();
    setInterval(() => this.fetchActiveOrderVolume(), 60000);
  }

  getCheckoutItems(): CheckoutCartItem[] {
    return this.cartService.cartItems() as unknown as CheckoutCartItem[];
  }

  fetchActiveOrderVolume() {
    this.orderService.getKitchenStatus().subscribe({
      next: (status) => {
        this.activeOrderCount.set(status.activeOrders);
        this.cdr.detectChanges();
      },
      error: () => console.warn('Sync issues'),
    });
  }

  goToStep(step: number) {
    this.currentStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      slots.push(`${displayH}:00 ${suffix}`);
      slots.push(`${displayH}:30 ${suffix}`);
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
    this.loading = true;
    this.cdr.detectChanges();

    const orderData = {
      orderType: this.orderType,
      numberOfPeople: this.numberOfPeople,
      tableNumber: this.selectedTable,
      scheduledTime: `${new Date().toLocaleDateString()} ${this.selectedSlot}`,
      paymentMethod: this.paymentMethod,
      paymentStatus: paymentStatus,
      transactionId: txId,
      totalAmount: this.cartService.totalPrice(),
      items: this.getCheckoutItems().map((i) => ({
        menuItemId: i._id,
        name: i.name,
        quantity: i.quantity,
        variant: i.selectedVariant,
        unitPrice: i.computedPrice,
        instructions: i.instructions || '',
      })),
    };

    this.orderService.createOrder(orderData).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Order Received!');
        this.cartService.clearCart();
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.msg || 'Error placing order.');
        this.cdr.detectChanges();
      },
    });
  }
}
