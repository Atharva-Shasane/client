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
    <div class="cart-wrapper fade-in">
      <div class="container">
        <header class="cart-header">
          <h1>Your <span class="highlight">Cravings</span></h1>
          <p *ngIf="cartService.totalItems() > 0">
            You have selected {{ cartService.totalItems() }} legendary items.
          </p>
        </header>

        <div *ngIf="cartService.cartItems().length === 0" class="empty-state glass-card">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Hungry? Discover something delicious in our collection.</p>
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
                  <div class="meta-tags">
                    <span class="category-tag">{{ item.category }}</span>
                    <span class="variant-tag" *ngIf="item.selectedVariant !== 'SINGLE'">
                      {{ item.selectedVariant }}
                    </span>
                  </div>
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
                  title="Remove Item"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div class="summary-section">
            <div class="summary-card glass-card sticky-top">
              <h3>Order Summary</h3>
              <div class="calc-row">
                <span>Subtotal</span>
                <span>₹{{ cartService.totalPrice() }}</span>
              </div>
              <div class="calc-row">
                <span>Taxes & Fees</span>
                <span class="free">FREE</span>
              </div>
              <div class="divider"></div>
              <div class="calc-row total">
                <span>Total Amount</span>
                <span class="grand-total">₹{{ cartService.totalPrice() }}</span>
              </div>

              <div class="action-zone">
                <button
                  *ngIf="authService.isLoggedIn()"
                  (click)="router.navigate(['/checkout'])"
                  class="btn-checkout"
                >
                  Proceed to Checkout
                </button>

                <button
                  *ngIf="!authService.isLoggedIn()"
                  (click)="router.navigate(['/login'])"
                  class="btn-login-prompt"
                >
                  Login to Place Order
                </button>

                <p class="secure-note">🛡️ Secure checkout powered by KillaPay</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cart-wrapper {
        padding: 120px 0 80px;
        min-height: 100vh;
        background: #0a0a0a;
        color: white;
        font-family: 'Poppins', sans-serif;
      }
      .cart-header {
        margin-bottom: 40px;
      }
      .cart-header h1 {
        font-size: 3rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -1.5px;
      }
      .highlight {
        color: #ff6600;
      }
      .cart-header p {
        color: #666;
        font-size: 1.1rem;
        margin-top: 5px;
      }

      .cart-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 40px;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 100px 40px;
        border-radius: 32px;
      }
      .empty-icon {
        font-size: 5rem;
        margin-bottom: 20px;
        filter: grayscale(1);
        opacity: 0.3;
      }
      .browse-btn {
        background: #ff6600;
        color: white;
        border: none;
        padding: 16px 45px;
        border-radius: 50px;
        font-weight: 800;
        cursor: pointer;
        margin-top: 30px;
        transition: 0.3s;
      }
      .browse-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(255, 107, 0, 0.3);
      }

      /* Item Cards */
      .items-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .item-card {
        display: grid;
        grid-template-columns: 120px 1fr auto;
        padding: 25px;
        align-items: center;
        gap: 25px;
        border-radius: 28px;
      }
      .item-media img {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 20px;
      }
      .item-main h3 {
        margin: 0 0 10px;
        font-size: 1.4rem;
        font-weight: 800;
      }
      .meta-tags {
        display: flex;
        gap: 10px;
      }
      .category-tag {
        font-size: 0.7rem;
        color: #ff6600;
        font-weight: 800;
        text-transform: uppercase;
        background: rgba(255, 102, 0, 0.1);
        padding: 4px 10px;
        border-radius: 6px;
      }
      .variant-tag {
        font-size: 0.7rem;
        color: #aaa;
        font-weight: 800;
        text-transform: uppercase;
        background: #222;
        padding: 4px 10px;
        border-radius: 6px;
      }
      .unit-price {
        font-weight: 800;
        color: #888;
        font-size: 1.1rem;
      }

      /* Controls */
      .item-controls {
        display: flex;
        align-items: center;
        gap: 30px;
      }
      .qty-selector {
        display: flex;
        align-items: center;
        background: #222;
        padding: 6px;
        border-radius: 14px;
        border: 1px solid #333;
      }
      .qty-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: #333;
        color: white;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .qty-btn:hover {
        background: #ff6600;
      }
      .qty-val {
        padding: 0 18px;
        font-weight: 800;
        min-width: 45px;
        text-align: center;
        font-size: 1.1rem;
      }
      .item-total {
        font-weight: 900;
        font-size: 1.4rem;
        color: #ff6600;
        min-width: 100px;
        text-align: right;
      }
      .remove-icon {
        background: none;
        border: none;
        color: #ff4444;
        font-size: 2.2rem;
        cursor: pointer;
        transition: 0.2s;
        padding: 0 10px;
        opacity: 0.5;
      }
      .remove-icon:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      /* Summary */
      .summary-card {
        padding: 40px;
        border-radius: 32px;
        border: 1px solid #222;
      }
      .sticky-top {
        position: sticky;
        top: 120px;
      }
      .summary-card h3 {
        margin-top: 0;
        margin-bottom: 30px;
        border-bottom: 1px solid #222;
        padding-bottom: 15px;
        font-weight: 800;
        letter-spacing: -0.5px;
      }
      .calc-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        color: #888;
        font-weight: 600;
      }
      .calc-row .free {
        color: #2ecc71;
      }
      .divider {
        height: 1px;
        background: #222;
        margin: 25px 0;
      }
      .calc-row.total {
        color: white;
      }
      .grand-total {
        font-size: 2.2rem;
        font-weight: 900;
        color: #ff6600;
      }

      .action-zone {
        margin-top: 40px;
      }
      .btn-checkout {
        width: 100%;
        padding: 20px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 18px;
        font-weight: 900;
        font-size: 1.2rem;
        cursor: pointer;
        transition: 0.3s;
        box-shadow: 0 8px 25px rgba(255, 107, 0, 0.3);
      }
      .btn-checkout:hover {
        transform: translateY(-5px);
        filter: brightness(1.1);
        box-shadow: 0 12px 35px rgba(255, 107, 0, 0.5);
      }
      .btn-login-prompt {
        width: 100%;
        padding: 20px;
        background: #222;
        color: white;
        border: none;
        border-radius: 18px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.3s;
      }
      .secure-note {
        font-size: 0.75rem;
        color: #555;
        text-align: center;
        margin-top: 20px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      @media (max-width: 1100px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }
        .summary-section {
          order: -1;
        }
        .summary-card {
          position: static;
          margin-bottom: 30px;
        }
      }
      @media (max-width: 768px) {
        .item-card {
          grid-template-columns: 80px 1fr;
          padding: 20px;
        }
        .item-media img {
          width: 80px;
          height: 80px;
        }
        .item-controls {
          grid-column: 1 / span 2;
          justify-content: space-between;
          margin-top: 15px;
          border-top: 1px solid #222;
          padding-top: 15px;
        }
      }
    `,
  ],
})
export class CartComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  router = inject(Router);
}
