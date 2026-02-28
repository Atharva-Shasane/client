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
          <span class="badge">Your Selection</span>
          <h1>Your <span class="highlight">Cravings</span></h1>
          <p *ngIf="cartService.totalItems() > 0" class="sub-text">
            You have curated {{ cartService.totalItems() }} legendary items.
          </p>
        </header>

        <!-- Empty State -->
        <div *ngIf="cartService.cartItems().length === 0" class="empty-state glass-card">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Hungry? Discover something delicious in our collection.</p>
          <button class="browse-btn" (click)="router.navigate(['/menu'])">Explore Menu</button>
        </div>

        <!-- Cart Items -->
        <div *ngIf="cartService.cartItems().length > 0" class="cart-layout">
          <div class="items-section">
            <div *ngFor="let item of cartService.cartItems()" class="item-card glass-card">
              <div class="item-media">
                <img [src]="item.imageUrl" [alt]="item.name" />
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
                  <span class="unit-price">₹{{ item.computedPrice }} / unit</span>
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
                  class="remove-btn"
                  (click)="cartService.removeFromCart(item._id, item.selectedVariant!)"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>

          <!-- Summary Sidebar -->
          <div class="summary-section">
            <div class="summary-card glass-card sticky-top">
              <h3>Order Summary</h3>
              <div class="calc-row total-row">
                <span>Total Amount</span>
                <span class="grand-total">₹{{ cartService.totalPrice() }}</span>
              </div>

              <p class="inclusive-text">Prices are inclusive of all service charges.</p>

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
                <p class="secure-note">Secure checkout powered by KillaPay</p>
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
      .cart-header {
        margin-bottom: 40px;
      }
      .cart-header h1 {
        font-size: 2.5rem;
        font-weight: 900;
        margin: 8px 0;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6600;
      }
      .sub-text {
        color: #777;
        font-size: 1rem;
      }

      .cart-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 30px;
      }
      .items-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .item-card {
        display: grid;
        grid-template-columns: 100px 1fr auto;
        padding: 20px;
        align-items: center;
        gap: 24px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .item-media img {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 16px;
      }
      .item-main h3 {
        font-size: 1.3rem;
        font-weight: 800;
        margin: 0 0 6px;
        color: #fff;
      }
      .meta-tags {
        display: flex;
        gap: 8px;
      }
      .category-tag {
        font-size: 0.6rem;
        color: #ff6600;
        font-weight: 800;
        text-transform: uppercase;
        background: rgba(255, 102, 0, 0.1);
        padding: 3px 10px;
        border-radius: 6px;
      }
      .variant-tag {
        font-size: 0.6rem;
        color: #fff;
        font-weight: 800;
        text-transform: uppercase;
        background: #222;
        padding: 3px 10px;
        border-radius: 6px;
      }
      .item-price-info {
        margin-top: 8px;
        color: #555;
        font-weight: 600;
        font-size: 0.85rem;
      }

      .item-controls {
        display: flex;
        align-items: center;
        gap: 25px;
      }
      .qty-selector {
        display: flex;
        align-items: center;
        background: #111;
        padding: 4px;
        border-radius: 12px;
        border: 1px solid #222;
      }
      .qty-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: #222;
        color: white;
        border-radius: 8px;
        font-weight: 900;
        cursor: pointer;
        transition: 0.2s;
      }
      .qty-btn:hover {
        background: #ff6600;
      }
      .qty-val {
        padding: 0 15px;
        font-weight: 800;
        font-size: 1rem;
        color: #fff;
        min-width: 45px;
        text-align: center;
      }
      .item-total {
        font-weight: 900;
        font-size: 1.4rem;
        color: #fff;
        min-width: 90px;
        text-align: right;
      }
      .remove-btn {
        background: none;
        border: none;
        color: #ff4444;
        font-size: 2rem;
        cursor: pointer;
        opacity: 0.3;
        transition: 0.3s;
        padding: 0 5px;
      }
      .remove-btn:hover {
        opacity: 1;
      }

      .summary-card {
        padding: 35px;
        border-radius: 32px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .sticky-top {
        position: sticky;
        top: 100px;
      }
      .summary-card h3 {
        font-size: 1.3rem;
        font-weight: 900;
        margin-bottom: 25px;
        color: #fff;
        padding-bottom: 15px;
        border-bottom: 1px solid #1a1a1a;
      }
      .total-row {
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .grand-total {
        font-size: 2.2rem;
        font-weight: 900;
        color: #ff6600;
        letter-spacing: -1.5px;
      }
      .inclusive-text {
        font-size: 0.75rem;
        color: #555;
        margin: 15px 0 30px;
        font-weight: 600;
      }

      .btn-checkout {
        width: 100%;
        padding: 20px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 16px;
        font-weight: 900;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-login-prompt {
        width: 100%;
        padding: 20px;
        background: #222;
        color: white;
        border: none;
        border-radius: 16px;
        font-weight: 800;
        font-size: 1rem;
        cursor: pointer;
      }
      .secure-note {
        font-size: 0.65rem;
        color: #444;
        text-align: center;
        margin-top: 20px;
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 1px;
      }

      .empty-state {
        text-align: center;
        padding: 80px 40px;
        border-radius: 32px;
      }
      .empty-icon {
        font-size: 4rem;
        margin-bottom: 15px;
        opacity: 0.1;
      }
      .browse-btn {
        background: #ff6600;
        color: white;
        border: none;
        padding: 14px 40px;
        border-radius: 50px;
        font-weight: 900;
        cursor: pointer;
        margin-top: 25px;
      }

      .glass-card {
        background: rgba(15, 15, 15, 0.6);
        backdrop-filter: blur(25px);
      }

      @media (max-width: 1100px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }
        .summary-section {
          order: -1;
        }
        .cart-wrapper {
          padding: 100px 20px;
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
