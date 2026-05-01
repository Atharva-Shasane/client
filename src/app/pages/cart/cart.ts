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

// ── Price helper (unchanged logic) ────────────────────────────────────────
function getUnitPrice(item: any): number {
  if (typeof item.computedPrice === 'number' && !isNaN(item.computedPrice) && item.computedPrice > 0) {
    return item.computedPrice;
  }
  if (typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) && item.unitPrice > 0) {
    return item.unitPrice;
  }
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
    <div class="cart-page">

      <!-- ── Ambient background ── -->
      <div class="cart-bg">
        <div class="cb-blob blob-1"></div>
        <div class="cb-blob blob-2"></div>
        <div class="cb-grain"></div>
      </div>

      <div class="cart-shell">

        <!-- ══════════════════════════════════
             HEADER
        ══════════════════════════════════ -->
        <header class="cart-header">
          <div class="ch-left">
            <p class="ch-eyebrow">
              <span class="eyebrow-dot"></span>
              Your Selection
            </p>
            <h1 class="ch-title">Your <span class="accent">Cart</span></h1>
          </div>
          <div class="ch-meta" *ngIf="cartItems().length > 0">
            <span class="ch-count">{{ cartItems().length }} item{{ cartItems().length !== 1 ? 's' : '' }}</span>
            <button class="ch-clear" (click)="clearCart()">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              Clear all
            </button>
          </div>
        </header>

        <!-- ══════════════════════════════════
             DRINKS-ONLY WARNING
        ══════════════════════════════════ -->
        <div class="warn-bar" *ngIf="isDrinksOnly() && cartItems().length > 0">
          <div class="warn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <p class="warn-title">Add a food item to proceed</p>
            <p class="warn-sub">Orders cannot contain only drinks. Add at least one food dish to checkout.</p>
          </div>
        </div>

        <!-- ══════════════════════════════════
             EMPTY STATE
        ══════════════════════════════════ -->
        <div class="empty-state" *ngIf="cartItems().length === 0">
          <div class="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
          <h3 class="empty-title">Your cart is empty</h3>
          <p class="empty-sub">Add some legendary dishes to get started.</p>
          <button class="cta-primary" (click)="router.navigate(['/menu'])">
            <span>Explore the Menu</span>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

        <!-- ══════════════════════════════════
             MAIN LAYOUT
        ══════════════════════════════════ -->
        <div class="cart-layout" *ngIf="cartItems().length > 0">

          <!-- ── LEFT column ── -->
          <div class="cart-left">

            <!-- Section label -->
            <div class="section-label">
              <span class="label-dot orange-dot"></span>
              Cart Items
            </div>

            <!-- Item cards -->
            <div class="items-list">
              <div
                class="item-card"
                *ngFor="let item of cartItems(); trackBy: trackItem"
                [class.item-removing]="removingId() === item._id + item.selectedVariant"
              >
                <!-- Image -->
                <div class="item-img-wrap">
                  <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" class="item-img" />
                  <span class="cat-pip"
                    [class.pip-veg]="item.category === 'veg'"
                    [class.pip-nonveg]="item.category === 'non-veg'"
                    [class.pip-drink]="item.category === 'drinks'">
                  </span>
                </div>

                <!-- Body -->
                <div class="item-body">
                  <div class="item-top">
                    <div>
                      <h3 class="item-name">{{ item.name }}</h3>
                      <div class="item-tags">
                        <span class="itag itag-cat">{{ item.category }}</span>
                        <span class="itag itag-var" *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'">
                          {{ item.selectedVariant }}
                        </span>
                      </div>
                    </div>
                    <span class="unit-price">₹{{ getUnitPrice(item) }} each</span>
                  </div>

                  <!-- Instructions -->
                  <div class="note-row" [class.note-focused]="focusedNote === (item._id + item.selectedVariant)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="note-ico"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                    <input
                      type="text"
                      class="note-input"
                      [value]="item.instructions || ''"
                      (input)="onInstructionInput($event, item)"
                      (focus)="focusedNote = item._id + item.selectedVariant"
                      (blur)="focusedNote = ''"
                      placeholder="Special instructions (e.g. extra spicy, no onions)…"
                    />
                  </div>

                  <!-- Bottom row -->
                  <div class="item-bottom">
                    <!-- Qty stepper -->
                    <div class="qty-stepper">
                      <button class="qty-btn"
                        (click)="cartService.updateQuantity(item._id, item.selectedVariant, -1)"
                        [disabled]="item.quantity <= 1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                      </button>
                      <span class="qty-num">{{ item.quantity }}</span>
                      <button class="qty-btn"
                        (click)="cartService.updateQuantity(item._id, item.selectedVariant, 1)">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                      </button>
                    </div>

                    <span class="line-total">₹{{ getUnitPrice(item) * item.quantity }}</span>

                    <button class="remove-btn" (click)="removeItem(item)" title="Remove item">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── AI Recommendations upsell ── -->
            <div class="upsell-block" *ngIf="aiPicks().length > 0">
              <div class="section-label" style="margin-bottom: 14px;">
                <span class="label-dot ai-dot"></span>
                AI-Recommended Add-ons
              </div>
              <div class="upsell-grid">
                <div class="upsell-card"
                  *ngFor="let rec of aiPicks()"
                  [class.upsell-added]="addedIds().has(rec._id + 'SINGLE')">
                  <img [src]="rec.imageUrl" [alt]="rec.name" (error)="handleImageError($event)" class="upsell-img" />
                  <div class="upsell-info">
                    <p class="upsell-name">{{ rec.name }}</p>
                    <p class="upsell-price">₹{{ rec.pricing.price || rec.pricing.priceHalf }}</p>
                  </div>
                  <button class="upsell-add-btn"
                    (click)="addUpsell(rec, 'ai')"
                    [disabled]="addedIds().has(rec._id + 'SINGLE')">
                    <svg *ngIf="!addedIds().has(rec._id + 'SINGLE')" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                    <svg *ngIf="addedIds().has(rec._id + 'SINGLE')" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- ── Drinks upsell ── -->
            <div class="upsell-block upsell-drinks" *ngIf="drinkPicks().length > 0">
              <div class="section-label" style="margin-bottom: 14px;">
                <span class="label-dot cyan-dot"></span>
                Complete Your Meal
              </div>
              <div class="upsell-grid">
                <div class="upsell-card upsell-card-drink"
                  *ngFor="let drink of drinkPicks()"
                  [class.upsell-added]="addedIds().has(drink._id + 'SINGLE')">
                  <img [src]="drink.imageUrl" [alt]="drink.name" (error)="handleImageError($event)" class="upsell-img" />
                  <div class="upsell-info">
                    <p class="upsell-name">{{ drink.name }}</p>
                    <p class="upsell-price upsell-drink-price">₹{{ drink.pricing.price || drink.pricing.priceHalf }}</p>
                  </div>
                  <button class="upsell-add-btn upsell-add-drink"
                    (click)="addUpsell(drink, 'drink')"
                    [disabled]="addedIds().has(drink._id + 'SINGLE')">
                    <svg *ngIf="!addedIds().has(drink._id + 'SINGLE')" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                    <svg *ngIf="addedIds().has(drink._id + 'SINGLE')" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div><!-- /cart-left -->

          <!-- ── RIGHT: Bill summary ── -->
          <aside class="cart-right">
            <div class="bill-card">

              <!-- Bill header -->
              <div class="bill-header">
                <div class="section-label" style="margin-bottom:0">
                  <span class="label-dot orange-dot"></span>
                  Order Bill
                </div>
              </div>

              <!-- Line items -->
              <div class="bill-lines">
                <div class="bill-line" *ngFor="let item of cartItems()">
                  <div class="bl-name">
                    <span class="bl-qty">{{ item.quantity }}×</span>
                    <span class="bl-text">{{ item.name }}<span class="bl-var" *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'"> ({{ item.selectedVariant }})</span></span>
                  </div>
                  <span class="bl-amt">₹{{ getUnitPrice(item) * item.quantity }}</span>
                </div>
              </div>

              <div class="bill-divider"></div>

              <!-- Totals -->
              <div class="bill-row">
                <span>Subtotal</span>
                <span>₹{{ computedTotal() }}</span>
              </div>
              <div class="bill-row bill-free-row">
                <span>Kitchen Fee</span>
                <span class="free-pill">FREE</span>
              </div>

              <!-- Grand total -->
              <div class="grand-total-row">
                <span class="gt-label">Total</span>
                <span class="gt-amount">₹{{ computedTotal() }}</span>
              </div>

              <!-- Checkout -->
              <button
                class="checkout-btn"
                (click)="goToCheckout()"
                [disabled]="isDrinksOnly()"
                [class.checkout-disabled]="isDrinksOnly()">
                <span>{{ isDrinksOnly() ? 'Add food to proceed' : 'Proceed to Checkout' }}</span>
                <svg *ngIf="!isDrinksOnly()" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>

              <!-- Secure note -->
              <div class="secure-note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Secured by KillaPay
              </div>

            </div><!-- /bill-card -->
          </aside>

        </div><!-- /cart-layout -->

      </div><!-- /cart-shell -->
    </div><!-- /cart-page -->
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       TOKENS — same as homepage / navbar / profile
    ═══════════════════════════════════════════ */
    :host {
      --orange:      #ff6600;
      --orange-dim:  rgba(255,102,0,0.12);
      --orange-glow: rgba(255,102,0,0.28);
      --cyan:        #06b6d4;
      --cyan-dim:    rgba(6,182,212,0.12);
      --green:       #22c55e;
      --red:         #ef4444;
      --amber:       #f59e0b;
      --surface:     #0d0d0d;
      --surface-2:   #111111;
      --surface-3:   #161616;
      --surface-4:   #1a1a1a;
      --border:      rgba(255,255,255,0.07);
      --border-h:    rgba(255,255,255,0.13);
      --text:        #f0ede8;
      --text-muted:  #6b6b6b;
      --text-dim:    #3a3a3a;
    }

    /* ═══════════════════════════════════════════
       PAGE WRAP + BG
    ═══════════════════════════════════════════ */
    .cart-page {
      position: relative;
      min-height: 100vh;
      background: var(--surface);
      color: var(--text);
      padding: 96px 0 80px;
      overflow: hidden;
    }

    .cart-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .cb-blob {
      position: absolute; border-radius: 50%;
      filter: blur(110px); opacity: 0.1;
      animation: blobDrift 10s ease-in-out infinite alternate;
    }
    .blob-1 { width: 500px; height: 500px; background: var(--orange); top: -160px; right: -100px; }
    .blob-2 { width: 300px; height: 300px; background: #c73e00; bottom: 60px; left: -60px; animation-delay: -5s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(20px,16px) scale(1.05); }
    }
    .cb-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       SHELL
    ═══════════════════════════════════════════ */
    .cart-shell {
      position: relative; z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 28px;
      animation: fadeUp 0.5s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ═══════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════ */
    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .ch-eyebrow {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--orange); margin: 0 0 10px;
    }
    .eyebrow-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--orange);
      box-shadow: 0 0 8px var(--orange-glow);
      animation: epulse 2s ease-in-out infinite;
    }
    @keyframes epulse {
      0%,100% { box-shadow: 0 0 5px var(--orange-glow); }
      50%      { box-shadow: 0 0 14px var(--orange); }
    }
    .ch-title {
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      font-weight: 900; letter-spacing: -0.04em; margin: 0; line-height: 1;
    }
    .accent { color: var(--orange); }

    .ch-meta { display: flex; align-items: center; gap: 12px; }
    .ch-count {
      font-size: 0.75rem; font-weight: 700;
      color: var(--text-muted);
      padding: 5px 12px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 20px;
    }
    .ch-clear {
      display: flex; align-items: center; gap: 6px;
      background: none;
      border: 1px solid rgba(239,68,68,0.2);
      color: rgba(239,68,68,0.7);
      padding: 6px 13px;
      border-radius: 8px;
      font-size: 0.72rem; font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, color 0.2s, border-color 0.2s;
    }
    .ch-clear:hover { background: rgba(239,68,68,0.08); color: var(--red); border-color: rgba(239,68,68,0.35); }

    /* ═══════════════════════════════════════════
       SHARED LABELS
    ═══════════════════════════════════════════ */
    .section-label {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.68rem; font-weight: 800;
      letter-spacing: 0.13em; text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 18px;
    }
    .label-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--text-dim);
    }
    .orange-dot { background: var(--orange); box-shadow: 0 0 7px var(--orange-glow); }
    .ai-dot     { background: var(--orange); box-shadow: 0 0 7px var(--orange-glow); }
    .cyan-dot   { background: var(--cyan); box-shadow: 0 0 7px rgba(6,182,212,0.4); }

    /* ═══════════════════════════════════════════
       DRINKS-ONLY WARNING
    ═══════════════════════════════════════════ */
    .warn-bar {
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(245,158,11,0.07);
      border: 1px solid rgba(245,158,11,0.22);
      border-radius: 16px;
      padding: 18px 20px;
      margin-bottom: 28px;
      animation: fadeUp 0.4s ease both;
    }
    .warn-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      border-radius: 10px;
      background: rgba(245,158,11,0.1);
      display: flex; align-items: center; justify-content: center;
      color: var(--amber);
    }
    .warn-title { font-weight: 800; font-size: 0.88rem; color: var(--amber); margin: 0 0 4px; }
    .warn-sub   { font-size: 0.78rem; color: var(--text-muted); margin: 0; line-height: 1.5; }

    /* ═══════════════════════════════════════════
       EMPTY STATE
    ═══════════════════════════════════════════ */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px;
      min-height: 60vh; text-align: center;
    }
    .empty-icon-wrap {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: var(--surface-3);
      border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-dim);
      margin-bottom: 8px;
    }
    .empty-title { font-size: 1.6rem; font-weight: 900; margin: 0; }
    .empty-sub   { color: var(--text-muted); margin: 0; font-size: 0.9rem; }

    .cta-primary {
      display: inline-flex; align-items: center; gap: 10px;
      background: var(--orange); color: #fff;
      padding: 13px 26px; border-radius: 12px;
      font-weight: 800; font-size: 0.88rem;
      border: none; cursor: pointer;
      text-decoration: none;
      box-shadow: 0 4px 20px var(--orange-glow);
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
      margin-top: 8px;
    }
    .cta-primary:hover { background: #e55a00; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255,102,0,0.4); }

    /* ═══════════════════════════════════════════
       TWO-COLUMN LAYOUT
    ═══════════════════════════════════════════ */
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 24px;
      align-items: start;
    }

    /* ═══════════════════════════════════════════
       ITEM CARDS
    ═══════════════════════════════════════════ */
    .items-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 8px; }

    .item-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 18px;
      display: flex; gap: 16px;
      transition: border-color 0.25s, transform 0.25s, opacity 0.3s;
    }
    .item-card:hover {
      border-color: var(--border-h);
      transform: translateY(-2px);
    }
    .item-removing { opacity: 0.25; pointer-events: none; transform: scale(0.97); }

    /* Image */
    .item-img-wrap { position: relative; flex-shrink: 0; }
    .item-img {
      width: 90px; height: 90px;
      border-radius: 14px; object-fit: cover; display: block;
    }
    .cat-pip {
      position: absolute; bottom: 6px; right: 6px;
      width: 10px; height: 10px; border-radius: 50%;
      border: 2px solid var(--surface-2);
    }
    .pip-veg    { background: var(--green); box-shadow: 0 0 6px rgba(34,197,94,0.5); }
    .pip-nonveg { background: var(--red);   box-shadow: 0 0 6px rgba(239,68,68,0.5); }
    .pip-drink  { background: var(--cyan);  box-shadow: 0 0 6px rgba(6,182,212,0.5); }

    /* Body */
    .item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
    .item-top  { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .item-name { font-size: 1rem; font-weight: 800; margin: 0 0 6px; line-height: 1.2; color: var(--text); }

    .item-tags { display: flex; gap: 6px; }
    .itag {
      font-size: 0.58rem; font-weight: 800; text-transform: uppercase;
      padding: 2px 8px; border-radius: 5px; letter-spacing: 0.06em;
    }
    .itag-cat { background: var(--orange-dim); color: var(--orange); }
    .itag-var { background: var(--surface-4); color: var(--text-muted); border: 1px solid var(--border); }

    .unit-price {
      font-size: 0.7rem; font-weight: 700;
      color: var(--text-muted); flex-shrink: 0; white-space: nowrap;
    }

    /* Instructions row */
    .note-row {
      display: flex; align-items: center; gap: 8px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0 12px;
      transition: border-color 0.2s;
    }
    .note-row.note-focused { border-color: rgba(255,102,0,0.35); }
    .note-ico { color: var(--text-dim); flex-shrink: 0; }
    .note-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text); font-size: 0.78rem;
      padding: 10px 0; font-family: inherit;
    }
    .note-input::placeholder { color: var(--text-dim); }

    /* Bottom row */
    .item-bottom {
      display: flex; align-items: center; gap: 12px;
      border-top: 1px solid var(--border); padding-top: 12px;
    }

    /* Qty stepper */
    .qty-stepper {
      display: flex; align-items: center; gap: 2px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 10px; padding: 3px;
    }
    .qty-btn {
      width: 30px; height: 30px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      border-radius: 8px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .qty-btn:hover:not([disabled]) { background: var(--orange); color: #fff; }
    .qty-btn:disabled { opacity: 0.25; cursor: not-allowed; }
    .qty-num {
      font-size: 0.92rem; font-weight: 800;
      min-width: 28px; text-align: center;
      color: var(--text);
    }

    .line-total {
      font-size: 1.1rem; font-weight: 900;
      color: var(--orange); margin-left: auto;
    }

    .remove-btn {
      width: 30px; height: 30px; flex-shrink: 0;
      background: none;
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.18s, color 0.18s, background 0.18s;
    }
    .remove-btn:hover { border-color: var(--red); color: var(--red); background: rgba(239,68,68,0.06); }

    /* ═══════════════════════════════════════════
       UPSELL BLOCKS
    ═══════════════════════════════════════════ */
    .upsell-block {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 22px;
      margin-top: 16px;
      transition: border-color 0.25s;
    }
    .upsell-block:hover { border-color: var(--border-h); }
    .upsell-drinks { border-color: rgba(6,182,212,0.15); }
    .upsell-drinks:hover { border-color: rgba(6,182,212,0.28); }

    .upsell-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .upsell-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 14px; padding: 12px;
      transition: border-color 0.2s;
    }
    .upsell-card:hover { border-color: var(--border-h); }
    .upsell-added { border-color: rgba(34,197,94,0.28) !important; }
    .upsell-card-drink { border-color: rgba(6,182,212,0.12); }

    .upsell-img {
      width: 50px; height: 50px;
      border-radius: 10px; object-fit: cover; flex-shrink: 0;
    }
    .upsell-info { flex: 1; min-width: 0; }
    .upsell-name {
      font-size: 0.78rem; font-weight: 700; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin: 0 0 4px;
    }
    .upsell-price { font-size: 0.8rem; font-weight: 900; color: var(--orange); margin: 0; }
    .upsell-drink-price { color: var(--cyan); }

    .upsell-add-btn {
      width: 32px; height: 32px; flex-shrink: 0;
      border-radius: 9px; border: none;
      background: var(--orange-dim);
      color: var(--orange);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.18s, color 0.18s, transform 0.18s;
    }
    .upsell-add-btn:hover:not([disabled]) { background: var(--orange); color: #fff; transform: scale(1.08); }
    .upsell-add-btn:disabled { background: rgba(34,197,94,0.1); color: var(--green); cursor: default; }
    .upsell-add-drink { background: var(--cyan-dim); color: var(--cyan); }
    .upsell-add-drink:hover:not([disabled]) { background: var(--cyan); color: #000; }

    /* ═══════════════════════════════════════════
       BILL CARD (sticky right)
    ═══════════════════════════════════════════ */
    .cart-right { position: sticky; top: 88px; }

    .bill-card {
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      border-radius: 24px;
      padding: 28px;
      transition: border-color 0.3s;
    }
    .bill-card:hover { border-color: rgba(255,255,255,0.18); }

    .bill-header { margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--border); }

    /* Line items */
    .bill-lines { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .bill-line {
      display: flex; justify-content: space-between;
      align-items: baseline; gap: 8px;
    }
    .bl-name { display: flex; align-items: baseline; gap: 6px; flex: 1; min-width: 0; }
    .bl-qty  { color: var(--orange); font-weight: 900; font-size: 0.78rem; flex-shrink: 0; }
    .bl-text { color: var(--text-muted); font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bl-var  { color: var(--text-dim); font-size: 0.7rem; }
    .bl-amt  { font-weight: 700; font-size: 0.82rem; flex-shrink: 0; color: var(--text); }

    .bill-divider { height: 1px; background: var(--border); margin: 14px 0; }

    .bill-row {
      display: flex; justify-content: space-between;
      font-size: 0.8rem; color: var(--text-muted); font-weight: 600;
      margin-bottom: 10px;
    }
    .bill-free-row .free-pill {
      font-size: 0.6rem; font-weight: 800;
      background: rgba(34,197,94,0.1);
      color: var(--green);
      padding: 2px 9px; border-radius: 20px;
      border: 1px solid rgba(34,197,94,0.2);
    }

    /* Grand total */
    .grand-total-row {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid var(--border-h);
      padding-top: 20px; margin: 14px 0 24px;
    }
    .gt-label  { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .gt-amount {
      font-size: 2.4rem; font-weight: 900;
      letter-spacing: -0.05em; color: var(--orange);
      line-height: 1;
    }

    /* Checkout button */
    .checkout-btn {
      width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 16px;
      background: var(--orange); color: #fff;
      border: none; border-radius: 14px;
      font-size: 0.92rem; font-weight: 900;
      cursor: pointer;
      box-shadow: 0 4px 22px var(--orange-glow);
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .checkout-btn:hover:not([disabled]) {
      background: #e55a00;
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(255,102,0,0.45);
    }
    .checkout-disabled {
      background: var(--surface-3) !important;
      color: var(--text-muted) !important;
      box-shadow: none !important; cursor: not-allowed !important;
      transform: none !important;
    }

    .secure-note {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 14px;
      font-size: 0.68rem; font-weight: 700;
      color: var(--text-dim);
      letter-spacing: 0.06em;
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 960px) {
      .cart-layout { grid-template-columns: 1fr; }
      .cart-right {
  position: sticky;
  bottom: 0;
  top: auto;
  z-index: 10;
}
    }
    @media (max-width: 600px) {
      .cart-page  { padding: 88px 0 60px; }
      .cart-shell { padding: 0 16px; }
      .item-card  { flex-direction: column; }
      .item-img   { width: 100%; height: 180px; border-radius: 14px; }
      .item-img-wrap { width: 100%; }
      .upsell-grid { grid-template-columns: 1fr; }
      .ch-title { font-size: 2rem; }
    }
  `],
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  menuService = inject(MenuService);
  router      = inject(Router);

  private toast = inject(ToastService, { optional: true } as any);

  allRecommendations = signal<MenuItem[]>([]);
  allDrinks          = signal<MenuItem[]>([]);
  addedIds           = signal<Set<string>>(new Set());
  removingId         = signal<string>('');
  focusedNote        = '';

  cartItems     = computed(() => this.cartService.cartItems() as any[]);
  computedTotal = computed(() => this.cartService.totalPrice() || 0);

  isDrinksOnly = computed(() => {
    const items = this.cartItems();
    if (items.length === 0) return false;
    return items.every((item: any) => item.category === 'drinks');
  });

  aiPicks = computed(() => {
    const inCart = new Set(this.cartItems().map((i: any) => i._id));
    return this.allRecommendations()
      .filter(r => r.category !== 'drinks' && !inCart.has(r._id))
      .slice(0, 2);
  });

  drinkPicks = computed(() => {
    const inCart = new Set(this.cartItems().map((i: any) => i._id));
    return this.allDrinks()
      .filter(d => !inCart.has(d._id))
      .slice(0, 2);
  });

  ngOnInit() {
    this.menuService.getAiRecommendations().subscribe({
      next: (items) => this.allRecommendations.set(items),
      error: () => {},
    });
    this.menuService.getMenuItems().subscribe({
      next: (items: MenuItem[]) => {
        const drinks = items
          .filter(i => i.category === 'drinks' && i.isAvailable)
          .sort(() => Math.random() - 0.5);
        this.allDrinks.set(drinks);
      },
      error: () => {},
    });
  }

  getUnitPrice(item: any): number { return getUnitPrice(item); }

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

  addUpsell(item: MenuItem, type: 'ai' | 'drink') {
    const variant = item.pricing.type === 'SINGLE' ? 'SINGLE' : 'HALF';
    this.cartService.addToCart(item, variant);
    const key = item._id + 'SINGLE';
    const current = new Set(this.addedIds());
    current.add(key);
    this.addedIds.set(current);
    const msg = type === 'drink' ? `${item.name} added 🥤` : `${item.name} added to cart!`;
    if (this.toast) this.toast.show(msg, 'success');
  }

  removeItem(item: any) {
    const key = item._id + item.selectedVariant;
    this.removingId.set(key);
    setTimeout(() => {
      this.cartService.removeFromCart(item._id, item.selectedVariant);
      this.removingId.set('');
    }, 220);
  }

  clearCart() {
    if (!confirm('Remove all items from your cart?')) return;
    [...this.cartItems()].forEach(item =>
      this.cartService.removeFromCart(item._id, item.selectedVariant)
    );
  }

  goToCheckout() {
    if (this.isDrinksOnly()) {
      if (this.toast) this.toast.show('Please add at least one food item to proceed.', 'error');
      return;
    }
    if (this.cartItems().length === 0) return;
    this.router.navigate(['/checkout']);
  }

  trackItem(_: number, item: any): string { return item._id + item.selectedVariant; }

  handleImageError(event: any) {
    event.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23111'/%3E%3Ctext x='100' y='110' text-anchor='middle' font-size='40' fill='%23333'%3E🍽%3C/text%3E%3C/svg%3E";
  }
}