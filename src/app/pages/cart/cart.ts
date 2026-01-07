import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
// OrderService no longer needed here, moved to checkout
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cart-container">
      <h2>Your Cart</h2>

      <div *ngIf="cartService.cartItems().length === 0" class="empty-state">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty. Hungry?</p>
        <button (click)="router.navigate(['/menu'])">Browse Menu</button>
      </div>

      <div *ngIf="cartService.cartItems().length > 0" class="content">
        <!-- List of Items -->
        <div class="items-list">
          <div *ngFor="let item of cartService.cartItems()" class="cart-item">
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <span class="variant-badge" *ngIf="item.selectedVariant !== 'SINGLE'">
                {{ item.selectedVariant }}
              </span>
            </div>

            <div class="item-actions">
              <span class="price-calc">₹{{ item.computedPrice }} x {{ item.quantity }}</span>
              <strong class="total-item">₹{{ item.computedPrice * item.quantity }}</strong>
              <button
                class="remove-btn"
                (click)="cartService.removeFromCart(item._id, item.selectedVariant!)"
                title="Remove"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <!-- Summary & Checkout -->
        <div class="summary-card">
          <h3>Order Summary</h3>

          <div class="summary-row">
            <span>Subtotal</span>
            <span>₹{{ cartService.totalPrice() }}</span>
          </div>

          <div class="summary-row total">
            <span>Total Payable</span>
            <span>₹{{ cartService.totalPrice() }}</span>
          </div>

          <div class="checkout-actions">
            <!-- ✅ Changed Logic: Go to Checkout Page -->
            <button
              *ngIf="authService.isLoggedIn()"
              (click)="proceedToCheckout()"
              class="checkout-btn"
            >
              Proceed to Checkout
            </button>

            <button
              *ngIf="!authService.isLoggedIn()"
              (click)="router.navigate(['/login'])"
              class="login-btn"
            >
              Login to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cart-container {
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

      .empty-state {
        text-align: center;
        padding: 4rem;
        background: #f9f9f9;
        border-radius: 10px;
        margin-top: 2rem;
      }
      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .empty-state p {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 1.5rem;
      }
      .empty-state button {
        background: #ff6b00;
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: bold;
      }

      .content {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 2rem;
      }

      .cart-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
        background: white;
      }

      .item-info h3 {
        margin: 0 0 5px 0;
        font-size: 1.1rem;
      }
      .variant-badge {
        font-size: 0.75rem;
        background: #eee;
        padding: 2px 8px;
        border-radius: 4px;
        color: #555;
        font-weight: 500;
      }

      .item-actions {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      .price-calc {
        color: #666;
        font-size: 0.9rem;
      }
      .total-item {
        font-size: 1.1rem;
        color: #333;
      }

      .remove-btn {
        background: none;
        border: none;
        font-size: 1.8rem;
        color: #ff4444;
        cursor: pointer;
        line-height: 1;
        padding: 0;
      }
      .remove-btn:hover {
        color: #cc0000;
      }

      .summary-card {
        background: #f9f9f9;
        padding: 2rem;
        border-radius: 12px;
        height: fit-content;
        position: sticky;
        top: 100px;
      }
      .summary-card h3 {
        margin-top: 0;
        border-bottom: 1px solid #ddd;
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        color: #555;
      }
      .summary-row.total {
        font-weight: 800;
        font-size: 1.3rem;
        color: #000;
        border-top: 2px solid #ddd;
        padding-top: 1rem;
        margin-top: 1rem;
      }

      .checkout-actions {
        margin-top: 2rem;
      }
      .checkout-btn {
        width: 100%;
        padding: 14px;
        background: #00c851;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1.1rem;
        transition: 0.3s;
      }
      .checkout-btn:hover {
        background: #007e33;
      }

      .login-btn {
        width: 100%;
        padding: 14px;
        background: #333;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
      }
      .login-btn:hover {
        background: #000;
      }

      @media (max-width: 768px) {
        .content {
          grid-template-columns: 1fr;
        }
        .cart-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
        .item-actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class CartComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  router = inject(Router);

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
