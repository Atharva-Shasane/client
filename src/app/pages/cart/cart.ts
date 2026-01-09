import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
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
        border-bottom: 3px solid #ff6600;
        display: inline-block;
        padding-bottom: 5px;
        margin-bottom: 2rem;
      }
      .empty-state {
        text-align: center;
        padding: 4rem;
        background: #f9f9f9;
        border-radius: 10px;
      }
      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .content {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 2rem;
      }
      .cart-item {
        display: flex;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
        background: white;
      }
      .variant-badge {
        font-size: 0.75rem;
        background: #eee;
        padding: 2px 8px;
        border-radius: 4px;
        color: #555;
      }
      .item-actions {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      .remove-btn {
        background: none;
        border: none;
        font-size: 1.8rem;
        color: #ff4444;
        cursor: pointer;
      }
      .summary-card {
        background: #f9f9f9;
        padding: 2rem;
        border-radius: 12px;
        height: fit-content;
        position: sticky;
        top: 100px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .summary-row.total {
        font-weight: 800;
        font-size: 1.3rem;
        border-top: 2px solid #ddd;
        padding-top: 1rem;
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
      }
      @media (max-width: 768px) {
        .content {
          grid-template-columns: 1fr;
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
