import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { MenuService } from '../../services/menu';
import { Router } from '@angular/router';
import { MenuItem } from '../../models/menu-item.model';

interface ExtendedCartItem {
  _id?: string;
  name: string;
  category: string;
  imageUrl: string;
  quantity: number;
  selectedVariant: string;
  computedPrice: number;
  instructions?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cart-wrapper fade-in">
      <div class="container">
        <header class="cart-header">
          <span class="badge">Your Selection</span>
          <h1>Your <span class="highlight">Cravings</span></h1>
        </header>

        <div *ngIf="cartService.totalItems() === 0" class="empty-state glass-card animate-pop">
          <div class="empty-icon">🍳</div>
          <h3>Your cart is empty</h3>
          <p>The kitchen is ready, but your tray is waiting for legendary items.</p>
          <button class="browse-btn" (click)="router.navigate(['/menu'])">Explore the Menu</button>
        </div>

        <div *ngIf="cartService.totalItems() > 0" class="cart-layout">
          <div class="items-section">
            <div *ngFor="let item of getCartItems()" class="item-card glass-card">
              <div class="item-main-info">
                <img
                  [src]="item.imageUrl"
                  [alt]="item.name"
                  (error)="handleImageError($event)"
                  class="item-img"
                />
                <div class="item-text">
                  <h3>{{ item.name }}</h3>
                  <div class="item-tags">
                    <span class="tag cat">{{ item.category }}</span>
                    <span class="tag var" *ngIf="item.selectedVariant !== 'SINGLE'">{{
                      item.selectedVariant
                    }}</span>
                  </div>
                  <input
                    type="text"
                    [(ngModel)]="item.instructions"
                    placeholder="Add notes (e.g. extra spicy)..."
                    class="note-box"
                  />
                </div>
              </div>

              <div class="item-actions">
                <div class="qty-control">
                  <button
                    (click)="cartService.updateQuantity(item._id!, item.selectedVariant!, -1)"
                  >
                    -
                  </button>
                  <span class="qty">{{ item.quantity }}</span>
                  <button (click)="cartService.updateQuantity(item._id!, item.selectedVariant!, 1)">
                    +
                  </button>
                </div>
                <div class="price-zone">
                  <span class="price">₹ {{ item.computedPrice * item.quantity }}</span>
                  <button
                    class="btn-del"
                    (click)="cartService.removeFromCart(item._id!, item.selectedVariant!)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <div class="upsell-container" *ngIf="recommendations().length > 0">
              <h4 class="upsell-title">Pair it with...</h4>
              <div class="upsell-grid">
                <div *ngFor="let rec of recommendations()" class="rec-card glass-card">
                  <img [src]="rec.imageUrl" [alt]="rec.name" (error)="handleImageError($event)" />
                  <div class="rec-info">
                    <h5>{{ rec.name }}</h5>
                    <p>₹{{ rec.pricing.price || rec.pricing.priceHalf }}</p>
                  </div>
                  <button (click)="addRecToCart(rec)">+</button>
                </div>
              </div>
            </div>
          </div>

          <aside class="summary-section">
            <div class="summary-sticky glass-card">
              <h2>Summary</h2>
              <div class="summary-rows">
                <div class="s-row">
                  <span>Items ({{ cartService.totalItems() }})</span
                  ><span>₹ {{ cartService.totalPrice() }}</span>
                </div>
                <div class="s-row"><span>Kitchen Fee</span><span class="free">FREE</span></div>
              </div>
              <div class="total-final">
                <span>Grand Total</span>
                <span class="price-final">₹ {{ cartService.totalPrice() }}</span>
              </div>
              <button class="btn-primary-killa" (click)="router.navigate(['/checkout'])">
                Confirm & Checkout
              </button>
              <p class="secure-tip">🛡️ Secured by KillaPay</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cart-wrapper {
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
      .highlight {
        color: #ff6600;
      }
      .badge {
        color: #ff6600;
        font-weight: 900;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .cart-header h1 {
        font-size: 3rem;
        font-weight: 900;
        margin-top: 10px;
      }

      .cart-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 30px;
        margin-top: 40px;
      }

      .item-card {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 25px;
        border-radius: 30px;
        margin-bottom: 20px;
      }
      .item-main-info {
        display: flex;
        gap: 20px;
      }
      .item-img {
        width: 120px;
        height: 120px;
        border-radius: 20px;
        object-fit: cover;
      }
      .item-text h3 {
        font-size: 1.4rem;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .item-tags {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .tag {
        font-size: 0.65rem;
        font-weight: 900;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 6px;
      }
      .tag.cat {
        background: rgba(255, 102, 0, 0.1);
        color: #ff6600;
      }
      .tag.var {
        background: #222;
        color: #888;
      }
      .note-box {
        background: #000;
        border: 1px solid #222;
        border-radius: 8px;
        padding: 8px 12px;
        color: #888;
        font-size: 0.8rem;
        width: 100%;
        outline: none;
        transition: 0.3s;
      }
      .note-box:focus {
        border-color: #ff6600;
        color: white;
      }

      .item-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #222;
        padding-top: 20px;
      }
      .qty-control {
        display: flex;
        align-items: center;
        gap: 15px;
        background: #111;
        padding: 5px;
        border-radius: 12px;
      }
      .qty-control button {
        width: 35px;
        height: 35px;
        border: none;
        background: #222;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 900;
        transition: 0.2s;
      }
      .qty-control button:hover {
        background: #ff6600;
      }
      .qty {
        font-weight: 900;
        font-size: 1.1rem;
        min-width: 30px;
        text-align: center;
      }
      .price-zone {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .price-zone .price {
        font-size: 1.5rem;
        font-weight: 900;
        color: #ff6600;
      }
      .btn-del {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0.4;
        transition: 0.3s;
      }
      .btn-del:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      .summary-sticky {
        position: sticky;
        top: 110px;
        padding: 35px;
        border-radius: 35px;
      }
      .s-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        color: #888;
        font-weight: 600;
      }
      .s-row .free {
        color: #00ff88;
      }
      .total-final {
        border-top: 1px solid #222;
        padding-top: 25px;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 30px;
      }
      .total-final span {
        font-weight: 800;
        font-size: 1.1rem;
      }
      .price-final {
        font-size: 2.5rem !important;
        color: #ff6600;
        font-weight: 900 !important;
        letter-spacing: -2px;
      }
      .btn-primary-killa {
        width: 100%;
        padding: 20px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 18px;
        font-weight: 900;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-primary-killa:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 30px rgba(255, 102, 0, 0.4);
      }

      .upsell-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      .rec-card {
        padding: 12px;
        border-radius: 20px;
        text-align: center;
        position: relative;
      }
      .rec-card img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 10px;
        border: 2px solid #ff6600;
      }
      .rec-card h5 {
        font-size: 0.75rem;
        margin-bottom: 4px;
      }
      .rec-card p {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.8rem;
      }
      .rec-card button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #ff6600;
        color: white;
        border: none;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        font-weight: 900;
        cursor: pointer;
      }

      .empty-state {
        text-align: center;
        padding: 80px 40px;
      }
      .empty-icon {
        font-size: 5rem;
        margin-bottom: 20px;
      }
      .browse-btn {
        background: #ff6600;
        color: white;
        border: none;
        padding: 15px 40px;
        border-radius: 50px;
        font-weight: 900;
        cursor: pointer;
      }

      .glass-card {
        background: rgba(18, 18, 18, 0.7);
        backdrop-filter: blur(25px);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      @media (max-width: 950px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }
        .summary-section {
          order: -1;
        }
        .cart-header h1 {
          font-size: 2.2rem;
        }
      }

      @media (max-width: 600px) {
        .item-main-info {
          flex-direction: column;
        }
        .item-img {
          width: 100%;
          height: 200px;
        }
      }
    `,
  ],
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  menuService = inject(MenuService);
  router = inject(Router);

  recommendations = signal<MenuItem[]>([]);

  ngOnInit() {
    this.menuService.getAiRecommendations().subscribe({
      next: (items) => this.recommendations.set(items.slice(0, 4)),
      error: () => console.warn('Upsell offline'),
    });
  }

  getCartItems(): ExtendedCartItem[] {
    return this.cartService.cartItems() as unknown as ExtendedCartItem[];
  }

  addRecToCart(item: MenuItem) {
    const variant = item.pricing.type === 'SINGLE' ? 'SINGLE' : 'HALF';
    this.cartService.addToCart(item, variant);
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/400x400/111/fff?text=Killa+Delight';
  }
}
