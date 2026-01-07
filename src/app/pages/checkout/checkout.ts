import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checkout-container">
      <h2>Checkout</h2>

      <div class="grid-layout">
        <!-- LEFT: Order Details Form -->
        <div class="form-section">
          <h3>Order Details</h3>

          <form (ngSubmit)="placeOrder()">
            <!-- Order Type -->
            <div class="form-group">
              <label>Order Type</label>
              <div class="radio-group">
                <label [class.selected]="orderType === 'DINE_IN'">
                  <input type="radio" name="orderType" [(ngModel)]="orderType" value="DINE_IN" />
                  🍽️ Dine In
                </label>
                <label [class.selected]="orderType === 'TAKEAWAY'">
                  <input type="radio" name="orderType" [(ngModel)]="orderType" value="TAKEAWAY" />
                  🛍️ Takeaway
                </label>
              </div>
            </div>

            <!-- Dine-In Specifics -->
            <div *ngIf="orderType === 'DINE_IN'" class="dine-in-section">
              <div class="form-group">
                <label>Number of People</label>
                <input
                  type="number"
                  name="people"
                  [(ngModel)]="numberOfPeople"
                  min="1"
                  max="20"
                  required
                />
              </div>

              <div class="form-group">
                <label>Arrival Time</label>
                <!-- Helper text explaining default -->
                <div class="time-helper">
                  <span>Default is NOW. Click to change.</span>
                </div>
                <input
                  type="datetime-local"
                  name="scheduledTime"
                  [(ngModel)]="scheduledTime"
                  [min]="minTime"
                  required
                />
                <small class="hint">Slots fill up fast! Max 25 people per hour session.</small>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="form-group">
              <label>Payment Method</label>
              <div class="radio-group">
                <label [class.selected]="paymentMethod === 'CASH'">
                  <input
                    type="radio"
                    name="paymentMethod"
                    [(ngModel)]="paymentMethod"
                    value="CASH"
                  />
                  💵 Cash
                </label>
                <label [class.selected]="paymentMethod === 'ONLINE'">
                  <input
                    type="radio"
                    name="paymentMethod"
                    [(ngModel)]="paymentMethod"
                    value="ONLINE"
                  />
                  💳 Online (Sandbox)
                </label>
              </div>
            </div>

            <button
              type="submit"
              class="place-btn"
              [disabled]="loading || cartService.totalItems() === 0"
            >
              {{ loading ? 'Processing...' : 'Confirm & Place Order' }}
            </button>
          </form>
        </div>

        <!-- RIGHT: Order Summary -->
        <div class="summary-section">
          <h3>Order Summary</h3>
          <div *ngFor="let item of cartService.cartItems()" class="item-row">
            <span>{{ item.quantity }}x {{ item.name }}</span>
            <span>₹{{ item.computedPrice * item.quantity }}</span>
          </div>
          <div class="divider"></div>
          <div class="total-row">
            <span>Total Payable</span>
            <span>₹{{ cartService.totalPrice() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .checkout-container {
        max-width: 900px;
        margin: 3rem auto;
        padding: 0 20px;
      }
      h2 {
        border-bottom: 3px solid #ff6b00;
        display: inline-block;
        padding-bottom: 5px;
        margin-bottom: 2rem;
      }

      .grid-layout {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 2rem;
      }

      .form-section,
      .summary-section {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
      h3 {
        margin-top: 0;
        color: #333;
        margin-bottom: 1.5rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }
      label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: #555;
      }
      input[type='number'],
      input[type='datetime-local'] {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-sizing: border-box;
      }
      .hint {
        color: #888;
        font-size: 0.8rem;
        margin-top: 5px;
        display: block;
      }
      .time-helper {
        margin-bottom: 5px;
        font-size: 0.85rem;
        color: #00c851;
        font-weight: bold;
      }

      .dine-in-section {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        border: 1px dashed #ccc;
        margin-bottom: 1.5rem;
      }

      .radio-group {
        display: flex;
        gap: 10px;
      }
      .radio-group label {
        flex: 1;
        border: 1px solid #ddd;
        padding: 10px;
        text-align: center;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.2s;
      }
      .radio-group input {
        display: none;
      }
      .radio-group label.selected {
        background: #ff6b00;
        color: white;
        border-color: #ff6b00;
      }

      .place-btn {
        width: 100%;
        padding: 15px;
        background: #00c851;
        color: white;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .place-btn:hover:not(:disabled) {
        background: #007e33;
      }
      .place-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .item-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        color: #666;
        font-size: 0.95rem;
      }
      .divider {
        border-top: 1px dashed #ddd;
        margin: 1rem 0;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        font-size: 1.2rem;
        color: #000;
      }

      @media (max-width: 768px) {
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

  orderType = 'DINE_IN';
  numberOfPeople = 2;
  paymentMethod = 'CASH';
  scheduledTime = ''; // Will hold the ISO string for the input
  loading = false;

  ngOnInit() {
    this.setDefaultTime();
  }

  // ✅ Set default time to NOW (local time string formatted for input)
  setDefaultTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for timezone
    this.scheduledTime = now.toISOString().slice(0, 16);
  }

  get minTime() {
    // Prevent selecting past times
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  placeOrder() {
    // Validation
    if (this.orderType === 'DINE_IN' && !this.scheduledTime) {
      alert('Please select an Arrival Time for Dine-in.');
      return;
    }

    this.loading = true;
    const delay = this.paymentMethod === 'ONLINE' ? 2000 : 500;

    setTimeout(() => {
      this.submitToBackend();
    }, delay);
  }

  submitToBackend() {
    const order = {
      orderType: this.orderType,
      numberOfPeople: this.orderType === 'DINE_IN' ? this.numberOfPeople : 0,
      scheduledTime: this.orderType === 'DINE_IN' ? this.scheduledTime : null,
      paymentMethod: this.paymentMethod,
      totalAmount: this.cartService.totalPrice(),
      items: this.cartService.cartItems().map((i) => ({
        menuItemId: i._id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.computedPrice,
      })),
    };

    this.orderService.createOrder(order).subscribe({
      next: () => {
        alert(
          this.paymentMethod === 'ONLINE'
            ? 'Payment Successful! Order Placed.'
            : 'Order Placed Successfully!'
        );
        this.cartService.clearCart();
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        console.error(err);
        const msg = err.error?.msg || 'Order Failed';
        alert(`❌ ${msg}`);
        this.loading = false;
      },
    });
  }
}
