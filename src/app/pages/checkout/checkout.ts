import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
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
    <div class="checkout-wrapper fade-in">
      <div class="container">
        
        <!-- OPERATIONAL BANNER -->
        <div class="banner-alert closed animate-pop" *ngIf="isRestaurantClosed()">
          <div class="banner-inner">
            <span class="b-icon">🌙</span>
            <div class="b-content">
              <h3>Legendary Rest Period Active</h3>
              <p>The kitchen is currently closed. Operating hours are strictly 11:00 AM to 10:00 PM. Visit us then!</p>
            </div>
          </div>
        </div>

        <!-- PROGRESS HUD -->
        <div class="stepper-hud glass-panel" [class.locked]="isRestaurantClosed()">
          <div class="step-container">
            <div class="wizard-step" [class.active]="currentStep() >= 1" [class.done]="currentStep() > 1">
              <div class="step-circle">{{ currentStep() > 1 ? '✓' : '1' }}</div>
              <span class="step-label">Dining Style</span>
            </div>
            <div class="step-line"></div>
            <div class="wizard-step" [class.active]="currentStep() >= 2" [class.done]="currentStep() > 2">
              <div class="step-circle">{{ currentStep() > 2 ? '✓' : '2' }}</div>
              <span class="step-label">Location Setup</span>
            </div>
            <div class="step-line"></div>
            <div class="wizard-step" [class.active]="currentStep() >= 3">
              <div class="step-circle">3</div>
              <span class="step-label">Secure Payment</span>
            </div>
          </div>
        </div>

        <!-- MAIN CHECKOUT GRID -->
        <div class="checkout-grid" [class.locked]="isRestaurantClosed()">
          
          <!-- LEFT COLUMN: INTERACTIVE WIZARD -->
          <div class="wizard-column">
            
            <!-- STEP 1: PREFERENCE -->
            <div class="wizard-card glass-panel animate-slide-up" *ngIf="currentStep() === 1">
              <h2 class="card-title">Select Dining Experience</h2>
              <div class="preference-grid">
                <button class="pref-btn" [class.selected]="orderType === 'DINE IN'" (click)="setOrderType('DINE IN')">
                  <div class="pref-icon">🍽️</div>
                  <h3 class="pref-name">Dine In</h3>
                  <p class="pref-desc">Immerse yourself in our legendary ambiance and service.</p>
                  <div class="sel-indicator"></div>
                </button>
                <button class="pref-btn" [class.selected]="orderType === 'TAKEAWAY'" (click)="setOrderType('TAKEAWAY')">
                  <div class="pref-icon">🥡</div>
                  <h3 class="pref-name">Takeaway</h3>
                  <p class="pref-desc">Perfectly packed to enjoy the feast wherever you go.</p>
                  <div class="sel-indicator"></div>
                </button>
              </div>
              <button class="btn-continue" (click)="goToStep(2)">
                Continue to Details <span class="arr">→</span>
              </button>
            </div>

            <!-- STEP 2: TABLE / LOCATION -->
            <div class="wizard-card glass-panel animate-slide-up" *ngIf="currentStep() === 2">
              <div class="card-header-action">
                <button class="btn-back" (click)="goToStep(1)">← Back to Style</button>
                <h2 class="card-title">{{ orderType === 'DINE IN' ? 'Interactive Floor Map' : 'Pickup Scheduling' }}</h2>
              </div>

              <!-- Interactive Floor Map (Dine In Only) -->
              <div class="floor-map-container" *ngIf="orderType === 'DINE IN'">
                <div class="map-stats-bar">
                  <div class="stat-pill" [class.alert]="selectedTables().length < requiredTables()">
                    <span class="s-icon">📌</span>
                    Selection: {{ selectedTables().length }} / {{ requiredTables() }} Table{{ requiredTables() > 1 ? 's' : '' }}
                  </div>
                  <div class="stat-pill info">
                    <span class="s-icon">👥</span>
                    Group Size: {{ numberOfPeople() }} Guests
                  </div>
                </div>

                <div class="interactive-grid">
                  <div 
                    class="table-unit" 
                    *ngFor="let t of tables"
                    [class.occupied]="isTableOccupied(t)"
                    [class.selected]="isTableSelected(t)"
                    (click)="toggleTable(t)"
                  >
                    <div class="table-surface">
                      <span class="table-id">T{{ t }}</span>
                      <div class="chair-group">
                        <div class="chair top"></div>
                        <div class="chair bottom"></div>
                        <div class="chair left"></div>
                        <div class="chair right"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- General Form Elements -->
              <div class="inputs-row">
                <div class="input-block">
                  <label>Total Guests Count</label>
                  <div class="stepper-input">
                    <button class="s-btn" (click)="updateGuests(-1)" [disabled]="numberOfPeople() <= 1">-</button>
                    <div class="s-val">{{ numberOfPeople() }}</div>
                    <button class="s-btn" (click)="updateGuests(1)" [disabled]="numberOfPeople() >= 48">+</button>
                  </div>
                </div>
                <div class="input-block">
                  <label>Arrival / Pickup Slot</label>
                  <select class="killa-dropdown" [(ngModel)]="selectedSlot">
                    <option *ngFor="let slot of availableSlots" [value]="slot">{{ slot }}</option>
                  </select>
                </div>
              </div>

              <!-- Real-time Kitchen Load -->
              <div class="kitchen-load-banner">
                <div class="load-text">
                  <span class="wait-time">Estimated Kitchen Wait: <strong>{{ estimatedWaitTime() }} mins</strong></span>
                  <span class="volume">Active Orders: {{ activeOrderCount() }}</span>
                </div>
                <div class="load-indicator" [class.high]="activeOrderCount() >= 15"></div>
              </div>

              <button class="btn-continue" [disabled]="!canProceedToPayment()" (click)="goToStep(3)">
                Continue to Payment <span class="arr">→</span>
              </button>
            </div>

            <!-- STEP 3: PAYMENT -->
            <div class="wizard-card glass-panel animate-slide-up" *ngIf="currentStep() === 3">
              <div class="card-header-action">
                <button class="btn-back" (click)="goToStep(2)">← Back to Details</button>
                <h2 class="card-title">Finalize Secure Payment</h2>
              </div>
              
              <div class="payment-methods-grid">
                <button class="pay-method-card" [class.active]="paymentMethod === 'CASH'" (click)="paymentMethod = 'CASH'">
                  <div class="pay-icon">💵</div>
                  <div class="pay-info">
                    <h4>Pay at Killa Counter</h4>
                    <p>Cash or UPI accepted on arrival.</p>
                  </div>
                  <div class="radio-circle"></div>
                </button>
                
                <button class="pay-method-card" [class.active]="paymentMethod === 'ONLINE'" (click)="paymentMethod = 'ONLINE'">
                  <div class="pay-icon">💳</div>
                  <div class="pay-info">
                    <h4>Instant KillaPay</h4>
                    <p>Secure online processing gateway.</p>
                  </div>
                  <div class="radio-circle"></div>
                </button>
              </div>

              <button class="btn-massive-confirm" [disabled]="loading" (click)="handleCheckoutProcess()">
                <span class="loader-spinner" *ngIf="loading"></span>
                <span *ngIf="!loading">Confirm Legendary Order</span>
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN: SIDEBAR RECEIPT -->
          <aside class="receipt-column">
            <div class="receipt-card glass-panel sticky-element">
              <h3 class="receipt-title">Order Receipt</h3>
              
              <div class="receipt-items-container">
                <div class="r-item" *ngFor="let item of cartItemsList()">
                  <div class="r-item-main">
                    <span class="r-qty">{{ item.quantity }}×</span>
                    <span class="r-name">{{ item.name }}</span>
                  </div>
                  <span class="r-price">₹{{ item.computedPrice * item.quantity }}</span>
                </div>
              </div>
              
              <div class="receipt-totals-block">
                <div class="r-row grand">
                  <span>Net Payable</span>
                  <span class="amount">₹{{ cartService.totalPrice() || 0 }}</span>
                </div>
              </div>

              <div class="receipt-meta" *ngIf="orderType === 'DINE IN'">
                <div class="meta-chip">
                  <span class="m-lbl">Tables</span>
                  <span class="m-val">{{ selectedTables().length || 0 }}</span>
                </div>
                <div class="meta-chip">
                  <span class="m-lbl">Guests</span>
                  <span class="m-val">{{ numberOfPeople() }}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <!-- KILLAPAY OVERLAY SIMULATION -->
      <div class="gateway-overlay" *ngIf="showPaymentGateway">
        <div class="gateway-card animate-pop">
          <div class="gateway-spinner" *ngIf="paymentStep === 'PROCESSING'"></div>
          <div class="gateway-success" *ngIf="paymentStep === 'SUCCESS'">✓</div>
          <h2 class="gateway-title">KillaPay Gateway</h2>
          <p class="gateway-status" *ngIf="paymentStep === 'PROCESSING'">Establishing secure tunnel and authorizing transaction...</p>
          <p class="gateway-status success-text" *ngIf="paymentStep === 'SUCCESS'">Payment Successfully Authorized</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ROOT GLOBALS */
    :host {
      display: block;
      --killa-orange: #ff6600;
      --killa-dark: #050505;
      --glass-bg: rgba(18, 18, 18, 0.75);
      --glass-border: rgba(255, 255, 255, 0.08);
      --danger: #ff3333;
      --success: #00ff88;
    }

    /* ANIMATIONS */
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 50% { transform: scale(1.02); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pop { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    /* LAYOUT */
    .checkout-wrapper { padding: 130px 0 100px; min-height: 100vh; background: var(--killa-dark); color: #fff; font-family: 'Inter', sans-serif; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
    .glass-panel { background: var(--glass-bg); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--glass-border); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .locked { opacity: 0.5; pointer-events: none; filter: grayscale(100%); }

    /* OPERATIONAL BANNER */
    .banner-alert { background: rgba(255,51,51,0.1); border: 1px solid rgba(255,51,51,0.3); border-radius: 24px; padding: 24px; margin-bottom: 40px; }
    .banner-inner { display: flex; align-items: center; gap: 20px; }
    .b-icon { font-size: 2.5rem; }
    .b-content h3 { margin: 0 0 5px 0; color: var(--danger); font-size: 1.4rem; font-weight: 900; text-transform: uppercase; }
    .b-content p { margin: 0; color: #ccc; font-weight: 500; }

    /* STEPPER HUD */
    .stepper-hud { padding: 24px 40px; border-radius: 32px; margin-bottom: 40px; }
    .step-container { display: flex; align-items: center; justify-content: center; gap: 24px; max-width: 600px; margin: 0 auto; }
    .wizard-step { display: flex; flex-direction: column; align-items: center; gap: 10px; opacity: 0.4; transition: 0.4s ease; position: relative; }
    .wizard-step.active { opacity: 1; }
    .wizard-step.done .step-circle { background: var(--success); border-color: var(--success); color: #000; }
    .step-circle { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #555; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; transition: 0.4s ease; }
    .wizard-step.active .step-circle { border-color: var(--killa-orange); box-shadow: 0 0 15px rgba(255,102,0,0.4); }
    .step-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .step-line { flex-grow: 1; height: 2px; background: rgba(255,255,255,0.1); margin-bottom: 25px; }

    /* GRID */
    .checkout-grid { display: grid; grid-template-columns: 1fr 380px; gap: 40px; align-items: flex-start; }
    .wizard-card { padding: 48px; border-radius: 40px; }
    .card-title { font-size: 2.2rem; font-weight: 900; margin: 0 0 40px 0; letter-spacing: -1px; }
    .card-header-action { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 30px; }
    .btn-back { background: none; border: none; color: #888; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; cursor: pointer; padding: 0; margin-bottom: 15px; transition: color 0.2s; }
    .btn-back:hover { color: var(--killa-orange); }

    /* STEP 1: PREFERENCE BUTTONS */
    .preference-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
    .pref-btn { background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.05); padding: 32px; border-radius: 24px; text-align: left; color: #fff; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; }
    .pref-btn:hover { border-color: rgba(255,102,0,0.3); transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
    .pref-btn.selected { border-color: var(--killa-orange); background: rgba(255,102,0,0.05); }
    .pref-icon { font-size: 3rem; margin-bottom: 20px; }
    .pref-name { font-size: 1.6rem; font-weight: 900; margin: 0 0 8px 0; }
    .pref-desc { color: #888; font-size: 0.9rem; line-height: 1.5; margin: 0; }
    .sel-indicator { position: absolute; top: 24px; right: 24px; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #444; transition: 0.3s; }
    .pref-btn.selected .sel-indicator { border-color: var(--killa-orange); background: var(--killa-orange); box-shadow: 0 0 10px rgba(255,102,0,0.5); }

    /* STEP 2: INTERACTIVE TABLE MAP */
    .table-map-section { margin-bottom: 40px; }
    .map-stats-bar { display: flex; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 16px 24px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.05); }
    .stat-pill { font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .stat-pill.alert { color: var(--killa-orange); }
    .interactive-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .table-unit { cursor: pointer; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .table-unit:hover:not(.occupied) { transform: scale(1.05); }
    .table-surface { width: 100%; aspect-ratio: 1; background: #161616; border: 2px solid #333; border-radius: 20px; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.3s ease; }
    .table-id { font-weight: 900; font-size: 1.2rem; color: #555; z-index: 2; transition: 0.3s; }
    .table-unit.selected .table-surface { border-color: var(--killa-orange); background: rgba(255,102,0,0.15); box-shadow: 0 0 30px rgba(255,102,0,0.25); }
    .table-unit.selected .table-id { color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
    .table-unit.occupied { opacity: 0.25; cursor: not-allowed; filter: grayscale(100%); }
    
    .chair-group { position: absolute; inset: -8px; pointer-events: none; }
    .chair { position: absolute; width: 16px; height: 16px; background: #2a2a2a; border-radius: 6px; transition: 0.3s; }
    .chair.top { top: 0; left: 50%; transform: translate(-50%, -50%); }
    .chair.bottom { bottom: 0; left: 50%; transform: translate(-50%, 50%); }
    .chair.left { left: 0; top: 50%; transform: translate(-50%, -50%); }
    .chair.right { right: 0; top: 50%; transform: translate(50%, -50%); }
    .table-unit.selected .chair { background: var(--killa-orange); box-shadow: 0 0 10px rgba(255,102,0,0.4); }

    /* FORM INPUTS */
    .inputs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .input-block label { display: block; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: #777; margin-bottom: 12px; letter-spacing: 1px; }
    
    .stepper-input { display: flex; align-items: center; justify-content: space-between; background: #000; border: 1px solid #333; border-radius: 16px; padding: 6px; }
    .s-btn { width: 44px; height: 44px; background: #1a1a1a; border: none; border-radius: 12px; color: #fff; font-weight: 900; font-size: 1.5rem; cursor: pointer; transition: 0.2s; }
    .s-btn:not(:disabled):hover { background: var(--killa-orange); }
    .s-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .s-val { font-size: 1.5rem; font-weight: 900; width: 50px; text-align: center; }

    .killa-dropdown { width: 100%; background: #000; border: 1px solid #333; color: #fff; font-size: 1.1rem; font-weight: 800; padding: 16px 20px; border-radius: 16px; appearance: none; cursor: pointer; outline: none; transition: 0.3s; }
    .killa-dropdown:focus { border-color: var(--killa-orange); }

    /* LOAD BANNER */
    .kitchen-load-banner { display: flex; justify-content: space-between; align-items: center; background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.1); padding: 24px; border-radius: 20px; margin-bottom: 40px; }
    .load-text { display: flex; flex-direction: column; gap: 8px; }
    .wait-time { font-size: 1.2rem; font-weight: 600; color: #ccc; }
    .wait-time strong { color: var(--success); font-size: 1.4rem; font-weight: 900; }
    .volume { font-size: 0.8rem; color: #888; font-weight: 800; text-transform: uppercase; }
    .load-indicator { width: 12px; height: 12px; border-radius: 50%; background: var(--success); box-shadow: 0 0 15px var(--success); }
    .load-indicator.high { background: var(--danger); box-shadow: 0 0 15px var(--danger); }

    /* ACTION BUTTONS */
    .btn-continue, .btn-massive-confirm { width: 100%; display: flex; justify-content: center; align-items: center; gap: 12px; padding: 24px; border: none; border-radius: 24px; font-size: 1.2rem; font-weight: 900; cursor: pointer; transition: all 0.3s ease; }
    .btn-continue { background: #222; color: #fff; }
    .btn-continue:not(:disabled):hover { background: #333; transform: translateY(-2px); }
    .btn-continue:disabled { opacity: 0.4; cursor: not-allowed; }
    
    .btn-massive-confirm { background: var(--killa-orange); color: #fff; box-shadow: 0 15px 35px rgba(255,102,0,0.3); }
    .btn-massive-confirm:not(:disabled):hover { background: #ff7722; transform: translateY(-4px); box-shadow: 0 20px 45px rgba(255,102,0,0.4); }
    .btn-massive-confirm:disabled { background: #222; box-shadow: none; cursor: not-allowed; }

    /* STEP 3: PAYMENTS */
    .payment-methods-grid { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }
    .pay-method-card { display: flex; align-items: center; gap: 24px; background: #000; border: 2px solid #222; padding: 30px; border-radius: 24px; text-align: left; color: #fff; cursor: pointer; transition: 0.3s; position: relative; overflow: hidden; }
    .pay-method-card:hover { border-color: #444; }
    .pay-method-card.active { border-color: var(--killa-orange); background: rgba(255,102,0,0.05); }
    .pay-icon { font-size: 2.5rem; }
    .pay-info h4 { font-size: 1.3rem; font-weight: 900; margin: 0 0 6px 0; }
    .pay-info p { color: #888; font-size: 0.9rem; margin: 0; }
    .radio-circle { position: absolute; right: 30px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; border: 2px solid #555; border-radius: 50%; transition: 0.3s; }
    .pay-method-card.active .radio-circle { border-color: var(--killa-orange); border-width: 7px; }

    /* SIDEBAR RECEIPT */
    .sticky-element { position: sticky; top: 120px; }
    .receipt-card { padding: 40px; border-radius: 40px; }
    .receipt-title { font-size: 1.8rem; font-weight: 900; margin: 0 0 30px 0; letter-spacing: -0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
    
    .receipt-items-container { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px; padding-right: 10px; }
    .r-item { display: flex; justify-content: space-between; align-items: flex-start; }
    .r-item-main { display: flex; gap: 12px; }
    .r-qty { color: var(--killa-orange); font-weight: 900; font-size: 1.1rem; }
    .r-name { font-weight: 700; font-size: 1rem; color: #ddd; line-height: 1.4; }
    .r-price { font-weight: 800; color: #fff; }

    .receipt-totals-block { border-top: 2px dashed #333; padding-top: 30px; margin-bottom: 25px; }
    .r-row.grand { display: flex; justify-content: space-between; align-items: center; font-size: 1.2rem; font-weight: 800; color: #888; text-transform: uppercase; }
    .r-row.grand .amount { font-size: 2.2rem; font-weight: 900; color: var(--killa-orange); }

    .receipt-meta { display: flex; gap: 12px; }
    .meta-chip { background: rgba(255,255,255,0.05); padding: 10px 16px; border-radius: 12px; display: flex; flex-direction: column; flex: 1; }
    .m-lbl { font-size: 0.65rem; color: #777; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
    .m-val { font-size: 1.2rem; font-weight: 900; color: #fff; }

    /* GATEWAY OVERLAY */
    .gateway-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(20px); z-index: 5000; display: flex; align-items: center; justify-content: center; }
    .gateway-card { padding: 60px 40px; background: #0a0a0a; border: 1px solid #222; border-radius: 40px; text-align: center; max-width: 450px; width: 90%; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
    .gateway-spinner { width: 60px; height: 60px; border: 4px solid #222; border-top-color: var(--killa-orange); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px; }
    .gateway-success { width: 60px; height: 60px; background: var(--success); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; margin: 0 auto 30px; }
    .gateway-title { font-size: 1.8rem; font-weight: 900; margin: 0 0 10px 0; }
    .gateway-status { color: #888; font-size: 0.95rem; margin: 0; }
    .success-text { color: var(--success); font-weight: 800; font-size: 1.1rem; }

    .loader-spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; }

    /* RESPONSIVE */
    @media (max-width: 1024px) {
      .checkout-main-grid { grid-template-columns: 1fr; }
      .receipt-column { order: -1; margin-bottom: 30px; }
      .sticky-element { position: static; }
      .interactive-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 600px) {
      .preference-grid { grid-template-columns: 1fr; }
      .inputs-row { grid-template-columns: 1fr; gap: 20px; }
      .interactive-grid { grid-template-columns: repeat(2, 1fr); }
      .wizard-card { padding: 30px 20px; }
      .card-title { font-size: 1.8rem; }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  orderService = inject(OrderService);
  router = inject(Router);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  currentStep = signal(1);
  orderType: 'DINE IN' | 'TAKEAWAY' = 'DINE IN';
  paymentMethod: 'CASH' | 'ONLINE' = 'CASH';
  
  numberOfPeople = signal(1);
  selectedSlot = '';
  tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  selectedTables = signal<number[]>([]);
  
  availableSlots: string[] = [];
  loading = false;
  showPaymentGateway = false;
  paymentStep: 'PROCESSING' | 'SUCCESS' = 'PROCESSING';

  activeOrderCount = signal(0);
  occupiedTables = signal<number[]>([]);

  // Mathematical necessity for group scaling
  requiredTables = computed(() => Math.ceil(this.numberOfPeople() / 4));
  estimatedWaitTime = computed(() => 15 + this.activeOrderCount() * 3);

  // Expose items cleanly to template
  cartItemsList = computed(() => this.cartService.cartItems());

  ngOnInit() {
    if (this.cartItemsList().length === 0) {
      this.toast.error("Your cart is empty. Please add items to proceed.");
      this.router.navigate(['/cart']);
      return;
    }
    this.generateTimeSlots();
    this.selectedSlot = this.availableSlots[0];
    this.fetchKitchenStatus();
  }

  isRestaurantClosed(): boolean {
    const hour = new Date().getHours();
    return hour < 11 || hour >= 22; // Strict 11 AM - 10 PM
  }

  fetchKitchenStatus() {
    this.orderService.getKitchenStatus().subscribe({
      next: (res) => {
        this.activeOrderCount.set(res.activeOrders);
        this.occupiedTables.set(res.occupiedTables || []);
        this.cdr.detectChanges();
      }
    });
  }

  setOrderType(type: 'DINE IN' | 'TAKEAWAY') {
    this.orderType = type;
    this.selectedTables.set([]);
  }

  isTableOccupied(t: number): boolean { 
    return this.occupiedTables().includes(t); 
  }
  
  isTableSelected(t: number): boolean { 
    return this.selectedTables().includes(t); 
  }

  toggleTable(t: number) {
    if (this.isTableOccupied(t)) return;
    
    let currentSelections = [...this.selectedTables()];
    
    if (currentSelections.includes(t)) {
      currentSelections = currentSelections.filter(x => x !== t);
    } else {
      if (currentSelections.length < this.requiredTables()) {
        currentSelections.push(t);
      } else {
        // Replace oldest selection if quota is maxed
        currentSelections.shift();
        currentSelections.push(t);
      }
    }
    this.selectedTables.set(currentSelections);
  }

  canProceedToPayment(): boolean {
    if (this.orderType === 'TAKEAWAY') return true;
    return this.selectedTables().length === this.requiredTables();
  }

  goToStep(stepNumber: number) {
    if (this.isRestaurantClosed()) {
      this.toast.error("Restaurant is closed. Operations resume at 11 AM.");
      return;
    }
    this.currentStep.set(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateGuests(change: number) {
    const newCount = this.numberOfPeople() + change;
    if (newCount >= 1 && newCount <= 48) {
      this.numberOfPeople.set(newCount);
      this.selectedTables.set([]); // Reset tables since requirement changed
    }
  }

  generateTimeSlots() {
    const slots = [];
    for (let h = 11; h <= 21; h++) {
      const displayHour = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      slots.push(`${displayHour}:00 ${ampm}`, `${displayHour}:30 ${ampm}`);
    }
    this.availableSlots = slots;
  }

  handleCheckoutProcess() {
    if (this.isRestaurantClosed()) return;
    
    // Server-grade validation on the frontend
    const containsFood = this.cartItemsList().some(item => item.category !== 'drinks');
    if (!containsFood) {
      this.toast.error("Restaurant Policy: Please add at least one food item.");
      return;
    }

    if (this.paymentMethod === 'ONLINE') {
      this.showPaymentGateway = true;
      this.paymentStep = 'PROCESSING';
      
      // Simulate secure gateway delay
      setTimeout(() => {
        this.paymentStep = 'SUCCESS';
        setTimeout(() => {
          this.showPaymentGateway = false;
          this.executeOrderCreation('PAID', 'KILLA-PAY-' + Date.now());
        }, 1500);
      }, 2500);
    } else {
      this.executeOrderCreation();
    }
  }

  executeOrderCreation(paymentStatus: string = 'PENDING', transactionId: string = '') {
    this.loading = true;
    
    // Fallback Number() to ensure absolute strict typing to prevent 500 DB errors
    const verifiedTotalAmount = Number(this.cartService.totalPrice()) || 0;

    const formattedPayload = {
      orderType: this.orderType,
      numberOfPeople: this.numberOfPeople(),
      tableNumbers: this.selectedTables(),
      scheduledTime: new Date().toISOString(),
      paymentMethod: this.paymentMethod,
      paymentStatus: paymentStatus,
      transactionId: transactionId,
      totalAmount: verifiedTotalAmount,
      items: this.cartItemsList().map((item: any) => ({
        // FIX: Defensive property access using 'any' cast to prevent TS compilation error 2339
        menuItemId: item._id || item.menuItemId, 
        name: item.name || "Unknown Item",
        category: item.category || "General",
        quantity: Number(item.quantity) || 1, 
        variant: item.selectedVariant || "SINGLE",
        unitPrice: Number(item.computedPrice) || 0,
        instructions: item.instructions || ""
      }))
    };

    this.orderService.createOrder(formattedPayload).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.router.navigate(['/my-orders']);
        this.toast.success("Legendary Order Executed!");
      },
      error: (errorRes) => {
        this.loading = false;
        this.toast.error(errorRes.error?.msg || "Failed to process order.");
        this.cdr.detectChanges();
      }
    });
  }
}