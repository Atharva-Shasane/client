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
      <div class="cart-header">
        <h1>Your <span class="highlight">Cart</span></h1>
        <p *ngIf="cartService.totalItems() > 0">
          You have {{ cartService.totalItems() }} items ready for legend.
        </p>
      </div>

      <div *ngIf="cartService.cartItems().length === 0" class="empty-state glass-card">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Hungry? Discover something delicious in our menu.</p>
        <button class="browse-btn" (click)="router.navigate(['/menu'])">Browse Menu</button>
      </div>

      <div *ngIf="cartService.cartItems().length > 0" class="cart-layout">
        <!-- Items List -->
        <div class="items-section">
          <div *ngFor="let item of cartService.cartItems()" class="item-card glass-card">
            <div class="item-media">
              <img [src]="item.imageUrl" alt="Food" />
            </div>

            <div class="item-details">
              <div class="item-main">
                <h3>{{ item.name }}</h3>
                <span class="category-tag">{{ item.category }}</span>
                <span class="variant-label" *ngIf="item.selectedVariant !== 'SINGLE'">
                  Variant: {{ item.selectedVariant }}
                </span>
              </div>

              <div class="item-price-info">
                <span class="unit-price">₹{{ item.computedPrice }}</span>
              </div>
            </div>

            <div class="item-controls">
              <div class="qty-selector">
                <button
                  (click)="cartService.updateQuantity(item._id, item.selectedVariant!, -1)"
                  class="qty-btn"
                >
                  -
                </button>
                <span class="qty-val">{{ item.quantity }}</span>
                <button
                  (click)="cartService.updateQuantity(item._id, item.selectedVariant!, 1)"
                  class="qty-btn"
                >
                  +
                </button>
              </div>
              <div class="item-total">₹{{ item.computedPrice * item.quantity }}</div>
              <button
                class="remove-icon"
                (click)="cartService.removeFromCart(item._id, item.selectedVariant!)"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="summary-card glass-card">
            <h3>Order Summary</h3>
            <div class="calc-row">
              <span>Subtotal</span>
              <span>₹{{ cartService.totalPrice() }}</span>
            </div>
            <div class="calc-row">
              <span>Taxes (Included)</span>
              <span>₹0</span>
            </div>
            <div class="divider"></div>
            <div class="calc-row total">
              <span>Total Payable</span>
              <span class="grand-total">₹{{ cartService.totalPrice() }}</span>
            </div>

            <div class="action-zone">
              <button
                *ngIf="authService.isLoggedIn()"
                (click)="proceedToCheckout()"
                class="btn-checkout"
              >
                Proceed to Checkout
              </button>

              <button
                *ngIf="!authService.isLoggedIn()"
                (click)="router.navigate(['/login'])"
                class="btn-login-prompt"
              >
                Login to Checkout
              </button>

              <p class="secure-note">🔒 Secured Checkout by Killa-Pay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cart-container {
        max-width: 1200px;
        margin: 4rem auto;
        padding: 0 20px;
        font-family: 'Poppins', sans-serif;
      }
      .cart-header {
        margin-bottom: 3rem;
        text-align: left;
      }
      .cart-header h1 {
        font-size: 2.8rem;
        font-weight: 800;
        margin: 0;
      }
      .highlight {
        color: #ff6600;
      }
      .cart-header p {
        color: #666;
        margin-top: 5px;
      }

      .cart-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 2.5rem;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 5rem;
        border-radius: 24px;
      }
      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .browse-btn {
        background: #ff6600;
        color: white;
        border: none;
        padding: 14px 40px;
        border-radius: 50px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 1.5rem;
        transition: 0.3s;
      }

      /* Item Cards */
      .items-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .item-card {
        display: grid;
        grid-template-columns: 100px 1fr auto;
        padding: 1.5rem;
        align-items: center;
        gap: 1.5rem;
      }
      .item-media img {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 15px;
      }
      .item-main h3 {
        margin: 0;
        font-size: 1.2rem;
      }
      .category-tag {
        font-size: 0.75rem;
        color: #ff6600;
        font-weight: 700;
        text-transform: uppercase;
      }
      .variant-label {
        display: block;
        font-size: 0.8rem;
        color: #888;
        margin-top: 4px;
      }
      .unit-price {
        font-weight: 700;
        color: #333;
      }

      /* Controls */
      .item-controls {
        display: flex;
        align-items: center;
        gap: 2rem;
      }
      .qty-selector {
        display: flex;
        align-items: center;
        background: #f0f0f0;
        padding: 5px;
        border-radius: 12px;
      }
      .qty-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: white;
        border-radius: 8px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      }
      .qty-val {
        padding: 0 15px;
        font-weight: 800;
        min-width: 40px;
        text-align: center;
      }
      .item-total {
        font-weight: 800;
        font-size: 1.1rem;
        min-width: 80px;
        text-align: right;
      }
      .remove-icon {
        background: none;
        border: none;
        color: #ff4444;
        font-size: 1.8rem;
        cursor: pointer;
      }

      /* Summary */
      .summary-card {
        padding: 2.5rem;
        position: sticky;
        top: 100px;
      }
      .summary-card h3 {
        margin-top: 0;
        margin-bottom: 2rem;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
      }
      .calc-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        color: #666;
        font-weight: 500;
      }
      .divider {
        height: 1px;
        background: #eee;
        margin: 1.5rem 0;
      }
      .calc-row.total {
        color: #1a1a1a;
      }
      .grand-total {
        font-size: 1.8rem;
        font-weight: 800;
        color: #ff6600;
      }

      .action-zone {
        margin-top: 2rem;
      }
      .btn-checkout {
        width: 100%;
        padding: 18px;
        background: #1a1a1a;
        color: white;
        border: none;
        border-radius: 15px;
        font-weight: 800;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-checkout:hover {
        background: #ff6600;
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(255, 107, 0, 0.3);
      }
      .btn-login-prompt {
        width: 100%;
        padding: 18px;
        background: #333;
        color: white;
        border: none;
        border-radius: 15px;
        font-weight: 700;
        cursor: pointer;
      }
      .secure-note {
        font-size: 0.75rem;
        color: #27ae60;
        text-align: center;
        margin-top: 15px;
        font-weight: 600;
      }

      @media (max-width: 900px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }
        .item-card {
          grid-template-columns: 80px 1fr;
          position: relative;
        }
        .item-controls {
          grid-column: 1 / span 2;
          justify-content: space-between;
          border-top: 1px solid #eee;
          padding-top: 1rem;
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
