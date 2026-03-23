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
    <div class="co-page">

      <!-- ── Ambient background ── -->
      <div class="co-bg">
        <div class="co-blob blob-1"></div>
        <div class="co-blob blob-2"></div>
        <div class="co-grain"></div>
      </div>

      <!-- ══════════════════════════════════
           RESTAURANT CLOSED BANNER
      ══════════════════════════════════ -->
      <div class="closed-banner" *ngIf="isRestaurantClosed()">
        <div class="cb-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <div>
          <p class="cb-title">Restaurant is currently closed</p>
          <p class="cb-sub">We're open daily from 10:00 AM to 11:00 PM. Come back soon!</p>
        </div>
      </div>

      <!-- ══════════════════════════════════
           MAIN CONTAINER
      ══════════════════════════════════ -->
      <div class="co-shell" [class.co-locked]="isRestaurantClosed()">

        <!-- Header -->
        <header class="co-header">
          <button class="back-btn" (click)="router.navigate(['/cart'])">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Back to Cart
          </button>
          <div class="co-heading">
            <p class="co-eyebrow">
              <span class="eyebrow-dot"></span>
              Almost There
            </p>
            <h1 class="co-title">Check<span class="accent">out</span></h1>
          </div>
        </header>

        <!-- ── STEPPER ── -->
        <div class="stepper">
          <div class="stepper-track">
            <div
              class="step"
              *ngFor="let s of steps; let i = index"
              [class.step-active]="currentStep() === i + 1"
              [class.step-done]="currentStep() > i + 1">
              <div class="step-circle">
                <svg *ngIf="currentStep() > i + 1" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span *ngIf="currentStep() <= i + 1">{{ i + 1 }}</span>
              </div>
              <span class="step-label">{{ s }}</span>
              <div class="step-connector" *ngIf="i < steps.length - 1"
                [class.connector-done]="currentStep() > i + 1">
              </div>
            </div>
          </div>
        </div>

        <!-- ── TWO-COLUMN GRID ── -->
        <div class="co-grid">

          <!-- ════════════════════════════
               LEFT: WIZARD
          ════════════════════════════ -->
          <div class="wizard">

            <!-- ─── STEP 1: Dining Style ─── -->
            <div class="wizard-card" *ngIf="currentStep() === 1">
              <div class="wc-header">
                <div class="section-label">
                  <span class="label-dot orange-dot"></span>
                  Step 1 of 3
                </div>
                <h2 class="wc-title">How are you dining?</h2>
              </div>

              <div class="type-grid">
                <!-- Dine In -->
                <button class="type-btn" [class.type-selected]="orderType === 'DINE IN'" (click)="setOrderType('DINE IN')">
                  <div class="type-icon-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
                  </div>
                  <div class="type-info">
                    <span class="type-name">Dine In</span>
                    <span class="type-desc">Enjoy the full Killa experience</span>
                  </div>
                  <div class="type-radio" [class.radio-on]="orderType === 'DINE IN'"></div>
                </button>

                <!-- Takeaway -->
                <button class="type-btn" [class.type-selected]="orderType === 'TAKEAWAY'" (click)="setOrderType('TAKEAWAY')">
                  <div class="type-icon-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  </div>
                  <div class="type-info">
                    <span class="type-name">Takeaway</span>
                    <span class="type-desc">Pack it up and take it home</span>
                  </div>
                  <div class="type-radio" [class.radio-on]="orderType === 'TAKEAWAY'"></div>
                </button>
              </div>

              <button class="btn-next" (click)="goToStep(2)">
                <span>Continue</span>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>

            <!-- ─── STEP 2: Details ─── -->
            <div class="wizard-card" *ngIf="currentStep() === 2">
              <div class="wc-header">
                <button class="link-back" (click)="goToStep(1)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 6H3M5 4L3 6l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Dining Style
                </button>
                <div class="section-label" style="margin-top:10px">
                  <span class="label-dot orange-dot"></span>
                  Step 2 of 3
                </div>
                <h2 class="wc-title">{{ orderType === 'DINE IN' ? 'Table & Arrival' : 'Pickup Time' }}</h2>
              </div>

              <!-- Guest count (dine in only) -->
              <div class="field-group" *ngIf="orderType === 'DINE IN'">
                <label class="field-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  How many guests?
                </label>
                <div class="guest-stepper">
                  <button class="gs-btn" (click)="updateGuests(-1)" [disabled]="numberOfPeople() <= 1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  </button>
                  <span class="gs-num">{{ numberOfPeople() }}</span>
                  <button class="gs-btn" (click)="updateGuests(1)" [disabled]="numberOfPeople() >= 48">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  </button>
                </div>
                <p class="field-hint">
                  {{ requiredTables() }} table{{ requiredTables() > 1 ? 's' : '' }} needed · 4 seats each
                </p>
              </div>

              <!-- Time slots -->
              <div class="field-group">
                <label class="field-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ orderType === 'DINE IN' ? 'Arrival time' : 'Pickup time' }}
                </label>
                <div class="time-grid">
                  <button
                    class="time-chip"
                    *ngFor="let slot of availableSlots"
                    [class.chip-selected]="selectedSlot === slot"
                    [class.chip-past]="isSlotPast(slot)"
                    [disabled]="isSlotPast(slot)"
                    (click)="!isSlotPast(slot) && (selectedSlot = slot)">
                    {{ slot }}
                    <span class="past-tag" *ngIf="isSlotPast(slot)">past</span>
                  </button>
                </div>
                <p class="field-hint warn-hint" *ngIf="!selectedSlot || isSlotPast(selectedSlot)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Please select a future time slot
                </p>
              </div>

              <!-- Table map (dine in only) -->
              <div class="field-group" *ngIf="orderType === 'DINE IN'">
                <label class="field-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  Select {{ requiredTables() }} table{{ requiredTables() > 1 ? 's' : '' }}
                  <span class="label-count">({{ selectedTables().length }}/{{ requiredTables() }} selected)</span>
                </label>

                <div class="table-map">
                  <div
                    class="table-cell"
                    *ngFor="let t of tables"
                    [class.table-occupied]="isTableOccupiedAtSlot(t)"
                    [class.table-selected]="selectedTables().includes(t)"
                    (click)="toggleTable(t)">
                    <div class="table-top">
                      <div class="chair chair-tl"></div>
                      <div class="chair chair-tr"></div>
                    </div>
                    <div class="table-body">
                      <span class="table-num">T{{ t }}</span>
                    </div>
                    <div class="table-bottom">
                      <div class="chair chair-bl"></div>
                      <div class="chair chair-br"></div>
                    </div>
                    <span class="table-status-label">
                      {{ isTableOccupiedAtSlot(t) ? 'Occupied' : selectedTables().includes(t) ? 'Yours' : 'Free' }}
                    </span>
                  </div>
                </div>

                <div class="map-legend">
                  <span class="leg-item"><span class="leg-pip pip-free"></span>Free</span>
                  <span class="leg-item"><span class="leg-pip pip-selected"></span>Selected</span>
                  <span class="leg-item"><span class="leg-pip pip-occ"></span>Occupied</span>
                </div>
              </div>

              <!-- Kitchen status bar -->
              <div class="kitchen-bar" [class.kitchen-busy]="activeOrderCount() >= 15">
                <div class="kb-left">
                  <div class="kb-dot-wrap">
                    <span class="kb-pulse-dot" [class.dot-busy]="activeOrderCount() >= 15"></span>
                  </div>
                  <div>
                    <p class="kb-title">{{ activeOrderCount() >= 15 ? 'Kitchen Busy' : 'Kitchen Ready' }}</p>
                    <p class="kb-detail">{{ activeOrderCount() }} active orders · ~{{ estimatedWaitTime() }} min estimated wait</p>
                  </div>
                </div>
              </div>

              <button class="btn-next" [disabled]="!canProceed()" (click)="goToStep(3)">
                <span>Continue to Payment</span>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>

            <!-- ─── STEP 3: Payment ─── -->
            <div class="wizard-card" *ngIf="currentStep() === 3">
              <div class="wc-header">
                <button class="link-back" (click)="goToStep(2)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 6H3M5 4L3 6l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Details
                </button>
                <div class="section-label" style="margin-top:10px">
                  <span class="label-dot orange-dot"></span>
                  Step 3 of 3
                </div>
                <h2 class="wc-title">Payment Method</h2>
              </div>

              <div class="pay-grid">
                <!-- Cash -->
                <button class="pay-btn" [class.pay-selected]="paymentMethod === 'CASH'" (click)="paymentMethod = 'CASH'">
                  <div class="pay-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>
                  </div>
                  <div class="pay-info">
                    <span class="pay-name">Pay at Counter</span>
                    <span class="pay-desc">Cash or UPI on arrival</span>
                  </div>
                  <div class="type-radio" [class.radio-on]="paymentMethod === 'CASH'"></div>
                </button>

                <!-- Online -->
                <button class="pay-btn" [class.pay-selected]="paymentMethod === 'ONLINE'" (click)="paymentMethod = 'ONLINE'">
                  <div class="pay-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <div class="pay-info">
                    <span class="pay-name">Pay Online</span>
                    <span class="pay-desc">Cards · UPI · Net Banking <span class="coming-soon-badge">Coming Soon</span></span>
                  </div>
                  <div class="type-radio" [class.radio-on]="paymentMethod === 'ONLINE'"></div>
                </button>
              </div>

              <!-- Pre-confirm summary -->
              <div class="pre-summary">
                <div class="ps-row" *ngIf="orderType === 'DINE IN'">
                  <span class="ps-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
                    Service
                  </span>
                  <span class="ps-val">Dine In · {{ numberOfPeople() }} guests</span>
                </div>
                <div class="ps-row" *ngIf="orderType === 'TAKEAWAY'">
                  <span class="ps-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                    Service
                  </span>
                  <span class="ps-val">Takeaway</span>
                </div>
                <div class="ps-row" *ngIf="orderType === 'DINE IN' && selectedTables().length">
                  <span class="ps-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    Tables
                  </span>
                  <span class="ps-val">{{ selectedTables().join(', ') }}</span>
                </div>
                <div class="ps-row">
                  <span class="ps-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ orderType === 'DINE IN' ? 'Arrival' : 'Pickup' }}
                  </span>
                  <span class="ps-val">{{ selectedSlot }}</span>
                </div>
                <div class="ps-row ps-total">
                  <span class="ps-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Total
                  </span>
                  <span class="ps-amount">₹{{ cartService.totalPrice() || 0 }}</span>
                </div>
              </div>

              <button class="btn-confirm" [disabled]="loading()" (click)="openConfirmModal()">
                <span class="co-spinner" *ngIf="loading()"></span>
                <span *ngIf="!loading()">Review &amp; Place Order</span>
                <svg *ngIf="!loading()" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>

          </div><!-- /wizard -->

          <!-- ════════════════════════════
               RIGHT: RECEIPT CARD
          ════════════════════════════ -->
          <aside class="receipt-col">
            <div class="receipt-card">

              <div class="section-label" style="margin-bottom:18px">
                <span class="label-dot"></span>
                Your Order
              </div>

              <!-- Items list -->
              <div class="receipt-items">
                <div class="ri" *ngFor="let item of cartItemsList()">
                  <div class="ri-left">
                    <span class="ri-qty">{{ item.quantity }}×</span>
                    <div class="ri-info">
                      <span class="ri-name">{{ item.name }}</span>
                      <span class="ri-var" *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'">
                        {{ item.selectedVariant }}
                      </span>
                      <span class="ri-note" *ngIf="item.instructions">"{{ item.instructions }}"</span>
                    </div>
                  </div>
                  <span class="ri-price">₹{{ item.computedPrice * item.quantity }}</span>
                </div>
              </div>

              <div class="receipt-divider"></div>

              <!-- Totals -->
              <div class="receipt-row">
                <span>Subtotal</span>
                <span>₹{{ cartService.totalPrice() || 0 }}</span>
              </div>
              <div class="receipt-row receipt-free">
                <span>Kitchen Fee</span>
                <span class="free-pill">FREE</span>
              </div>

              <div class="receipt-grand">
                <span class="rg-label">Total</span>
                <span class="rg-amount">₹{{ cartService.totalPrice() || 0 }}</span>
              </div>

              <!-- Booking chips -->
              <div class="receipt-chips" *ngIf="selectedSlot">
                <div class="r-chip">
                  <span class="rc-label">Type</span>
                  <span class="rc-val">{{ orderType }}</span>
                </div>
                <div class="r-chip" *ngIf="orderType === 'DINE IN'">
                  <span class="rc-label">Guests</span>
                  <span class="rc-val">{{ numberOfPeople() }}</span>
                </div>
                <div class="r-chip">
                  <span class="rc-label">{{ orderType === 'DINE IN' ? 'Arrival' : 'Pickup' }}</span>
                  <span class="rc-val">{{ selectedSlot }}</span>
                </div>
                <div class="r-chip" *ngIf="orderType === 'DINE IN' && selectedTables().length">
                  <span class="rc-label">Tables</span>
                  <span class="rc-val">T{{ selectedTables().join(', T') }}</span>
                </div>
              </div>

              <!-- Secure note -->
              <div class="secure-note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Secured by KillaPay
              </div>

            </div>
          </aside>

        </div><!-- /co-grid -->
      </div><!-- /co-shell -->
    </div><!-- /co-page -->

    <!-- ══════════════════════════════════
         CONFIRMATION MODAL
    ══════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="showConfirmModal" (click)="closeConfirmModal($event)">
      <div class="modal-box">

        <div class="modal-head">
          <div>
            <h2 class="modal-title">Confirm Your Order</h2>
            <p class="modal-sub">Review everything before placing</p>
          </div>
          <button class="modal-close-btn" (click)="showConfirmModal = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Service details -->
          <div class="confirm-section">
            <p class="cs-heading">
              <span class="label-dot orange-dot" style="display:inline-block"></span>
              Service Details
            </p>
            <div class="cs-grid">
              <div class="cs-tile">
                <div class="cs-tile-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
                </div>
                <div>
                  <p class="cs-key">Type</p>
                  <p class="cs-val">{{ orderType }}</p>
                </div>
              </div>
              <div class="cs-tile" *ngIf="orderType === 'DINE IN'">
                <div class="cs-tile-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p class="cs-key">Guests</p>
                  <p class="cs-val">{{ numberOfPeople() }}</p>
                </div>
              </div>
              <div class="cs-tile" *ngIf="orderType === 'DINE IN' && selectedTables().length">
                <div class="cs-tile-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                <div>
                  <p class="cs-key">Tables</p>
                  <p class="cs-val">{{ selectedTables().join(', ') }}</p>
                </div>
              </div>
              <div class="cs-tile">
                <div class="cs-tile-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p class="cs-key">{{ orderType === 'DINE IN' ? 'Arrival' : 'Pickup' }}</p>
                  <p class="cs-val">{{ selectedSlot }}</p>
                </div>
              </div>
              <div class="cs-tile">
                <div class="cs-tile-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <p class="cs-key">Payment</p>
                  <p class="cs-val">{{ paymentMethod === 'CASH' ? 'Pay at Counter' : 'Online' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Items ordered -->
          <div class="confirm-section">
            <p class="cs-heading">
              <span class="label-dot" style="display:inline-block"></span>
              Items Ordered
            </p>
            <div class="confirm-items">
              <div class="ci-row" *ngFor="let item of cartItemsList()">
                <div class="ci-left">
                  <span class="ci-qty">{{ item.quantity }}×</span>
                  <div class="ci-info">
                    <span class="ci-name">{{ item.name }}</span>
                    <span class="ci-var" *ngIf="item.selectedVariant && item.selectedVariant !== 'SINGLE'">({{ item.selectedVariant }})</span>
                    <span class="ci-note" *ngIf="item.instructions">📝 {{ item.instructions }}</span>
                  </div>
                </div>
                <span class="ci-price">₹{{ item.computedPrice * item.quantity }}</span>
              </div>
            </div>
            <div class="confirm-total">
              <span>Total Amount</span>
              <span class="ct-amount">₹{{ cartService.totalPrice() || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="modal-foot">
          <button class="modal-back-btn" (click)="showConfirmModal = false">
            Go Back &amp; Edit
          </button>
          <button class="modal-place-btn" [disabled]="loading()" (click)="handleCheckout()">
            <span class="co-spinner co-spinner-sm" *ngIf="loading()"></span>
            <span *ngIf="!loading()">
              {{ paymentMethod === 'ONLINE' ? 'Pay ₹' + (cartService.totalPrice() || 0) : 'Place Order' }}
            </span>
            <svg *ngIf="!loading()" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════
         PAYMENT GATEWAY OVERLAY
    ══════════════════════════════════ -->
    <div class="gateway-overlay" *ngIf="showGatewayOverlay">
      <div class="gateway-card">
        <div class="gw-bg-blob"></div>
        <!-- Processing -->
        <div class="gw-spinner-wrap" *ngIf="gatewayStep === 'processing'">
          <div class="gw-ring"></div>
        </div>
        <!-- Success -->
        <div class="gw-status-icon gw-success" *ngIf="gatewayStep === 'success'">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l7 7L23 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <!-- Failed -->
        <div class="gw-status-icon gw-fail" *ngIf="gatewayStep === 'failed'">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M6 6l16 16M22 6L6 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>

        <h3 class="gw-title">
          <span *ngIf="gatewayStep === 'processing'">Processing Payment…</span>
          <span *ngIf="gatewayStep === 'success'">Payment Successful</span>
          <span *ngIf="gatewayStep === 'failed'">Payment Failed</span>
        </h3>
        <p class="gw-sub">
          <span *ngIf="gatewayStep === 'processing'">Simulating payment — Razorpay integration coming soon</span>
          <span *ngIf="gatewayStep === 'success'">Confirming your order…</span>
          <span *ngIf="gatewayStep === 'failed'">Payment could not be processed. Please try again.</span>
        </p>
        <button class="gw-retry-btn" *ngIf="gatewayStep === 'failed'" (click)="retryPayment()">
          Try Again
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       DESIGN TOKENS — identical to full system
    ═══════════════════════════════════════════ */
    :host {
      --orange:      #ff6600;
      --orange-dim:  rgba(255,102,0,0.12);
      --orange-glow: rgba(255,102,0,0.28);
      --green:       #22c55e;
      --green-dim:   rgba(34,197,94,0.1);
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
       PAGE + BG
    ═══════════════════════════════════════════ */
    .co-page {
      position: relative;
      min-height: 100vh;
      background: var(--surface);
      color: var(--text);
      overflow: hidden;
    }
    .co-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .co-blob {
      position: absolute; border-radius: 50%;
      filter: blur(110px); opacity: 0.09;
      animation: blobDrift 10s ease-in-out infinite alternate;
    }
    .blob-1 { width: 520px; height: 520px; background: var(--orange); top: -160px; right: -80px; }
    .blob-2 { width: 320px; height: 320px; background: #c73e00; bottom: 60px; left: -80px; animation-delay: -5s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(20px,16px) scale(1.05); }
    }
    .co-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       CLOSED BANNER
    ═══════════════════════════════════════════ */
    .closed-banner {
      position: relative; z-index: 2;
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(239,68,68,0.08);
      border-bottom: 1px solid rgba(239,68,68,0.2);
      padding: 16px 28px;
    }
    .cb-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      border-radius: 10px;
      background: rgba(239,68,68,0.1);
      display: flex; align-items: center; justify-content: center;
      color: var(--red); margin-top: 2px;
    }
    .cb-title { font-weight: 800; font-size: 0.88rem; color: var(--red); margin: 0 0 3px; }
    .cb-sub   { font-size: 0.78rem; color: var(--text-muted); margin: 0; }
    .co-locked { opacity: 0.4; pointer-events: none; }

    /* ═══════════════════════════════════════════
       SHELL
    ═══════════════════════════════════════════ */
    .co-shell {
      position: relative; z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 88px 28px 80px;
      animation: fadeUp 0.5s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ═══════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════ */
    .co-header { display: flex; align-items: flex-end; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 0.78rem; font-weight: 700;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
      margin-bottom: 6px;
    }
    .back-btn:hover { color: var(--text); border-color: var(--border-h); background: var(--surface-3); }

    .co-eyebrow {
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
    .co-title {
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      font-weight: 900; letter-spacing: -0.04em; margin: 0; line-height: 1;
    }
    .accent { color: var(--orange); }

    /* ═══════════════════════════════════════════
       SHARED TOKENS
    ═══════════════════════════════════════════ */
    .section-label {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.68rem; font-weight: 800;
      letter-spacing: 0.13em; text-transform: uppercase;
      color: var(--text-muted);
    }
    .label-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-dim); }
    .orange-dot { background: var(--orange); box-shadow: 0 0 7px var(--orange-glow); }
    .label-count { font-size: 0.65rem; color: var(--orange); font-weight: 700; text-transform: none; letter-spacing: 0; margin-left: 4px; }

    /* ═══════════════════════════════════════════
       STEPPER
    ═══════════════════════════════════════════ */
    .stepper {
      margin-bottom: 28px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 24px;
    }
    .stepper-track { display: flex; align-items: center; }
    .step { display: flex; align-items: center; gap: 10px; flex: 1; }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 900;
      background: var(--surface-3); border: 2px solid var(--border);
      color: var(--text-muted);
      transition: all 0.3s;
    }
    .step-active .step-circle { border-color: var(--orange); color: var(--orange); box-shadow: 0 0 12px var(--orange-glow); }
    .step-done   .step-circle { background: var(--green); border-color: var(--green); color: #000; }
    .step-label { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
    .step-active .step-label { color: var(--text); }
    .step-done   .step-label { color: var(--green); }
    .step-connector {
      flex: 1; height: 1px;
      background: var(--border); margin: 0 10px;
      transition: background 0.3s;
    }
    .connector-done { background: rgba(34,197,94,0.4); }

    /* ═══════════════════════════════════════════
       TWO-COLUMN GRID
    ═══════════════════════════════════════════ */
    .co-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }

    /* ═══════════════════════════════════════════
       WIZARD CARD
    ═══════════════════════════════════════════ */
    .wizard-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 32px;
      display: flex; flex-direction: column; gap: 24px;
      animation: cardIn 0.3s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes cardIn {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .wc-header { display: flex; flex-direction: column; gap: 0; }
    .wc-title  { font-size: 1.55rem; font-weight: 900; letter-spacing: -0.03em; margin: 8px 0 0; }

    .link-back {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none;
      color: var(--text-muted); font-size: 0.75rem; font-weight: 700;
      cursor: pointer; padding: 0;
      transition: color 0.2s;
    }
    .link-back:hover { color: var(--orange); }

    /* ─── Type buttons ─── */
    .type-grid { display: flex; flex-direction: column; gap: 12px; }
    .type-btn {
      display: flex; align-items: center; gap: 16px;
      background: var(--surface-3);
      border: 1.5px solid var(--border);
      border-radius: 16px; padding: 18px 20px;
      cursor: pointer; color: var(--text);
      text-align: left;
      transition: border-color 0.22s, background 0.22s, transform 0.22s;
    }
    .type-btn:hover { border-color: var(--border-h); transform: translateY(-1px); }
    .type-selected { border-color: var(--orange) !important; background: var(--orange-dim) !important; }
    .type-icon-wrap {
      width: 46px; height: 46px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: 12px; color: var(--text-muted);
      transition: border-color 0.2s, color 0.2s;
    }
    .type-selected .type-icon-wrap { border-color: rgba(255,102,0,0.3); color: var(--orange); background: var(--orange-dim); }
    .type-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .type-name { font-size: 0.95rem; font-weight: 800; }
    .type-desc { font-size: 0.75rem; color: var(--text-muted); }
    .type-radio {
      width: 20px; height: 20px; border-radius: 50%;
      border: 2px solid var(--text-dim); flex-shrink: 0;
      transition: all 0.22s;
    }
    .radio-on { border-color: var(--orange); border-width: 6px; }

    /* ─── Field groups ─── */
    .field-group { display: flex; flex-direction: column; gap: 12px; }
    .field-label {
      display: flex; align-items: center; gap: 7px;
      font-size: 0.68rem; font-weight: 800;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--text-muted);
    }
    .field-hint {
      font-size: 0.72rem; color: var(--text-muted); margin: 0;
    }
    .warn-hint {
      display: flex; align-items: center; gap: 5px;
      color: var(--red);
    }

    /* Guest stepper */
    .guest-stepper {
      display: flex; align-items: center; gap: 2px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 4px;
      width: fit-content;
    }
    .gs-btn {
      width: 36px; height: 36px;
      background: transparent; border: none;
      color: var(--text-muted); border-radius: 9px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .gs-btn:hover:not([disabled]) { background: var(--orange); color: #fff; }
    .gs-btn:disabled { opacity: 0.25; cursor: not-allowed; }
    .gs-num {
      font-size: 1.2rem; font-weight: 900;
      min-width: 48px; text-align: center;
      color: var(--text);
    }

    /* Time chips */
    .time-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .time-chip {
      background: var(--surface-3);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 7px 14px;
      border-radius: 9px;
      font-size: 0.78rem; font-weight: 700;
      cursor: pointer;
      transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s;
    }
    .time-chip:hover:not([disabled]) { color: var(--text); border-color: var(--border-h); transform: translateY(-1px); }
    .chip-selected { background: var(--orange-dim) !important; border-color: var(--orange) !important; color: var(--orange) !important; }
    .chip-past { opacity: 0.3; cursor: not-allowed !important; text-decoration: line-through; }
    .past-tag {
      font-size: 0.5rem; font-weight: 800; text-transform: uppercase;
      background: var(--surface-4); padding: 1px 5px; border-radius: 4px;
      margin-left: 4px; vertical-align: middle; letter-spacing: 0.5px;
    }

    /* ─── Table map ─── */
    .table-map {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .table-cell {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      cursor: pointer;
    }
    .table-top, .table-bottom {
      display: flex; justify-content: space-around; width: 100%;
    }
    .chair {
      width: 10px; height: 10px; border-radius: 3px;
      background: var(--surface-4);
      border: 1px solid var(--border);
      transition: background 0.2s;
    }
    .table-selected .chair { background: rgba(255,102,0,0.4); border-color: rgba(255,102,0,0.3); }
    .table-body {
      width: 100%; aspect-ratio: 1.3;
      background: var(--surface-3);
      border: 1.5px solid var(--border);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.22s, background 0.22s, transform 0.22s, box-shadow 0.22s;
    }
    .table-cell:hover:not(.table-occupied) .table-body {
      border-color: var(--border-h); transform: scale(1.04);
    }
    .table-selected .table-body {
      border-color: var(--orange);
      background: var(--orange-dim);
      box-shadow: 0 0 18px var(--orange-glow);
    }
    .table-occupied { opacity: 0.3; cursor: not-allowed; }
    .table-occupied .table-body { filter: grayscale(0.8); }
    .table-num {
      font-size: 0.8rem; font-weight: 900; color: var(--text-muted);
    }
    .table-selected .table-num { color: var(--orange); }
    .table-status-label {
      font-size: 0.58rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-dim);
    }
    .table-selected .table-status-label { color: var(--orange); }
    .table-occupied .table-status-label { color: var(--red); }

    .map-legend { display: flex; gap: 16px; }
    .leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; color: var(--text-muted); font-weight: 700; }
    .leg-pip { width: 8px; height: 8px; border-radius: 50%; }
    .pip-free     { background: var(--surface-3); border: 1px solid var(--border); }
    .pip-selected { background: var(--orange); }
    .pip-occ      { background: var(--red); opacity: 0.5; }

    /* ─── Kitchen bar ─── */
    .kitchen-bar {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--green-dim);
      border: 1px solid rgba(34,197,94,0.18);
      border-radius: 14px; padding: 16px 20px;
      transition: background 0.3s, border-color 0.3s;
    }
    .kitchen-busy {
      background: rgba(239,68,68,0.06);
      border-color: rgba(239,68,68,0.18);
    }
    .kb-left { display: flex; align-items: center; gap: 14px; }
    .kb-dot-wrap { flex-shrink: 0; }
    .kb-pulse-dot {
      display: block;
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px rgba(34,197,94,0.6);
      animation: kbPulse 2s ease-in-out infinite;
    }
    .dot-busy { background: var(--red); box-shadow: 0 0 8px rgba(239,68,68,0.6); }
    @keyframes kbPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .kb-title { font-size: 0.72rem; font-weight: 800; color: var(--green); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 3px; }
    .kitchen-busy .kb-title { color: var(--red); }
    .kb-detail { font-size: 0.78rem; color: var(--text-muted); margin: 0; }

    /* ─── Payment buttons ─── */
    .pay-grid { display: flex; flex-direction: column; gap: 12px; }
    .pay-btn {
      display: flex; align-items: center; gap: 16px;
      background: var(--surface-3);
      border: 1.5px solid var(--border);
      border-radius: 16px; padding: 18px 20px;
      cursor: pointer; color: var(--text); text-align: left;
      transition: border-color 0.22s, background 0.22s, transform 0.22s;
    }
    .pay-btn:hover { border-color: var(--border-h); transform: translateY(-1px); }
    .pay-selected { border-color: var(--orange) !important; background: var(--orange-dim) !important; }
    .pay-icon-wrap {
      width: 46px; height: 46px; flex-shrink: 0;
      border: 1px solid var(--border);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); background: rgba(255,255,255,0.03);
      transition: border-color 0.2s, color 0.2s;
    }
    .pay-selected .pay-icon-wrap { border-color: rgba(255,102,0,0.3); color: var(--orange); background: var(--orange-dim); }
    .pay-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .pay-name { font-size: 0.95rem; font-weight: 800; }
    .pay-desc { font-size: 0.72rem; color: var(--text-muted); }
    .coming-soon-badge {
      display: inline-block;
      font-size: 0.55rem; font-weight: 800;
      background: rgba(245,158,11,0.12); color: var(--amber);
      border: 1px solid rgba(245,158,11,0.25);
      padding: 1px 6px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin-left: 4px; vertical-align: middle;
    }

    /* ─── Pre-confirm summary ─── */
    .pre-summary {
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 14px; padding: 18px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .ps-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; }
    .ps-label { display: flex; align-items: center; gap: 7px; color: var(--text-muted); font-weight: 600; }
    .ps-val { font-weight: 700; font-size: 0.82rem; }
    .ps-total { border-top: 1px solid var(--border); padding-top: 12px; margin-top: 2px; }
    .ps-amount { font-size: 1.3rem; font-weight: 900; color: var(--orange); }

    /* ─── Action buttons ─── */
    .btn-next {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 15px;
      background: var(--surface-3);
      border: 1px solid var(--border-h);
      color: var(--text);
      border-radius: 13px;
      font-size: 0.9rem; font-weight: 800;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s, transform 0.2s;
    }
    .btn-next:hover:not([disabled]) { background: var(--surface-4); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }
    .btn-next:disabled { opacity: 0.3; cursor: not-allowed; }

    .btn-confirm {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 16px;
      background: var(--orange); color: #fff;
      border: none; border-radius: 13px;
      font-size: 0.92rem; font-weight: 900;
      cursor: pointer;
      box-shadow: 0 4px 22px var(--orange-glow);
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .btn-confirm:hover:not([disabled]) { background: #e55a00; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,102,0,0.45); }
    .btn-confirm:disabled { background: var(--surface-3); color: var(--text-muted); box-shadow: none; cursor: not-allowed; }

    .co-spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,0.25);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    .co-spinner-sm { width: 15px; height: 15px; border-width: 2px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ═══════════════════════════════════════════
       RECEIPT CARD (right column)
    ═══════════════════════════════════════════ */
    .receipt-col { position: sticky; top: 88px; }
    .receipt-card {
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      border-radius: 22px; padding: 26px;
      transition: border-color 0.3s;
    }
    .receipt-card:hover { border-color: rgba(255,255,255,0.18); }

    .receipt-items {
      display: flex; flex-direction: column; gap: 10px;
      max-height: 260px; overflow-y: auto;
      margin-bottom: 18px;
      scrollbar-width: thin;
      scrollbar-color: var(--text-dim) transparent;
    }
    .ri { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .ri-left { display: flex; gap: 8px; flex: 1; min-width: 0; }
    .ri-qty   { color: var(--orange); font-weight: 900; font-size: 0.82rem; flex-shrink: 0; width: 20px; }
    .ri-info  { display: flex; flex-direction: column; gap: 2px; }
    .ri-name  { color: #ccc; font-size: 0.82rem; font-weight: 600; }
    .ri-var   {
      font-size: 0.62rem; color: var(--text-muted);
      background: var(--surface-3); padding: 1px 6px; border-radius: 4px;
      display: inline-block; width: fit-content;
    }
    .ri-note  { font-size: 0.68rem; color: #facc15; font-style: italic; }
    .ri-price { font-weight: 700; font-size: 0.82rem; flex-shrink: 0; }

    .receipt-divider { height: 1px; background: var(--border); margin: 12px 0; }

    .receipt-row {
      display: flex; justify-content: space-between;
      font-size: 0.8rem; color: var(--text-muted); font-weight: 600;
      margin-bottom: 10px;
    }
    .receipt-free .free-pill {
      font-size: 0.6rem; font-weight: 800;
      background: rgba(34,197,94,0.1); color: var(--green);
      padding: 2px 9px; border-radius: 20px;
      border: 1px solid rgba(34,197,94,0.2);
    }
    .receipt-grand {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid var(--border-h);
      padding-top: 18px; margin: 12px 0 20px;
    }
    .rg-label  { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .rg-amount { font-size: 2.2rem; font-weight: 900; letter-spacing: -0.05em; color: var(--orange); line-height: 1; }

    /* Booking chips */
    .receipt-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .r-chip {
      background: var(--surface-3); border: 1px solid var(--border);
      border-radius: 10px; padding: 10px 12px;
    }
    .rc-label { display: block; font-size: 0.58rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 3px; }
    .rc-val   { font-size: 0.8rem; font-weight: 700; color: var(--text); }

    .secure-note {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      font-size: 0.68rem; font-weight: 700;
      color: var(--text-dim); letter-spacing: 0.06em;
    }

    /* ═══════════════════════════════════════════
       CONFIRMATION MODAL
    ═══════════════════════════════════════════ */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(10px);
      z-index: 9000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-box {
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      border-radius: 24px;
      width: 100%; max-width: 560px; max-height: 92vh;
      display: flex; flex-direction: column;
      box-shadow: 0 40px 80px rgba(0,0,0,0.7);
      animation: cardIn 0.25s cubic-bezier(.4,0,.2,1) both;
      overflow: hidden;
    }
    .modal-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 24px 26px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .modal-title { font-size: 1.2rem; font-weight: 900; margin: 0 0 4px; }
    .modal-sub   { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
    .modal-close-btn {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--surface-3); border: 1px solid var(--border);
      color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .modal-close-btn:hover { background: var(--surface-4); color: var(--text); }

    .modal-body {
      padding: 22px 26px; overflow-y: auto; flex: 1;
      display: flex; flex-direction: column; gap: 22px;
    }
    .confirm-section { display: flex; flex-direction: column; gap: 12px; }
    .cs-heading {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.14em;
      color: var(--text-muted); margin: 0;
    }
    .cs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .cs-tile {
      display: flex; align-items: center; gap: 12px;
      background: var(--surface-3); border: 1px solid var(--border);
      border-radius: 12px; padding: 13px 14px;
    }
    .cs-tile-icon {
      width: 34px; height: 34px; flex-shrink: 0;
      border-radius: 9px; background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted);
    }
    .cs-key { font-size: 0.6rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 3px; }
    .cs-val { font-size: 0.88rem; font-weight: 800; margin: 0; }

    .confirm-items { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
    .ci-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      background: var(--surface-3); border: 1px solid var(--border);
      border-radius: 11px; padding: 11px 14px; gap: 10px;
    }
    .ci-left { display: flex; gap: 10px; flex: 1; min-width: 0; }
    .ci-qty  { font-weight: 900; color: var(--orange); font-size: 0.92rem; flex-shrink: 0; }
    .ci-info { display: flex; flex-direction: column; gap: 3px; }
    .ci-name { font-weight: 700; font-size: 0.85rem; }
    .ci-var  { font-size: 0.62rem; color: var(--text-muted); }
    .ci-note { font-size: 0.68rem; color: #facc15; font-style: italic; }
    .ci-price { font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }

    .confirm-total {
      display: flex; justify-content: space-between; align-items: baseline;
      border-top: 1px solid var(--border); padding-top: 14px;
      font-size: 0.85rem; font-weight: 800;
    }
    .ct-amount { font-size: 1.6rem; font-weight: 900; color: var(--orange); letter-spacing: -0.04em; }

    .modal-foot {
      display: flex; gap: 12px; padding: 18px 26px;
      border-top: 1px solid var(--border); flex-shrink: 0;
    }
    .modal-back-btn {
      flex: 1; padding: 14px;
      background: var(--surface-3); border: 1px solid var(--border);
      color: var(--text-muted); border-radius: 12px;
      font-weight: 700; font-size: 0.85rem; cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }
    .modal-back-btn:hover { color: var(--text); border-color: var(--border-h); }
    .modal-place-btn {
      flex: 2; padding: 14px;
      background: var(--orange); color: #fff;
      border: none; border-radius: 12px;
      font-weight: 900; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer;
      box-shadow: 0 4px 20px var(--orange-glow);
      transition: background 0.2s, opacity 0.2s, transform 0.2s;
    }
    .modal-place-btn:hover:not([disabled]) { background: #e55a00; transform: translateY(-1px); }
    .modal-place-btn:disabled { background: var(--surface-3); color: var(--text-muted); box-shadow: none; cursor: not-allowed; }

    /* ═══════════════════════════════════════════
       GATEWAY OVERLAY
    ═══════════════════════════════════════════ */
    .gateway-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.94);
      backdrop-filter: blur(16px);
      z-index: 9500;
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .gateway-card {
      position: relative;
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      border-radius: 28px;
      padding: 52px 44px;
      text-align: center; max-width: 400px; width: 100%;
      box-shadow: 0 40px 80px rgba(0,0,0,0.7);
      overflow: hidden;
      animation: cardIn 0.3s ease both;
    }
    .gw-bg-blob {
      position: absolute; width: 280px; height: 280px;
      border-radius: 50%;
      background: var(--orange);
      opacity: 0.05; filter: blur(60px);
      top: -80px; left: -60px;
      pointer-events: none;
    }
    .gw-spinner-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
    .gw-ring {
      width: 56px; height: 56px;
      border: 3px solid var(--surface-3);
      border-top-color: var(--orange);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .gw-status-icon {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
    }
    .gw-success { background: var(--green); color: #000; }
    .gw-fail    { background: var(--red); color: #fff; }

    .gw-title { font-size: 1.25rem; font-weight: 900; margin: 0 0 10px; }
    .gw-sub   { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; margin: 0 0 24px; }
    .gw-retry-btn {
      background: var(--orange); color: #fff;
      border: none; padding: 13px 32px;
      border-radius: 12px; font-weight: 800; font-size: 0.88rem;
      cursor: pointer;
      box-shadow: 0 4px 20px var(--orange-glow);
      transition: background 0.2s, transform 0.2s;
    }
    .gw-retry-btn:hover { background: #e55a00; transform: translateY(-1px); }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 960px) {
      .co-grid { grid-template-columns: 1fr; }
      .receipt-col { position: static; order: -1; }
      .step-label { display: none; }
      .stepper { padding: 14px 18px; }
    }
    @media (max-width: 600px) {
      .co-shell { padding: 80px 16px 60px; }
      .wizard-card { padding: 22px 18px; }
      .table-map { grid-template-columns: repeat(3, 1fr); }
      .cs-grid { grid-template-columns: 1fr; }
      .co-title { font-size: 2rem; }
      .modal-foot { flex-direction: column; }
    }
  `],
})
export class CheckoutComponent implements OnInit {
  cartService  = inject(CartService);
  orderService = inject(OrderService);
  router       = inject(Router);
  toast        = inject(ToastService);
  cdr          = inject(ChangeDetectorRef);

  currentStep    = signal(1);
  orderType: 'DINE IN' | 'TAKEAWAY' = 'DINE IN';
  paymentMethod: 'CASH' | 'ONLINE'  = 'CASH';
  numberOfPeople = signal(1);
  selectedSlot   = '';
  selectedTables = signal<number[]>([]);
  loading        = signal(false);

  showConfirmModal   = false;
  showGatewayOverlay = false;
  gatewayStep: 'processing' | 'success' | 'failed' = 'processing';

  activeOrderCount = signal(0);
  occupiedTables   = signal<number[]>([]);

  readonly tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly steps  = ['Dining Style', 'Details', 'Payment'];
  availableSlots: string[] = [];

  private razorpayPaymentId = '';

  cartItemsList     = computed(() => this.cartService.cartItems());
  requiredTables    = computed(() => Math.ceil(this.numberOfPeople() / 4));
  estimatedWaitTime = computed(() => 15 + this.activeOrderCount() * 3);

  ngOnInit() {
    if (this.cartItemsList().length === 0) {
      this.toast.error('Your cart is empty.');
      this.router.navigate(['/cart']);
      return;
    }
    const containsFood = this.cartItemsList().some((i: any) => i.category !== 'drinks');
    if (!containsFood) {
      this.toast.error('Add at least one food item before checkout.');
      this.router.navigate(['/cart']);
      return;
    }
    this.generateTimeSlots();
    const firstFuture = this.availableSlots.find(s => !this.isSlotPast(s));
    this.selectedSlot = firstFuture || this.availableSlots[0] || '';
    this.fetchKitchenStatus();
  }

  isRestaurantClosed(): boolean {
    const h = new Date().getHours();
    return h < 10 || h >= 23;
  }

  generateTimeSlots() {
    const slots: string[] = [];
    for (let h = 10; h <= 22; h++) {
      for (const m of [0, 30]) {
        const displayH = h === 12 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        slots.push(`${displayH}:${m === 0 ? '00' : '30'} ${ampm}`);
      }
    }
    this.availableSlots = slots;
  }

  isSlotPast(slot: string): boolean {
    return this.slotToDate(slot).getTime() < Date.now() + 15 * 60 * 1000;
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
      this.selectedTables.set([]);
    }
  }

  canProceed(): boolean {
    if (!this.selectedSlot || this.isSlotPast(this.selectedSlot)) return false;
    if (this.orderType === 'TAKEAWAY') return true;
    return this.selectedTables().length === this.requiredTables();
  }

  goToStep(n: number) {
    if (this.isRestaurantClosed()) {
      this.toast.error('Restaurant is currently closed. Open 10 AM – 11 PM.');
      return;
    }
    this.currentStep.set(n);
    if (n === 2) this.fetchKitchenStatus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openConfirmModal()  { this.showConfirmModal = true; }
  closeConfirmModal(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showConfirmModal = false;
    }
  }

  private simulateOnlinePayment(): Promise<{ paymentId: string; success: boolean }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const fakeId = 'pay_SIM_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
        resolve({ paymentId: fakeId, success: true });
      }, 2000);
    });
  }

  async handleCheckout() {
    this.showConfirmModal = false;
    if (this.paymentMethod === 'ONLINE') {
      this.showGatewayOverlay = true;
      this.gatewayStep = 'processing';
      this.cdr.detectChanges();
      const result = await this.simulateOnlinePayment();
      if (!result.success) { this.gatewayStep = 'failed'; this.cdr.detectChanges(); return; }
      this.razorpayPaymentId = result.paymentId;
      this.gatewayStep = 'success';
      this.cdr.detectChanges();
      await new Promise(r => setTimeout(r, 1200));
      this.showGatewayOverlay = false;
      this.placeOrder('PAID', this.razorpayPaymentId);
    } else {
      this.placeOrder('PENDING', '');
    }
  }

  retryPayment() {
    this.showGatewayOverlay = false;
    this.gatewayStep = 'processing';
    this.showConfirmModal = true;
    this.cdr.detectChanges();
  }

  private placeOrder(paymentStatus: string, transactionId: string) {
    this.loading.set(true);
    const scheduledTime = this.slotToDate(this.selectedSlot);
    const payload = {
      diningStyle:    this.orderType,
      orderType:      this.orderType,
      numberOfPeople: this.numberOfPeople(),
      tableNumbers:   this.selectedTables(),
      scheduledTime:  scheduledTime.toISOString(),
      paymentMethod:  this.paymentMethod,
      paymentStatus,
      transactionId,
      totalAmount: Number(this.cartService.totalPrice()) || 0,
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
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.msg || 'Failed to place order. Please try again.');
        if (this.paymentMethod === 'ONLINE' && transactionId) {
          this.toast.error(`Payment charged (ID: ${transactionId}) but order failed. Contact us for a refund.`);
        }
        this.cdr.detectChanges();
      },
    });
  }

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