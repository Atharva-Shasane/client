import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { MenuService } from '../../services/menu';
import { ToastService } from '../../services/toast';
import { Router } from '@angular/router';
import { MenuItem } from '../../models/menu-item.model';

// ── Helpers ────────────────────────────────────────────────────────────────
/**
 * BUG FIX — NaN prices:
 * CartService stores items with a flat `computedPrice` field (set in addToCart).
 * For normal cart items: read computedPrice directly.
 * For reordered items (from my-orders): computedPrice is set from unitPrice
 *   by CartService.reorderToCart() which maps item.unitPrice → computedPrice.
 * Fallback to deriving from pricing object if somehow computedPrice is missing.
 */
function getUnitPrice(item: any): number {
  // Primary: CartService always stores computedPrice — trust it first
  if (typeof item.computedPrice === 'number' && !isNaN(item.computedPrice) && item.computedPrice > 0) {
    return item.computedPrice;
  }
  // Secondary: reordered items may have flat unitPrice
  if (typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) && item.unitPrice > 0) {
    return item.unitPrice;
  }
  // Tertiary: derive from pricing object (MenuItem schema)
  const p = item.pricing;
  if (!p) return 0;
  const v = (item.selectedVariant || 'SINGLE').toUpperCase();
  if (v === 'HALF') return Number(p.priceHalf) || Number(p.price) || 0;
  if (v === 'FULL') return Number(p.priceFull) || Number(p.price) || 0;
  return Number(p.price) || 0;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ct-root">
      <div class="ct-container">

        <!-- ── HEADER ──────────────────────────────────────────── -->
        <header class="ct-header">
          <div>
            <div class="ct-eyebrow">Your Selection</div>
            <h1 class="ct-title">Your <span class="ct-accent">Cart</span></h1>
          </div>
          <div class="ct-header-meta" *ngIf="cartItems().length > 0">
            <span class="ct-item-count">{{ cartItems().length }} item{{ cartItems().length !== 1 ? 's' : '' }}</span>
            <button class="ct-clear-btn" (click)="clearCart()">Clear all</button>
          </div>
        </header>

        <!-- ── EMPTY STATE ─────────────────────────────────────── -->
        <div class="ct-empty" *ngIf="cartService.totalItems() === 0">
          <div class="ct-empty-icon">🛒</div>
          <h3 class="ct-empty-title">Your cart is empty</h3>
          <p class="ct-empty-sub">Add some legendary dishes to get started.</p>
          <button class="ct-btn ct-btn-primary" (click)="router.navigate(['/menu'])">
            Explore the Menu
          </button>
        </div>

        <!-- ── DRINKS-ONLY WARNING ─────────────────────────────── -->
        <div class="ct-drinks-warn" *ngIf="isDrinksOnly() && cartItems().length > 0">
          <span class="ct-warn-icon">⚠️</span>
          <div>
            <strong>Add a food item to proceed</strong>
            <p>Orders cannot contain only drinks. Add at least one food dish to checkout.</p>
          </div>
        </div>

        <!-- ── MAIN LAYOUT ─────────────────────────────────────── -->
        <div class="ct-layout" *ngIf="cartItems().length > 0">

          <!-- LEFT: Items + Upsell ─────────────────────────────── -->
          <div class="ct-left">

            <!-- Cart items -->
            <div class="ct-items-list">
              <div
                class="ct-item-card"
                *ngFor="let item of cartItems(); trackBy: trackItem"
                [class.ct-item-removing]="removingId() === item._id + item.selectedVariant"
              >
                <!-- Image -->
                <div class="ct-item-img-wrap">
                  <img
                    [src]="item.imageUrl"
                    [alt]="item.name"
                    (error)="handleImageError($event)"
                    class="ct-item-img"
                  />
                  <span class="ct-cat-dot" [class.dot-veg]="item.category === 'veg'"
                    [class.dot-nonveg]="item.category === 'non-veg'"
                    [class.dot-drink]="item.category === 'drinks'">
                  </span>
                </div>

                <!-- Info -->
                <div class="ct-item-body">
                  <div class="ct-item-top">
                    <div class="ct-item-name-row">
                      <h3 class="ct-item-name">{{ item.name }}</h3>
                      <div class="ct-item-tags">
                        <span class="ct-tag ct-tag-cat">{{ item.category }}</span>
                        <span class="ct-tag ct-tag-var"
                          *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'">
                          {{ item.selectedVariant }}
                        </span>
                      </div>
                    </div>
                    <!-- Unit price -->
                    <div class="ct-unit-price">₹{{ getUnitPrice(item) }} each</div>
                  </div>

                  <!-- Instructions: uses (input) → cartItems.update() to survive re-renders -->
                  <div class="ct-note-wrap">
                    <span class="ct-note-icon">📝</span>
                    <input
                      type="text"
                      class="ct-note-input"
                      [value]="item.instructions || ''"
                      (input)="onInstructionInput($event, item)"
                      placeholder="Add special instructions (e.g. extra spicy, no onions)…"
                    />
                  </div>

                  <!-- Qty + Price + Delete -->
                  <div class="ct-item-bottom">
                    <div class="ct-qty-control">
                      <button
                        class="ct-qty-btn"
                        (click)="cartService.updateQuantity(item._id, item.selectedVariant, -1)"
                        [disabled]="item.quantity <= 1">
                        −
                      </button>
                      <span class="ct-qty-num">{{ item.quantity }}</span>
                      <button
                        class="ct-qty-btn"
                        (click)="cartService.updateQuantity(item._id, item.selectedVariant, 1)">
                        +
                      </button>
                    </div>

                    <div class="ct-item-line-total">
                      ₹{{ getUnitPrice(item) * item.quantity }}
                    </div>

                    <button
                      class="ct-remove-btn"
                      (click)="removeItem(item)"
                      title="Remove item">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── UPSELL: 2 AI Picks ─────────────────────────── -->
            <div class="ct-upsell-section" *ngIf="aiPicks().length > 0">
              <div class="ct-upsell-head">
                <span class="ct-upsell-label">🤖 Recommended for You</span>
                <span class="ct-upsell-sub">AI-powered picks based on popular orders</span>
              </div>
              <div class="ct-upsell-grid">
                <div
                  class="ct-upsell-card"
                  *ngFor="let rec of aiPicks()"
                  [class.ct-upsell-added]="addedIds().has(rec._id + 'SINGLE')">
                  <img
                    [src]="rec.imageUrl"
                    [alt]="rec.name"
                    (error)="handleImageError($event)"
                    class="ct-upsell-img"
                  />
                  <div class="ct-upsell-info">
                    <div class="ct-upsell-name">{{ rec.name }}</div>
                    <div class="ct-upsell-price">
                      ₹{{ rec.pricing.price || rec.pricing.priceHalf }}
                    </div>
                  </div>
                  <button
                    class="ct-upsell-add"
                    (click)="addUpsell(rec, 'ai')"
                    [disabled]="addedIds().has(rec._id + 'SINGLE')">
                    {{ addedIds().has(rec._id + 'SINGLE') ? '✓' : '+' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- ── UPSELL: Drinks ──────────────────────────────── -->
            <div class="ct-upsell-section ct-drinks-section" *ngIf="drinkPicks().length > 0">
              <div class="ct-upsell-head">
                <span class="ct-upsell-label">🥤 Add a Drink</span>
                <span class="ct-upsell-sub">Complete your meal with a refreshing beverage</span>
              </div>
              <div class="ct-upsell-grid">
                <div
                  class="ct-upsell-card ct-drink-card"
                  *ngFor="let drink of drinkPicks()"
                  [class.ct-upsell-added]="addedIds().has(drink._id + 'SINGLE')">
                  <img
                    [src]="drink.imageUrl"
                    [alt]="drink.name"
                    (error)="handleImageError($event)"
                    class="ct-upsell-img"
                  />
                  <div class="ct-upsell-info">
                    <div class="ct-upsell-name">{{ drink.name }}</div>
                    <div class="ct-upsell-price ct-drink-price">
                      ₹{{ drink.pricing.price || drink.pricing.priceHalf }}
                    </div>
                  </div>
                  <button
                    class="ct-upsell-add ct-drink-add"
                    (click)="addUpsell(drink, 'drink')"
                    [disabled]="addedIds().has(drink._id + 'SINGLE')">
                    {{ addedIds().has(drink._id + 'SINGLE') ? '✓' : '+' }}
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT: Bill Summary ─────────────────────────────── -->
          <aside class="ct-summary">
            <div class="ct-summary-card">

              <div class="ct-summary-title">Order Bill</div>

              <!-- Line items breakdown -->
              <div class="ct-bill-lines">
                <div class="ct-bill-line" *ngFor="let item of cartItems()">
                  <div class="ct-bill-name">
                    <span class="ct-bill-qty">{{ item.quantity }}×</span>
                    {{ item.name }}
                    <span class="ct-bill-var"
                      *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'">
                      ({{ item.selectedVariant }})
                    </span>
                  </div>
                  <div class="ct-bill-amt">₹{{ getUnitPrice(item) * item.quantity }}</div>
                </div>
              </div>

              <!-- Divider -->
              <div class="ct-bill-divider"></div>

              <!-- Subtotal -->
              <div class="ct-bill-row">
                <span>Subtotal</span>
                <span>₹{{ computedTotal() }}</span>
              </div>
              <div class="ct-bill-row ct-bill-free">
                <span>Kitchen Fee</span>
                <span class="ct-free-tag">FREE</span>
              </div>

              <!-- Grand total -->
              <div class="ct-grand-total">
                <span class="ct-gt-label">Total</span>
                <span class="ct-gt-amount">₹{{ computedTotal() }}</span>
              </div>

              <!-- Checkout button -->
              <button
                class="ct-checkout-btn"
                (click)="goToCheckout()"
                [disabled]="isDrinksOnly()">
                {{ isDrinksOnly() ? 'Add food to proceed' : 'Proceed to Checkout →' }}
              </button>

              <div class="ct-secure-note">🔒 Secured by KillaPay</div>

            </div>
          </aside>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --orange:     #ff6600;
      --orange-dim: rgba(255,102,0,0.12);
      --green:      #22c55e;
      --blue:       #3b82f6;
      --cyan:       #06b6d4;
      --red:        #ef4444;
      --bg:         #070709;
      --s1:         #0e0e11;
      --s2:         #161619;
      --s3:         #1d1d21;
      --border:     rgba(255,255,255,0.06);
      --brite:      rgba(255,255,255,0.11);
      --text:       #f0f0f0;
      --muted:      #555;
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
      display: block;
    }

    /* ── Root ───────────────────────────────────────────────── */
    .ct-root {
      background: var(--bg);
      min-height: 100vh;
      color: var(--text);
      padding: 100px 0 80px;
    }
    .ct-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .ct-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 36px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .ct-eyebrow {
      font-size: 0.62rem; font-weight: 800; letter-spacing: 3px;
      text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
    }
    .ct-title {
      font-size: 3rem; font-weight: 900; letter-spacing: -2px; margin: 0; line-height: 1;
    }
    .ct-accent { color: var(--orange); }
    .ct-header-meta { display: flex; align-items: center; gap: 14px; }
    .ct-item-count { font-size: 0.78rem; color: var(--muted); font-weight: 700; }
    .ct-clear-btn {
      background: none; border: 1px solid rgba(239,68,68,0.25); color: var(--red);
      padding: 6px 14px; border-radius: 7px; font-size: 0.72rem; font-weight: 700;
      cursor: pointer; transition: background 0.2s;
    }
    .ct-clear-btn:hover { background: rgba(239,68,68,0.08); }

    /* ── Empty ──────────────────────────────────────────────── */
    .ct-empty {
      text-align: center; padding: 100px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
    }
    .ct-empty-icon { font-size: 3.5rem; opacity: 0.2; }
    .ct-empty-title { font-size: 1.6rem; font-weight: 900; margin: 0; }
    .ct-empty-sub { color: var(--muted); margin: 0; font-size: 0.88rem; }

    /* ── Drinks-only warning ────────────────────────────────── */
    .ct-drinks-warn {
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25);
      border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
    }
    .ct-warn-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
    .ct-drinks-warn strong { display: block; font-weight: 800; color: #f59e0b; margin-bottom: 4px; }
    .ct-drinks-warn p { margin: 0; font-size: 0.82rem; color: var(--muted); }

    /* ── Layout ─────────────────────────────────────────────── */
    .ct-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 28px;
      align-items: start;
    }

    /* ── Cart item card ─────────────────────────────────────── */
    .ct-items-list { display: flex; flex-direction: column; gap: 12px; }
    .ct-item-card {
      background: var(--s1); border: 1px solid var(--border); border-radius: 18px;
      padding: 18px; display: flex; gap: 16px;
      transition: border-color 0.2s, opacity 0.3s;
    }
    .ct-item-card:hover { border-color: var(--brite); }
    .ct-item-removing { opacity: 0.3; pointer-events: none; }

    /* Image + veg dot */
    .ct-item-img-wrap { position: relative; flex-shrink: 0; }
    .ct-item-img {
      width: 96px; height: 96px; border-radius: 14px;
      object-fit: cover; display: block;
    }
    .ct-cat-dot {
      position: absolute; bottom: 5px; right: 5px;
      width: 10px; height: 10px; border-radius: 50%;
      border: 2px solid var(--s1);
    }
    .dot-veg    { background: var(--green); }
    .dot-nonveg { background: var(--red); }
    .dot-drink  { background: var(--cyan); }

    /* Body */
    .ct-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
    .ct-item-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .ct-item-name-row { display: flex; flex-direction: column; gap: 5px; }
    .ct-item-name { font-size: 1.05rem; font-weight: 800; margin: 0; line-height: 1.2; }
    .ct-item-tags { display: flex; gap: 6px; }
    .ct-tag {
      font-size: 0.58rem; font-weight: 800; text-transform: uppercase;
      padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;
    }
    .ct-tag-cat { background: var(--orange-dim); color: var(--orange); }
    .ct-tag-var { background: var(--s3); color: var(--muted); }
    .ct-unit-price { font-size: 0.72rem; color: var(--muted); font-weight: 700; flex-shrink: 0; white-space: nowrap; }

    /* Instructions */
    .ct-note-wrap {
      display: flex; align-items: center; gap: 8px;
      background: var(--s3); border-radius: 9px; padding: 0 12px;
      border: 1px solid var(--border); transition: border-color 0.2s;
    }
    .ct-note-wrap:focus-within { border-color: rgba(255,102,0,0.35); }
    .ct-note-icon { font-size: 0.8rem; flex-shrink: 0; opacity: 0.5; }
    .ct-note-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text); font-size: 0.78rem; padding: 10px 0;
      font-family: inherit;
    }
    .ct-note-input::placeholder { color: var(--muted); }

    /* Bottom row */
    .ct-item-bottom {
      display: flex; align-items: center; gap: 14px;
      border-top: 1px solid var(--border); padding-top: 10px;
    }
    .ct-qty-control {
      display: flex; align-items: center; gap: 4px;
      background: var(--s3); border-radius: 9px; padding: 3px;
    }
    .ct-qty-btn {
      width: 32px; height: 32px; border: none; background: var(--s2);
      color: var(--text); border-radius: 7px; font-size: 1.1rem; font-weight: 700;
      cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center;
    }
    .ct-qty-btn:hover:not([disabled]) { background: var(--orange); }
    .ct-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .ct-qty-num { font-size: 0.95rem; font-weight: 800; min-width: 28px; text-align: center; }
    .ct-item-line-total {
      font-size: 1.15rem; font-weight: 900; color: var(--orange); margin-left: auto;
    }
    .ct-remove-btn {
      background: none; border: 1px solid var(--border); color: var(--muted);
      width: 30px; height: 30px; border-radius: 7px; cursor: pointer; font-size: 0.7rem;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.15s, color 0.15s;
    }
    .ct-remove-btn:hover { border-color: var(--red); color: var(--red); }

    /* ── Upsell sections ────────────────────────────────────── */
    .ct-upsell-section {
      background: var(--s1); border: 1px solid var(--border);
      border-radius: 18px; padding: 20px; margin-top: 16px;
    }
    .ct-drinks-section { border-color: rgba(6,182,212,0.2); }
    .ct-upsell-head { margin-bottom: 16px; }
    .ct-upsell-label { font-size: 0.8rem; font-weight: 800; display: block; margin-bottom: 4px; }
    .ct-upsell-sub { font-size: 0.7rem; color: var(--muted); }

    .ct-upsell-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ct-upsell-card {
      background: var(--s2); border: 1px solid var(--border); border-radius: 14px;
      padding: 14px 14px 14px 14px; display: flex; align-items: center; gap: 12px;
      transition: border-color 0.2s;
    }
    .ct-upsell-card:hover { border-color: var(--brite); }
    .ct-upsell-added { border-color: rgba(34,197,94,0.3) !important; }
    .ct-drink-card { border-color: rgba(6,182,212,0.15); }
    .ct-upsell-img {
      width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0;
    }
    .ct-upsell-info { flex: 1; min-width: 0; }
    .ct-upsell-name {
      font-size: 0.78rem; font-weight: 700;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 3px;
    }
    .ct-upsell-price { font-size: 0.8rem; font-weight: 800; color: var(--orange); }
    .ct-drink-price { color: var(--cyan); }
    .ct-upsell-add {
      width: 30px; height: 30px; border-radius: 8px; border: none;
      background: var(--orange); color: #fff; font-size: 1rem; font-weight: 800;
      cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .ct-drink-add { background: var(--cyan); color: #000; }
    .ct-upsell-add:disabled { background: rgba(34,197,94,0.3); color: var(--green); cursor: default; }

    /* ── Summary card ───────────────────────────────────────── */
    .ct-summary { position: sticky; top: 100px; }
    .ct-summary-card {
      background: var(--s1); border: 1px solid var(--brite);
      border-radius: 22px; padding: 28px;
    }
    .ct-summary-title {
      font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 2.5px; color: var(--muted); margin-bottom: 20px;
    }

    /* Bill lines */
    .ct-bill-lines {
      display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;
    }
    .ct-bill-line {
      display: flex; justify-content: space-between; align-items: baseline;
      gap: 8px; font-size: 0.82rem;
    }
    .ct-bill-name {
      color: #ccc; display: flex; align-items: baseline;
      gap: 5px; flex: 1; min-width: 0;
    }
    .ct-bill-qty { color: var(--orange); font-weight: 800; flex-shrink: 0; }
    .ct-bill-var { color: var(--muted); font-size: 0.7rem; }
    .ct-bill-amt { font-weight: 700; flex-shrink: 0; }

    .ct-bill-divider { height: 1px; background: var(--border); margin: 14px 0; }

    .ct-bill-row {
      display: flex; justify-content: space-between;
      font-size: 0.82rem; color: var(--muted); font-weight: 600;
      margin-bottom: 10px;
    }
    .ct-bill-free .ct-free-tag {
      font-size: 0.65rem; font-weight: 800;
      background: rgba(34,197,94,0.12); color: var(--green);
      padding: 2px 8px; border-radius: 5px;
    }

    .ct-grand-total {
      display: flex; justify-content: space-between; align-items: baseline;
      border-top: 1px solid var(--brite); padding-top: 18px; margin: 14px 0 24px;
    }
    .ct-gt-label { font-size: 0.85rem; font-weight: 800; }
    .ct-gt-amount { font-size: 2.2rem; font-weight: 900; letter-spacing: -1.5px; color: var(--orange); }

    .ct-checkout-btn {
      width: 100%; padding: 17px; background: var(--orange); color: #fff;
      border: none; border-radius: 14px; font-size: 0.95rem; font-weight: 900;
      cursor: pointer; transition: opacity 0.2s, transform 0.2s;
      letter-spacing: 0.3px;
    }
    .ct-checkout-btn:hover:not([disabled]) {
      opacity: 0.88; transform: translateY(-2px);
    }
    .ct-checkout-btn:disabled {
      background: var(--s3); color: var(--muted); cursor: not-allowed; transform: none;
    }
    .ct-secure-note {
      text-align: center; font-size: 0.68rem; color: var(--muted);
      margin-top: 12px; font-weight: 600;
    }

    /* ── Buttons ────────────────────────────────────────────── */
    .ct-btn {
      padding: 12px 28px; border-radius: 40px; font-size: 0.88rem;
      font-weight: 800; cursor: pointer; border: none;
      transition: opacity 0.15s, transform 0.15s;
    }
    .ct-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .ct-btn-primary { background: var(--orange); color: #fff; }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 960px) {
      .ct-layout { grid-template-columns: 1fr; }
      .ct-summary { position: static; order: -1; }
      .ct-summary-card { border-radius: 16px; }
      .ct-title { font-size: 2.2rem; }
    }
    @media (max-width: 560px) {
      .ct-root { padding: 80px 0 60px; }
      .ct-container { padding: 0 16px; }
      .ct-item-card { flex-direction: column; }
      .ct-item-img { width: 100%; height: 180px; border-radius: 12px; }
      .ct-item-img-wrap { width: 100%; }
      .ct-upsell-grid { grid-template-columns: 1fr; }
      .ct-title { font-size: 1.9rem; }
    }
  `],
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  menuService = inject(MenuService);
  router      = inject(Router);

  // Try to inject ToastService gracefully (may not be provided in all setups)
  private toast = inject(ToastService, { optional: true } as any);

  // Signals
  allRecommendations = signal<MenuItem[]>([]);
  allDrinks          = signal<MenuItem[]>([]);
  addedIds           = signal<Set<string>>(new Set());
  removingId         = signal<string>('');

  // ── Computed ──────────────────────────────────────────────────────────
  cartItems = computed(() => this.cartService.cartItems() as any[]);

  /**
   * Use cartService.totalPrice() directly — it already sums
   * item.computedPrice * item.quantity correctly.
   * We keep our own computed as a display-safe fallback with || 0.
   */
  computedTotal = computed(() =>
    this.cartService.totalPrice() || 0
  );

  /**
   * BUG FIX #3 — drinks-only validation:
   * Returns true if ALL items in cart are drinks.
   * Checkout is blocked in this case.
   */
  isDrinksOnly = computed(() => {
    const items = this.cartItems();
    if (items.length === 0) return false;
    return items.every((item: any) => item.category === 'drinks');
  });

  /**
   * AI picks: max 2, non-drink items not already in cart
   */
  aiPicks = computed(() => {
    const inCart = new Set(this.cartItems().map((i: any) => i._id));
    return this.allRecommendations()
      .filter(r => r.category !== 'drinks' && !inCart.has(r._id))
      .slice(0, 2);
  });

  /**
   * Drink picks: max 2 drinks not already in cart
   */
  drinkPicks = computed(() => {
    const inCart = new Set(this.cartItems().map((i: any) => i._id));
    return this.allDrinks()
      .filter(d => !inCart.has(d._id))
      .slice(0, 2);
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit() {
    // Load AI recommendations (non-drinks)
    this.menuService.getAiRecommendations().subscribe({
      next: (items) => this.allRecommendations.set(items),
      error: () => {},
    });

    // Load all menu items and extract drinks separately
    this.menuService.getMenuItems().subscribe({
      next: (items: MenuItem[]) => {
        const drinks = items
          .filter(i => i.category === 'drinks' && i.isAvailable)
          .sort(() => Math.random() - 0.5); // shuffle for variety
        this.allDrinks.set(drinks);
      },
      error: () => {},
    });
  }

  // ── Exposed helper (accessible from template) ──────────────────────────
  getUnitPrice(item: any): number {
    return getUnitPrice(item);
  }

  // ── Instructions input handler ───────────────────────────────────────
  // CartService has no updateInstructions() method — it exposes
  // cartItems as a writable signal, so we update it directly.
  onInstructionInput(event: Event, item: any) {
    const value = (event.target as HTMLInputElement).value;
    this.cartService.cartItems.update(items =>
      items.map((i: any) =>
        i._id === item._id && i.selectedVariant === item.selectedVariant
          ? { ...i, instructions: value }
          : i
      )
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────
  addUpsell(item: MenuItem, type: 'ai' | 'drink') {
    const variant = item.pricing.type === 'SINGLE' ? 'SINGLE' : 'HALF';
    this.cartService.addToCart(item, variant);

    // Track added state for button feedback
    const key = item._id + 'SINGLE';
    const current = new Set(this.addedIds());
    current.add(key);
    this.addedIds.set(current);

    const msg = type === 'drink'
      ? `${item.name} added to cart 🥤`
      : `${item.name} added to cart!`;

    if (this.toast) {
      this.toast.show(msg, 'success');
    }
  }

  removeItem(item: any) {
    const key = item._id + item.selectedVariant;
    this.removingId.set(key);
    // Small delay for animation before removal
    setTimeout(() => {
      this.cartService.removeFromCart(item._id, item.selectedVariant);
      this.removingId.set('');
    }, 200);
  }

  clearCart() {
    if (!confirm('Remove all items from your cart?')) return;
    // Remove each item
    const items = [...this.cartItems()];
    items.forEach(item => this.cartService.removeFromCart(item._id, item.selectedVariant));
  }

  /**
   * BUG FIX #3 — drinks-only guard before checkout.
   * Also guards against empty cart (redundant but safe).
   */
  goToCheckout() {
    if (this.isDrinksOnly()) {
      if (this.toast) {
        this.toast.show('Please add at least one food item to proceed.', 'error');
      }
      return;
    }
    if (this.cartItems().length === 0) return;
    this.router.navigate(['/checkout']);
  }

  trackItem(_: number, item: any): string {
    return item._id + item.selectedVariant;
  }

  handleImageError(event: any) {
    // Inline SVG data URI — no external dependency
    event.target.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23111'/%3E%3Ctext x='100' y='110' text-anchor='middle' font-size='40' fill='%23333'%3E🍽%3C/text%3E%3C/svg%3E";
  }
}