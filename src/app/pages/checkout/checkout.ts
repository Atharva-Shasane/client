import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="co-root">

      <!-- ══ CLOSED BANNER ═════════════════════════════════════ -->
      <div class="co-closed-banner" *ngIf="isRestaurantClosed()">
        <span>🌙</span>
        <div>
          <strong>Restaurant is closed right now</strong>
          <span>We're open daily from 10:00 AM to 11:00 PM</span>
        </div>
      </div>

      <div class="co-container" [class.co-locked]="isRestaurantClosed()">

        <!-- ══ HEADER ═════════════════════════════════════════════ -->
        <header class="co-header">
          <button class="co-back-btn" (click)="router.navigate(['/cart'])">
            ← Back to Cart
          </button>
          <div>
            <div class="co-eyebrow">Almost there</div>
            <h1 class="co-title">Checkout</h1>
          </div>
        </header>

        <!-- ══ STEPPER ════════════════════════════════════════════ -->
        <div class="co-stepper">
          <div class="co-step" *ngFor="let s of steps; let i = index"
            [class.co-step-active]="currentStep() === i + 1"
            [class.co-step-done]="currentStep() > i + 1">
            <div class="co-step-circle">
              <span *ngIf="currentStep() <= i + 1">{{ i + 1 }}</span>
              <span *ngIf="currentStep() > i + 1">✓</span>
            </div>
            <span class="co-step-label">{{ s }}</span>
            <div class="co-step-line" *ngIf="i < steps.length - 1"></div>
          </div>
        </div>

        <!-- ══ GRID ═══════════════════════════════════════════════ -->
        <div class="co-grid">

          <!-- LEFT: Wizard ────────────────────────────────────── -->
          <div class="co-wizard">

            <!-- ── STEP 1: Dining Style ─────────────────────── -->
            <div class="co-card" *ngIf="currentStep() === 1">
              <h2 class="co-card-title">How are you dining?</h2>

              <div class="co-type-grid">
                <button class="co-type-btn"
                  [class.co-type-selected]="orderType === 'DINE IN'"
                  (click)="setOrderType('DINE IN')">
                  <span class="co-type-icon">🍽️</span>
                  <div class="co-type-info">
                    <span class="co-type-name">Dine In</span>
                    <span class="co-type-desc">Enjoy the full Killa experience</span>
                  </div>
                  <span class="co-radio" [class.co-radio-on]="orderType === 'DINE IN'"></span>
                </button>

                <button class="co-type-btn"
                  [class.co-type-selected]="orderType === 'TAKEAWAY'"
                  (click)="setOrderType('TAKEAWAY')">
                  <span class="co-type-icon">📦</span>
                  <div class="co-type-info">
                    <span class="co-type-name">Takeaway</span>
                    <span class="co-type-desc">Pack it up and take it home</span>
                  </div>
                  <span class="co-radio" [class.co-radio-on]="orderType === 'TAKEAWAY'"></span>
                </button>
              </div>

              <button class="co-btn-next" (click)="goToStep(2)">
                Continue <span>→</span>
              </button>
            </div>

            <!-- ── STEP 2: Details ──────────────────────────── -->
            <div class="co-card" *ngIf="currentStep() === 2">
              <button class="co-link-back" (click)="goToStep(1)">← Dining Style</button>
              <h2 class="co-card-title">
                {{ orderType === 'DINE IN' ? 'Table & Arrival' : 'Pickup Time' }}
              </h2>

              <!-- DINE IN: Guest count ─ -->
              <div class="co-field-group" *ngIf="orderType === 'DINE IN'">
                <label class="co-label">How many guests?</label>
                <div class="co-stepper-input">
                  <button class="co-si-btn" (click)="updateGuests(-1)" [disabled]="numberOfPeople() <= 1">−</button>
                  <span class="co-si-val">{{ numberOfPeople() }}</span>
                  <button class="co-si-btn" (click)="updateGuests(1)" [disabled]="numberOfPeople() >= 48">+</button>
                </div>
                <p class="co-field-hint">
                  {{ requiredTables() }} table{{ requiredTables() > 1 ? 's' : '' }} needed
                  (4 seats each)
                </p>
              </div>

              <!-- Time slot (both types) ─ -->
              <div class="co-field-group">
                <label class="co-label">
                  {{ orderType === 'DINE IN' ? 'Arrival time' : 'Pickup time' }}
                </label>
                <div class="co-time-grid">
                  <button
                    class="co-time-chip"
                    *ngFor="let slot of availableSlots"
                    [class.co-time-selected]="selectedSlot === slot"
                    [class.co-time-past]="isSlotPast(slot)"
                    [disabled]="isSlotPast(slot)"
                    (click)="!isSlotPast(slot) && (selectedSlot = slot)">
                    {{ slot }}
                    <span class="co-slot-past-tag" *ngIf="isSlotPast(slot)">past</span>
                  </button>
                </div>
                <p class="co-field-hint" *ngIf="!selectedSlot || isSlotPast(selectedSlot)" style="color:#ef4444">
                  Please select a future time slot
                </p>
              </div>

              <!-- DINE IN: Table map ─ -->
              <div class="co-field-group" *ngIf="orderType === 'DINE IN'">
                <label class="co-label">
                  Select {{ requiredTables() }} table{{ requiredTables() > 1 ? 's' : '' }}
                  <span class="co-label-hint">({{ selectedTables().length }}/{{ requiredTables() }} selected)</span>
                </label>

                <div class="co-table-map">
                  <div
                    class="co-table"
                    *ngFor="let t of tables"
                    [class.co-table-occupied]="isTableOccupiedAtSlot(t)"
                    [class.co-table-selected]="selectedTables().includes(t)"
                    (click)="toggleTable(t)">
                    <div class="co-table-surface">
                      <!-- chairs -->
                      <div class="co-chair co-chair-top"></div>
                      <div class="co-chair co-chair-bottom"></div>
                      <div class="co-chair co-chair-left"></div>
                      <div class="co-chair co-chair-right"></div>
                      <span class="co-table-num">T{{ t }}</span>
                    </div>
                    <span class="co-table-status">
                      {{ isTableOccupiedAtSlot(t) ? 'Occupied' : selectedTables().includes(t) ? 'Selected' : 'Free' }}
                    </span>
                  </div>
                </div>

                <div class="co-map-legend">
                  <span class="co-leg"><span class="co-leg-dot co-leg-free"></span>Free</span>
                  <span class="co-leg"><span class="co-leg-dot co-leg-selected"></span>Selected</span>
                  <span class="co-leg"><span class="co-leg-dot co-leg-occ"></span>Occupied</span>
                </div>
              </div>

              <!-- Kitchen load ─ -->
              <div class="co-kitchen-bar">
                <div class="co-kb-left">
                  <span class="co-kb-title">Kitchen Status</span>
                  <span class="co-kb-detail">
                    {{ activeOrderCount() }} active orders · ~{{ estimatedWaitTime() }}min wait
                  </span>
                </div>
                <div class="co-kb-dot" [class.co-kb-busy]="activeOrderCount() >= 15"></div>
              </div>

              <button class="co-btn-next"
                [disabled]="!canProceed()"
                (click)="goToStep(3)">
                Continue to Payment <span>→</span>
              </button>
            </div>

            <!-- ── STEP 3: Payment ──────────────────────────── -->
            <div class="co-card" *ngIf="currentStep() === 3">
              <button class="co-link-back" (click)="goToStep(2)">← Details</button>
              <h2 class="co-card-title">Payment Method</h2>

              <div class="co-pay-grid">
                <button class="co-pay-btn"
                  [class.co-pay-selected]="paymentMethod === 'CASH'"
                  (click)="paymentMethod = 'CASH'">
                  <span class="co-pay-icon">💵</span>
                  <div class="co-pay-info">
                    <span class="co-pay-name">Pay at Counter</span>
                    <span class="co-pay-desc">Cash or UPI on arrival</span>
                  </div>
                  <span class="co-radio" [class.co-radio-on]="paymentMethod === 'CASH'"></span>
                </button>

                <button class="co-pay-btn"
                  [class.co-pay-selected]="paymentMethod === 'ONLINE'"
                  (click)="paymentMethod = 'ONLINE'">
                  <span class="co-pay-icon">💳</span>
                  <div class="co-pay-info">
                    <span class="co-pay-name">Pay Online</span>
                    <span class="co-pay-desc">Cards · UPI · Net Banking · Wallets <span class="co-pay-badge">Coming Soon</span></span>
                  </div>
                  <span class="co-radio" [class.co-radio-on]="paymentMethod === 'ONLINE'"></span>
                </button>
              </div>

              <!-- Order summary before confirm -->
              <div class="co-pre-summary">
                <div class="co-ps-row" *ngIf="orderType === 'DINE IN'">
                  <span class="co-ps-lbl">🍽 Service</span>
                  <span class="co-ps-val">Dine In · {{ numberOfPeople() }} guests</span>
                </div>
                <div class="co-ps-row" *ngIf="orderType === 'TAKEAWAY'">
                  <span class="co-ps-lbl">📦 Service</span>
                  <span class="co-ps-val">Takeaway</span>
                </div>
                <div class="co-ps-row" *ngIf="orderType === 'DINE IN' && selectedTables().length">
                  <span class="co-ps-lbl">🪑 Tables</span>
                  <span class="co-ps-val">{{ selectedTables().join(', ') }}</span>
                </div>
                <div class="co-ps-row">
                  <span class="co-ps-lbl">⏰ {{ orderType === 'DINE IN' ? 'Arrives' : 'Pickup' }}</span>
                  <span class="co-ps-val">{{ selectedSlot }}</span>
                </div>
                <div class="co-ps-row co-ps-total">
                  <span class="co-ps-lbl">💰 Total</span>
                  <span class="co-ps-val co-ps-amount">₹{{ cartService.totalPrice() || 0 }}</span>
                </div>
              </div>

              <button class="co-btn-confirm"
                [disabled]="loading()"
                (click)="openConfirmModal()">
                <span class="co-spinner" *ngIf="loading()"></span>
                <span *ngIf="!loading()">Review & Place Order →</span>
              </button>
            </div>

          </div><!-- /wizard -->

          <!-- RIGHT: Order Receipt ─────────────────────────── -->
          <aside class="co-receipt">
            <div class="co-receipt-card">
              <div class="co-receipt-title">Your Order</div>

              <div class="co-receipt-items">
                <div class="co-ri" *ngFor="let item of cartItemsList()">
                  <div class="co-ri-left">
                    <span class="co-ri-qty">{{ item.quantity }}×</span>
                    <div class="co-ri-info">
                      <span class="co-ri-name">{{ item.name }}</span>
                      <span class="co-ri-var"
                        *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'">
                        {{ item.selectedVariant }}
                      </span>
                      <span class="co-ri-note" *ngIf="item.instructions">
                        "{{ item.instructions }}"
                      </span>
                    </div>
                  </div>
                  <span class="co-ri-price">₹{{ item.computedPrice * item.quantity }}</span>
                </div>
              </div>

              <div class="co-receipt-footer">
                <div class="co-rf-row">
                  <span>Subtotal</span>
                  <span>₹{{ cartService.totalPrice() || 0 }}</span>
                </div>
                <div class="co-rf-row co-rf-free">
                  <span>Kitchen Fee</span>
                  <span class="co-free">FREE</span>
                </div>
                <div class="co-rf-total">
                  <span>Total</span>
                  <span class="co-rf-amount">₹{{ cartService.totalPrice() || 0 }}</span>
                </div>
              </div>

              <!-- Booking summary chips -->
              <div class="co-receipt-meta" *ngIf="selectedSlot">
                <div class="co-rm-chip">
                  <span class="co-rm-lbl">Type</span>
                  <span class="co-rm-val">{{ orderType }}</span>
                </div>
                <div class="co-rm-chip" *ngIf="orderType === 'DINE IN'">
                  <span class="co-rm-lbl">Guests</span>
                  <span class="co-rm-val">{{ numberOfPeople() }}</span>
                </div>
                <div class="co-rm-chip">
                  <span class="co-rm-lbl">{{ orderType === 'DINE IN' ? 'Arrival' : 'Pickup' }}</span>
                  <span class="co-rm-val">{{ selectedSlot }}</span>
                </div>
              </div>
            </div>
          </aside>

        </div><!-- /grid -->
      </div><!-- /container -->

    </div><!-- /root -->

    <!-- ══ CONFIRMATION MODAL ════════════════════════════════════ -->
    <div class="co-overlay" *ngIf="showConfirmModal" (click)="closeConfirmModal($event)">
      <div class="co-modal">
        <div class="co-modal-head">
          <div>
            <h2 class="co-modal-title">Confirm Your Order</h2>
            <p class="co-modal-sub">Please review everything before placing</p>
          </div>
          <button class="co-modal-close" (click)="showConfirmModal = false">✕</button>
        </div>

        <div class="co-modal-body">
          <!-- Service details -->
          <div class="co-confirm-section">
            <div class="co-cs-label">Service Details</div>
            <div class="co-cs-grid">
              <div class="co-cs-item">
                <span class="co-cs-icon">{{ orderType === 'DINE IN' ? '🍽️' : '📦' }}</span>
                <div>
                  <div class="co-cs-key">Type</div>
                  <div class="co-cs-val">{{ orderType }}</div>
                </div>
              </div>
              <div class="co-cs-item" *ngIf="orderType === 'DINE IN'">
                <span class="co-cs-icon">👥</span>
                <div>
                  <div class="co-cs-key">Guests</div>
                  <div class="co-cs-val">{{ numberOfPeople() }}</div>
                </div>
              </div>
              <div class="co-cs-item" *ngIf="orderType === 'DINE IN' && selectedTables().length">
                <span class="co-cs-icon">🪑</span>
                <div>
                  <div class="co-cs-key">Tables</div>
                  <div class="co-cs-val">{{ selectedTables().join(', ') }}</div>
                </div>
              </div>
              <div class="co-cs-item">
                <span class="co-cs-icon">⏰</span>
                <div>
                  <div class="co-cs-key">{{ orderType === 'DINE IN' ? 'Arrival' : 'Pickup' }}</div>
                  <div class="co-cs-val">{{ selectedSlot }}</div>
                </div>
              </div>
              <div class="co-cs-item">
                <span class="co-cs-icon">{{ paymentMethod === 'CASH' ? '💵' : '💳' }}</span>
                <div>
                  <div class="co-cs-key">Payment</div>
                  <div class="co-cs-val">{{ paymentMethod === 'CASH' ? 'Pay at Counter' : 'Online (Simulated)' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="co-confirm-section">
            <div class="co-cs-label">Items Ordered</div>
            <div class="co-confirm-items">
              <div class="co-ci" *ngFor="let item of cartItemsList()">
                <div class="co-ci-left">
                  <span class="co-ci-qty">{{ item.quantity }}×</span>
                  <div class="co-ci-info">
                    <span class="co-ci-name">{{ item.name }}</span>
                    <span class="co-ci-var"
                      *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'">
                      ({{ item.selectedVariant }})
                    </span>
                    <div class="co-ci-note" *ngIf="item.instructions">
                      📝 {{ item.instructions }}
                    </div>
                  </div>
                </div>
                <span class="co-ci-price">₹{{ item.computedPrice * item.quantity }}</span>
              </div>
            </div>
            <div class="co-confirm-total">
              <span>Total Amount</span>
              <span class="co-ct-amount">₹{{ cartService.totalPrice() || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="co-modal-footer">
          <button class="co-modal-cancel" (click)="showConfirmModal = false">
            Go Back & Edit
          </button>
          <button class="co-modal-place"
            [disabled]="loading()"
            (click)="handleCheckout()">
            <span class="co-spinner co-spinner-sm" *ngIf="loading()"></span>
            <span *ngIf="!loading()">
              {{ paymentMethod === 'ONLINE' ? '💳 Pay ₹' + (cartService.totalPrice() || 0) : '✓ Place Order' }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ══ PAYMENT PROCESSING OVERLAY ══════════════════════════ -->
    <div class="co-gateway-overlay" *ngIf="showGatewayOverlay">
      <div class="co-gateway-card">
        <div class="co-gw-spinner" *ngIf="gatewayStep === 'processing'"></div>
        <div class="co-gw-icon co-gw-success" *ngIf="gatewayStep === 'success'">✓</div>
        <div class="co-gw-icon co-gw-fail" *ngIf="gatewayStep === 'failed'">✕</div>
        <div class="co-gw-title">
          <span *ngIf="gatewayStep === 'processing'">Processing Payment…</span>
          <span *ngIf="gatewayStep === 'success'">Payment Successful</span>
          <span *ngIf="gatewayStep === 'failed'">Payment Failed</span>
        </div>
        <p class="co-gw-sub">
          <span *ngIf="gatewayStep === 'processing'">Simulating payment — this will be live with Razorpay</span>
          <span *ngIf="gatewayStep === 'success'">Confirming your order…</span>
          <span *ngIf="gatewayStep === 'failed'">Your payment could not be processed</span>
        </p>
        <button class="co-gw-retry" *ngIf="gatewayStep === 'failed'" (click)="retryPayment()">
          Try Again
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --orange:   #ff6600;
      --odim:     rgba(255,102,0,0.12);
      --green:    #22c55e;
      --red:      #ef4444;
      --bg:       #07080a;
      --s1:       #0e0f11;
      --s2:       #161719;
      --s3:       #1d1f22;
      --border:   rgba(255,255,255,0.07);
      --brite:    rgba(255,255,255,0.13);
      --text:     #f0f0f0;
      --muted:    #555;
      font-family: 'DM Sans','Segoe UI',system-ui,sans-serif;
      display: block;
    }

    /* ── Root ──────────────────────────────────────────────── */
    .co-root {
      background: var(--bg);
      min-height: 100vh;
      color: var(--text);
    }

    /* ── Closed banner ─────────────────────────────────────── */
    .co-closed-banner {
      display: flex; align-items: center; gap: 14px;
      background: rgba(239,68,68,0.1); border-bottom: 1px solid rgba(239,68,68,0.25);
      padding: 14px 24px; font-size: 0.85rem;
    }
    .co-closed-banner strong { display: block; font-weight: 800; color: var(--red); }
    .co-closed-banner span:last-child { color: var(--muted); font-size: 0.78rem; }

    .co-locked { opacity: 0.45; pointer-events: none; }

    /* ── Container ─────────────────────────────────────────── */
    .co-container {
      max-width: 1200px; margin: 0 auto;
      padding: 90px 24px 80px;
    }

    /* ── Header ────────────────────────────────────────────── */
    .co-header { display: flex; align-items: flex-end; gap: 20px; margin-bottom: 32px; }
    .co-back-btn {
      background: var(--s2); border: 1px solid var(--border); color: var(--muted);
      padding: 8px 16px; border-radius: 8px; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; transition: color 0.2s; margin-bottom: 4px;
    }
    .co-back-btn:hover { color: var(--text); }
    .co-eyebrow { font-size: 0.62rem; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
    .co-title { font-size: 2.8rem; font-weight: 900; letter-spacing: -2px; margin: 0; line-height: 1; }

    /* ── Stepper ───────────────────────────────────────────── */
    .co-stepper {
      display: flex; align-items: center;
      background: var(--s1); border: 1px solid var(--border); border-radius: 14px;
      padding: 18px 28px; margin-bottom: 32px; gap: 0;
    }
    .co-step {
      display: flex; align-items: center; gap: 10px;
      flex: 1; position: relative;
    }
    .co-step-circle {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 900;
      background: var(--s3); border: 2px solid var(--border); color: var(--muted);
      transition: all 0.3s;
    }
    .co-step-active .co-step-circle {
      border-color: var(--orange); color: var(--orange);
      box-shadow: 0 0 12px rgba(255,102,0,0.25);
    }
    .co-step-done .co-step-circle {
      background: var(--green); border-color: var(--green); color: #000;
    }
    .co-step-label { font-size: 0.72rem; font-weight: 700; color: var(--muted); white-space: nowrap; }
    .co-step-active .co-step-label { color: var(--text); }
    .co-step-done .co-step-label { color: var(--green); }
    .co-step-line { flex: 1; height: 1px; background: var(--border); margin: 0 12px; }

    /* ── Grid ──────────────────────────────────────────────── */
    .co-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }

    /* ── Card ──────────────────────────────────────────────── */
    .co-card {
      background: var(--s1); border: 1px solid var(--border); border-radius: 20px;
      padding: 32px; display: flex; flex-direction: column; gap: 24px;
      animation: co-fadein 0.3s ease;
    }
    @keyframes co-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    .co-card-title { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
    .co-link-back {
      background: none; border: none; color: var(--muted); font-size: 0.75rem;
      font-weight: 700; cursor: pointer; padding: 0; text-align: left;
      transition: color 0.15s;
    }
    .co-link-back:hover { color: var(--orange); }

    /* ── Type buttons ──────────────────────────────────────── */
    .co-type-grid { display: flex; flex-direction: column; gap: 12px; }
    .co-type-btn {
      display: flex; align-items: center; gap: 16px;
      background: var(--s2); border: 2px solid var(--border); border-radius: 14px;
      padding: 18px 20px; cursor: pointer; color: var(--text);
      transition: all 0.2s; text-align: left;
    }
    .co-type-btn:hover { border-color: var(--brite); }
    .co-type-selected { border-color: var(--orange) !important; background: var(--odim) !important; }
    .co-type-icon { font-size: 1.8rem; flex-shrink: 0; }
    .co-type-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .co-type-name { font-size: 1rem; font-weight: 800; }
    .co-type-desc { font-size: 0.75rem; color: var(--muted); }
    .co-radio {
      width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--muted2, #333);
      flex-shrink: 0; transition: all 0.2s;
    }
    .co-radio-on { border-color: var(--orange); border-width: 6px; }

    /* ── Field groups ──────────────────────────────────────── */
    .co-field-group { display: flex; flex-direction: column; gap: 10px; }
    .co-label {
      font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1.5px; color: var(--muted);
      display: flex; align-items: center; gap: 8px;
    }
    .co-label-hint { font-weight: 600; color: var(--orange); text-transform: none; letter-spacing: 0; }
    .co-field-hint { font-size: 0.72rem; color: var(--muted); margin: 0; }

    /* Guest stepper */
    .co-stepper-input {
      display: flex; align-items: center; gap: 0;
      background: var(--s3); border: 1px solid var(--border); border-radius: 12px;
      padding: 4px; width: fit-content;
    }
    .co-si-btn {
      width: 40px; height: 40px; background: var(--s2); border: none; color: var(--text);
      border-radius: 9px; font-size: 1.2rem; font-weight: 800; cursor: pointer;
      transition: background 0.15s;
    }
    .co-si-btn:hover:not([disabled]) { background: var(--orange); }
    .co-si-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .co-si-val { font-size: 1.3rem; font-weight: 900; min-width: 52px; text-align: center; }

    /* Time chips */
    .co-time-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .co-time-chip {
      background: var(--s3); border: 1px solid var(--border); color: var(--muted);
      padding: 7px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; transition: all 0.15s;
    }
    .co-time-chip:hover { color: var(--text); border-color: var(--brite); }
    .co-time-selected { background: var(--odim) !important; border-color: var(--orange) !important; color: var(--orange) !important; }
    .co-time-past {
      opacity: 0.3; cursor: not-allowed !important;
      text-decoration: line-through;
    }
    .co-slot-past-tag {
      font-size: 0.5rem; font-weight: 800; text-transform: uppercase;
      background: var(--s3); padding: 1px 4px; border-radius: 3px;
      margin-left: 3px; vertical-align: middle; letter-spacing: 0.5px;
    }

    /* Table map */
    .co-table-map {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
    }
    .co-table { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
    .co-table-surface {
      width: 100%; aspect-ratio: 1; background: var(--s3);
      border: 2px solid var(--border); border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      position: relative; transition: all 0.2s;
    }
    .co-table:hover:not(.co-table-occupied) .co-table-surface {
      border-color: var(--brite); transform: scale(1.04);
    }
    .co-table-selected .co-table-surface {
      border-color: var(--orange); background: var(--odim);
      box-shadow: 0 0 20px rgba(255,102,0,0.2);
    }
    .co-table-occupied { opacity: 0.35; cursor: not-allowed; }
    .co-table-occupied .co-table-surface { filter: grayscale(1); }
    .co-table-num { font-size: 0.9rem; font-weight: 900; color: var(--muted); z-index: 1; }
    .co-table-selected .co-table-num { color: var(--text); }
    .co-table-status { font-size: 0.58rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .co-table-selected .co-table-status { color: var(--orange); }
    .co-table-occupied .co-table-status { color: var(--red); }

    /* Chairs */
    .co-chair { position: absolute; width: 8px; height: 8px; background: var(--s2); border-radius: 3px; transition: background 0.2s; }
    .co-chair-top    { top: -5px;    left: 50%; transform: translateX(-50%); }
    .co-chair-bottom { bottom: -5px; left: 50%; transform: translateX(-50%); }
    .co-chair-left   { left: -5px;   top: 50%;  transform: translateY(-50%); }
    .co-chair-right  { right: -5px;  top: 50%;  transform: translateY(-50%); }
    .co-table-selected .co-chair { background: var(--orange); }

    .co-map-legend { display: flex; gap: 16px; }
    .co-leg { display: flex; align-items: center; gap: 5px; font-size: 0.65rem; color: var(--muted); font-weight: 700; }
    .co-leg-dot { width: 8px; height: 8px; border-radius: 50%; }
    .co-leg-free     { background: var(--s3); border: 1px solid var(--border); }
    .co-leg-selected { background: var(--orange); }
    .co-leg-occ      { background: var(--red); opacity: 0.5; }

    /* Kitchen bar */
    .co-kitchen-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15);
      border-radius: 12px; padding: 14px 18px;
    }
    .co-kb-left { display: flex; flex-direction: column; gap: 3px; }
    .co-kb-title { font-size: 0.72rem; font-weight: 800; color: var(--green); text-transform: uppercase; letter-spacing: 1px; }
    .co-kb-detail { font-size: 0.78rem; color: var(--muted); }
    .co-kb-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--green); box-shadow: 0 0 10px var(--green); }
    .co-kb-busy { background: var(--red); box-shadow: 0 0 10px var(--red); }

    /* Payment buttons */
    .co-pay-grid { display: flex; flex-direction: column; gap: 12px; }
    .co-pay-btn {
      display: flex; align-items: center; gap: 16px;
      background: var(--s2); border: 2px solid var(--border); border-radius: 14px;
      padding: 18px 20px; cursor: pointer; color: var(--text);
      transition: all 0.2s; text-align: left;
    }
    .co-pay-btn:hover { border-color: var(--brite); }
    .co-pay-selected { border-color: var(--orange) !important; background: var(--odim) !important; }
    .co-pay-icon { font-size: 1.8rem; flex-shrink: 0; }
    .co-pay-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .co-pay-name { font-size: 1rem; font-weight: 800; }
    .co-pay-desc { font-size: 0.72rem; color: var(--muted); }

    /* Pre-summary */
    .co-pre-summary {
      background: var(--s2); border: 1px solid var(--border);
      border-radius: 12px; padding: 16px 18px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .co-ps-row { display: flex; justify-content: space-between; font-size: 0.82rem; }
    .co-ps-lbl { color: var(--muted); font-weight: 600; }
    .co-ps-val { font-weight: 700; }
    .co-ps-total { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 2px; }
    .co-ps-amount { color: var(--orange); font-size: 1.1rem; font-weight: 900; }

    /* Buttons */
    .co-btn-next, .co-btn-confirm {
      width: 100%; padding: 16px; border: none; border-radius: 12px;
      font-size: 0.92rem; font-weight: 900; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity 0.15s, transform 0.15s;
    }
    .co-btn-next { background: var(--s3); color: var(--text); border: 1px solid var(--brite); }
    .co-btn-next:hover { background: var(--s2); }
    .co-btn-confirm { background: var(--orange); color: #fff; }
    .co-btn-confirm:hover:not([disabled]) { opacity: 0.88; transform: translateY(-2px); }
    .co-btn-next:disabled, .co-btn-confirm:disabled {
      opacity: 0.35; cursor: not-allowed; transform: none;
    }
    .co-spinner {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: co-spin 0.7s linear infinite; display: inline-block;
    }
    .co-spinner-sm { width: 16px; height: 16px; border-width: 2px; }
    @keyframes co-spin { to { transform: rotate(360deg); } }

    /* ── Receipt ───────────────────────────────────────────── */
    .co-receipt { position: sticky; top: 90px; }
    .co-receipt-card {
      background: var(--s1); border: 1px solid var(--brite);
      border-radius: 20px; padding: 24px;
    }
    .co-receipt-title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin-bottom: 18px; }
    .co-receipt-items { display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow-y: auto; margin-bottom: 18px; }
    .co-ri { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-size: 0.82rem; }
    .co-ri-left { display: flex; gap: 8px; flex: 1; min-width: 0; }
    .co-ri-qty { color: var(--orange); font-weight: 800; flex-shrink: 0; width: 22px; }
    .co-ri-info { display: flex; flex-direction: column; gap: 2px; }
    .co-ri-name { font-weight: 600; color: #ddd; }
    .co-ri-var { font-size: 0.65rem; color: var(--muted); background: var(--s3); padding: 1px 6px; border-radius: 4px; display: inline-block; }
    .co-ri-note { font-size: 0.68rem; color: #facc15; font-style: italic; }
    .co-ri-price { font-weight: 700; flex-shrink: 0; }
    .co-receipt-footer { border-top: 1px dashed var(--border); padding-top: 14px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .co-rf-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--muted); }
    .co-rf-free .co-free { font-size: 0.65rem; font-weight: 800; background: rgba(34,197,94,0.12); color: var(--green); padding: 2px 7px; border-radius: 4px; }
    .co-rf-total { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.85rem; font-weight: 800; }
    .co-rf-amount { font-size: 1.8rem; font-weight: 900; color: var(--orange); letter-spacing: -1px; }
    .co-receipt-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .co-rm-chip { background: var(--s2); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
    .co-rm-lbl { display: block; font-size: 0.58rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 3px; }
    .co-rm-val { font-size: 0.82rem; font-weight: 700; }

    /* ── Confirm Modal ─────────────────────────────────────── */
    .co-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px); z-index: 9999;
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .co-modal {
      background: var(--s1); border: 1px solid var(--brite); border-radius: 20px;
      width: 100%; max-width: 560px; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 30px 60px rgba(0,0,0,0.6);
      animation: co-fadein 0.25s ease;
    }
    .co-modal-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 22px 24px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .co-modal-title { font-size: 1.2rem; font-weight: 900; margin: 0 0 3px; }
    .co-modal-sub { font-size: 0.75rem; color: var(--muted); margin: 0; }
    .co-modal-close {
      background: var(--s3); border: 1px solid var(--border); color: var(--muted);
      width: 30px; height: 30px; border-radius: 7px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
    }
    .co-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; }
    .co-confirm-section { display: flex; flex-direction: column; gap: 12px; }
    .co-cs-label { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); }
    .co-cs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .co-cs-item {
      display: flex; align-items: center; gap: 10px;
      background: var(--s2); border: 1px solid var(--border);
      border-radius: 10px; padding: 12px 14px;
    }
    .co-cs-icon { font-size: 1.2rem; flex-shrink: 0; }
    .co-cs-key { font-size: 0.62rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .co-cs-val { font-size: 0.88rem; font-weight: 800; }
    .co-confirm-items { display: flex; flex-direction: column; gap: 10px; max-height: 220px; overflow-y: auto; }
    .co-ci { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 12px; background: var(--s2); border-radius: 9px; border: 1px solid var(--border); }
    .co-ci-left { display: flex; gap: 10px; flex: 1; min-width: 0; }
    .co-ci-qty { font-weight: 900; color: var(--orange); font-size: 0.95rem; flex-shrink: 0; }
    .co-ci-info { display: flex; flex-direction: column; gap: 3px; }
    .co-ci-name { font-weight: 700; font-size: 0.88rem; }
    .co-ci-var { font-size: 0.65rem; color: var(--muted); }
    .co-ci-note { font-size: 0.7rem; color: #facc15; font-style: italic; }
    .co-ci-price { font-weight: 800; flex-shrink: 0; font-size: 0.88rem; }
    .co-confirm-total {
      display: flex; justify-content: space-between; align-items: baseline;
      border-top: 1px solid var(--border); padding-top: 12px;
      font-size: 0.85rem; font-weight: 800;
    }
    .co-ct-amount { font-size: 1.5rem; font-weight: 900; color: var(--orange); }

    .co-modal-footer {
      display: flex; gap: 12px; padding: 18px 24px;
      border-top: 1px solid var(--border); flex-shrink: 0;
    }
    .co-modal-cancel {
      flex: 1; padding: 14px; background: var(--s3); border: 1px solid var(--border);
      color: var(--muted); border-radius: 10px; font-weight: 800; cursor: pointer;
      font-size: 0.85rem; transition: color 0.15s;
    }
    .co-modal-cancel:hover { color: var(--text); }
    .co-modal-place {
      flex: 2; padding: 14px; background: var(--orange); color: #fff;
      border: none; border-radius: 10px; font-weight: 900; cursor: pointer;
      font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
      gap: 8px; transition: opacity 0.15s;
    }
    .co-modal-place:hover:not([disabled]) { opacity: 0.88; }
    .co-modal-place:disabled { background: var(--s3); color: var(--muted); cursor: not-allowed; }

    /* ── Gateway overlay ───────────────────────────────────── */
    .co-gateway-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95);
      backdrop-filter: blur(12px); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    }
    .co-gateway-card {
      background: var(--s1); border: 1px solid var(--brite); border-radius: 20px;
      padding: 48px 40px; text-align: center; max-width: 380px; width: 90%;
    }
    .co-gw-spinner {
      width: 52px; height: 52px; border: 4px solid var(--s3);
      border-top-color: var(--orange); border-radius: 50%;
      animation: co-spin 0.8s linear infinite; margin: 0 auto 20px;
    }
    .co-gw-icon {
      width: 52px; height: 52px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 900; margin: 0 auto 20px;
    }
    .co-gw-success { background: var(--green); color: #000; }
    .co-gw-fail    { background: var(--red); color: #fff; }
    .co-gw-title { font-size: 1.2rem; font-weight: 900; margin-bottom: 8px; }
    .co-gw-sub { font-size: 0.82rem; color: var(--muted); margin: 0 0 20px; }
    .co-gw-retry {
      background: var(--orange); color: #fff; border: none; padding: 12px 28px;
      border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.88rem;
    }

    /* ── Responsive ────────────────────────────────────────── */
    @media (max-width: 960px) {
      .co-grid { grid-template-columns: 1fr; }
      .co-receipt { position: static; order: -1; }
      .co-stepper { padding: 14px 16px; gap: 0; }
      .co-step-label { display: none; }
    }

    .co-pay-badge {
      display: inline-block; font-size: 0.55rem; font-weight: 800;
      background: rgba(245,158,11,0.15); color: #f59e0b;
      border: 1px solid rgba(245,158,11,0.3);
      padding: 1px 6px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-left: 4px; vertical-align: middle;
    }

    @media (max-width: 600px) {
      .co-container { padding: 80px 16px 60px; }
      .co-title { font-size: 2rem; }
      .co-card { padding: 22px 18px; }
      .co-table-map { grid-template-columns: repeat(3, 1fr); }
      .co-cs-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CheckoutComponent implements OnInit {
  cartService  = inject(CartService);
  orderService = inject(OrderService);
  router       = inject(Router);
  toast        = inject(ToastService);
  cdr          = inject(ChangeDetectorRef);

  // ── Wizard state ─────────────────────────────────────────────────────
  currentStep    = signal(1);
  orderType: 'DINE IN' | 'TAKEAWAY' = 'DINE IN';
  paymentMethod: 'CASH' | 'ONLINE'  = 'CASH';
  numberOfPeople = signal(1);
  selectedSlot   = '';
  selectedTables = signal<number[]>([]);
  loading        = signal(false);

  // ── Modal / gateway state ────────────────────────────────────────────
  showConfirmModal   = false;
  showGatewayOverlay = false;
  gatewayStep: 'processing' | 'success' | 'failed' = 'processing';

  // ── Kitchen status ───────────────────────────────────────────────────
  activeOrderCount = signal(0);
  occupiedTables   = signal<number[]>([]);

  // ── Static data ──────────────────────────────────────────────────────
  readonly tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly steps  = ['Dining Style', 'Details', 'Payment'];
  availableSlots: string[] = [];

  // Stores the payment transaction ID (simulated now, real Razorpay ID later)
  private razorpayPaymentId = '';

  // ── Computed ─────────────────────────────────────────────────────────
  cartItemsList   = computed(() => this.cartService.cartItems());
  requiredTables  = computed(() => Math.ceil(this.numberOfPeople() / 4));
  estimatedWaitTime = computed(() => 15 + this.activeOrderCount() * 3);

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit() {
    if (this.cartItemsList().length === 0) {
      this.toast.error('Your cart is empty.');
      this.router.navigate(['/cart']);
      return;
    }
    const containsFood = this.cartItemsList().some(i => i.category !== 'drinks');
    if (!containsFood) {
      this.toast.error('Add at least one food item before checkout.');
      this.router.navigate(['/cart']);
      return;
    }
    this.generateTimeSlots();
    // Auto-select the first slot that is at least 15 min in the future
    const firstFuture = this.availableSlots.find(s => !this.isSlotPast(s));
    this.selectedSlot = firstFuture || this.availableSlots[0] || '';
    this.fetchKitchenStatus();
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  isRestaurantClosed(): boolean {
    const h = new Date().getHours();
    return h < 10 || h >= 23; // 10 AM – 11 PM
  }

  generateTimeSlots() {
    // Restaurant open: 10:00 AM to 11:00 PM (last order slot 10:30 PM).
    // Show ALL slots for the full operating day — h=10 to h=22 gives
    // 10:00 AM, 10:30 AM … 10:00 PM, 10:30 PM (last call before 11 PM close).
    // We do NOT filter past slots here — we mark them disabled in the template
    // so users can always see the full day at a glance.
    const slots: string[] = [];
    for (let h = 10; h <= 22; h++) {
      for (const m of [0, 30]) {
        // h=12 m=0 → "12:00 PM", h=13 → "1:00 PM", h=10 → "10:00 AM"
        const displayH = h === 12 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        slots.push(`${displayH}:${m === 0 ? '00' : '30'} ${ampm}`);
      }
    }
    this.availableSlots = slots; // 26 slots: 10:00 AM … 10:30 PM
  }

  /** Returns true if a time slot is in the past (can't book it). */
  isSlotPast(slot: string): boolean {
    const slotDate = this.slotToDate(slot);
    // Require at least 15 min in advance
    return slotDate.getTime() < Date.now() + 15 * 60 * 1000;
  }

  fetchKitchenStatus() {
    this.orderService.getKitchenStatus().subscribe({
      next: (res) => {
        this.activeOrderCount.set(res.activeOrders || 0);
        this.occupiedTables.set(res.occupiedTables || []);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  /**
   * Table occupied check: a table is occupied if it's in the server's
   * occupiedTables list (active orders not yet COMPLETED).
   * The server's /status/volume returns tables with active orders in the
   * last 12 hours — covers the time-window requirement.
   */
  isTableOccupiedAtSlot(t: number): boolean {
    return this.occupiedTables().includes(t);
  }

  setOrderType(type: 'DINE IN' | 'TAKEAWAY') {
    this.orderType = type;
    this.selectedTables.set([]);
  }

  toggleTable(t: number) {
    if (this.isTableOccupiedAtSlot(t)) return;
    let curr = [...this.selectedTables()];
    if (curr.includes(t)) {
      curr = curr.filter(x => x !== t);
    } else {
      if (curr.length < this.requiredTables()) {
        curr.push(t);
      } else {
        curr.shift();
        curr.push(t);
      }
    }
    this.selectedTables.set(curr);
  }

  updateGuests(delta: number) {
    const n = this.numberOfPeople() + delta;
    if (n >= 1 && n <= 48) {
      this.numberOfPeople.set(n);
      this.selectedTables.set([]); // reset — required count changed
    }
  }

  canProceed(): boolean {
    if (!this.selectedSlot) return false;
    // Disallow proceeding if the selected slot is already past
    if (this.isSlotPast(this.selectedSlot)) return false;
    if (this.orderType === 'TAKEAWAY') return true;
    return this.selectedTables().length === this.requiredTables();
  }

  goToStep(n: number) {
    if (this.isRestaurantClosed()) {
      this.toast.error('Restaurant is currently closed. Open 10 AM – 11 PM.');
      return;
    }
    this.currentStep.set(n);
    // Re-fetch occupied tables every time user reaches step 2
    // so the map reflects bookings made by other users since page load.
    if (n === 2) this.fetchKitchenStatus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openConfirmModal() {
    this.showConfirmModal = true;
  }

  closeConfirmModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('co-overlay')) {
      this.showConfirmModal = false;
    }
  }

  // ── Payment simulation (replace this block with real Razorpay when ready) ──
  //
  // TO INTEGRATE RAZORPAY LATER:
  //   1. Create account at https://dashboard.razorpay.com
  //   2. npm install razorpay  (server) + add SDK script to index.html
  //   3. Replace simulateOnlinePayment() below with the real openRazorpay()
  //   4. Add server-side signature verification before creating the order
  //
  private simulateOnlinePayment(): Promise<{ paymentId: string; success: boolean }> {
    // Generates a fake transaction ID in the same format Razorpay uses.
    // This keeps the full payment flow working (order stored with transactionId)
    // so when you plug in the real gateway nothing else needs to change.
    return new Promise(resolve => {
      setTimeout(() => {
        const fakeId = 'pay_SIM_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
        resolve({ paymentId: fakeId, success: true });
      }, 2000); // 2s delay simulates network round-trip
    });
  }

  // ── Main checkout handler ─────────────────────────────────────────────
  async handleCheckout() {
    this.showConfirmModal = false;

    if (this.paymentMethod === 'ONLINE') {
      // Show our overlay while Razorpay loads
      this.showGatewayOverlay = true;
      this.gatewayStep = 'processing';
      this.cdr.detectChanges();

      const result = await this.simulateOnlinePayment();

      if (!result.success) {
        // Payment failed or dismissed
        this.gatewayStep = 'failed';
        this.cdr.detectChanges();
        return; // Don't place order
      }

      // Payment succeeded
      this.razorpayPaymentId = result.paymentId;
      this.gatewayStep = 'success';
      this.cdr.detectChanges();

      // Brief success display then place order
      await new Promise(r => setTimeout(r, 1200));
      this.showGatewayOverlay = false;
      this.placeOrder('PAID', this.razorpayPaymentId);

    } else {
      // Cash — place order directly
      this.placeOrder('PENDING', '');
    }
  }

  retryPayment() {
    this.showGatewayOverlay = false;
    this.gatewayStep = 'processing';
    this.showConfirmModal = true; // send back to confirmation
    this.cdr.detectChanges();
  }

  // ── Order creation ────────────────────────────────────────────────────
  private placeOrder(paymentStatus: string, transactionId: string) {
    this.loading.set(true);

    // Convert slot string back to a full Date for scheduledTime
    const scheduledTime = this.slotToDate(this.selectedSlot);

    const payload = {
      // Server route reads: diningStyle → maps to orderType enum
      diningStyle:    this.orderType,
      orderType:      this.orderType,          // belt-and-suspenders
      numberOfPeople: this.numberOfPeople(),
      tableNumbers:   this.selectedTables(),
      scheduledTime:  scheduledTime.toISOString(),
      paymentMethod:  this.paymentMethod,
      paymentStatus:  paymentStatus,
      transactionId:  transactionId,           // linked Razorpay ID
      totalAmount:    Number(this.cartService.totalPrice()) || 0,
      items: this.cartItemsList().map((item: any) => ({
        menuItemId:   item._id || item.menuItemId,
        name:         item.name         || 'Item',
        category:     item.category     || 'General',
        quantity:     Number(item.quantity)      || 1,
        variant:      item.selectedVariant       || 'SINGLE',
        unitPrice:    Number(item.computedPrice) || 0,
        instructions: item.instructions          || '',
      })),
    };

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.loading.set(false);
        this.toast.success('Order placed successfully! 🎉');
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.msg || 'Failed to place order. Please try again.');
        // If online payment succeeded but order failed — inform user
        if (this.paymentMethod === 'ONLINE' && transactionId) {
          this.toast.error(
            `Payment was charged (ID: ${transactionId}) but order failed. Contact us for a refund.`
          );
        }
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Converts a slot string like "2:30 PM" or "10:00 AM" to a full Date today.
   * Handles all AM/PM edge cases correctly:
   *   12:00 AM → 0:00 (midnight)
   *   12:30 AM → 0:30
   *   12:00 PM → 12:00 (noon)
   *    1:00 PM → 13:00
   *   10:00 AM → 10:00
   */
  private slotToDate(slot: string): Date {
    if (!slot) return new Date();
    const parts = slot.trim().split(' ');
    if (parts.length < 2) return new Date();
    const [timePart, ampm] = parts;
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
}