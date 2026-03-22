import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';
import { FeedbackModalComponent } from '../../components/feedback-modal/feedback';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, FeedbackModalComponent, RouterLink],
  template: `
    <div class="mo-root">

      <!-- Feedback modal (unchanged integration) -->
      <app-feedback-modal
        [isVisible]="modalVisible"
        [isViewOnly]="isViewOnly"
        [orderId]="activeOrder?._id"
        [orderNumber]="activeOrder?.orderNumber"
        [items]="activeOrder?.items || []"
        [initialRating]="activeOrder?.feedback?.rating"
        [initialComment]="activeOrder?.feedback?.comment"
        [ownerReply]="activeOrder?.feedback?.ownerReply || ''"
        [dishRatings]="activeOrder?.feedback?.dishRatings || []"
        (close)="modalVisible = false"
        (refresh)="loadOrders()"
      ></app-feedback-modal>

      <!-- ── HEADER ─────────────────────────────────────────────────── -->
      <header class="mo-header">
        <div class="mo-header-inner">
          <div>
            <div class="mo-eyebrow">Your Account</div>
            <h1 class="mo-title">My <span class="mo-accent">Orders</span></h1>
            <p class="mo-sub">{{ orders().length }} order{{ orders().length !== 1 ? 's' : '' }} in your history</p>
          </div>
          <div class="mo-header-right">
            <div class="mo-live-pill" *ngIf="activeOrders().length > 0">
              <span class="mo-pulse"></span>
              {{ activeOrders().length }} active
            </div>
            <button class="mo-refresh-btn" (click)="loadOrders()" [class.spinning]="isLoading()">
              ↻
            </button>
          </div>
        </div>
      </header>

      <div class="mo-body">

        <!-- ── ACTIVE ORDERS SECTION (pinned to top) ─────────────────── -->
        <section class="mo-section" *ngIf="activeOrders().length > 0">
          <div class="mo-section-label mo-label-live">
            <span class="mo-pulse-sm"></span>
            Live Orders
          </div>

          <div class="mo-active-grid">
            <div class="mo-active-card" *ngFor="let order of activeOrders()">

              <!-- Top row -->
              <div class="mo-ac-top">
                <div>
                  <span class="mo-order-num">#{{ order.orderNumber }}</span>
                  <span class="mo-ac-time">{{ order.createdAt | date:'h:mm a' }}</span>
                </div>
                <span class="mo-status-chip" [ngClass]="'chip-' + order.orderStatus.toLowerCase()">
                  {{ order.orderStatus }}
                </span>
              </div>

              <!-- Progress bar -->
              <div class="mo-progress-wrap">
                <div class="mo-progress-track">
                  <div class="mo-progress-fill" [style.width]="getProgress(order.orderStatus)"></div>
                </div>
                <div class="mo-progress-steps">
                  <span [class.step-done]="isStepDone('NEW', order.orderStatus)">Placed</span>
                  <span [class.step-done]="isStepDone('PREPARING', order.orderStatus)">Preparing</span>
                  <span [class.step-done]="isStepDone('READY', order.orderStatus)">Ready</span>
                  <span [class.step-done]="isStepDone('COMPLETED', order.orderStatus)">Done</span>
                </div>
              </div>

              <!-- Service info -->
              <div class="mo-service-row">
                <span class="mo-service-badge" [ngClass]="order.orderType === 'DINE IN' ? 'sb-dine' : 'sb-take'">
                  {{ order.orderType === 'DINE IN' ? '🍽 Dine In' : '📦 Takeaway' }}
                </span>
                <span class="mo-table-badge" *ngIf="order.tableNumber || order.tableNumbers?.length">
                  🪑 Table {{ order.tableNumber || order.tableNumbers?.join(', ') }}
                </span>
                <span class="mo-sched-badge" *ngIf="order.scheduledTime">
                  ⏰ {{ order.scheduledTime | date:'h:mm a' }}
                </span>
                <span class="mo-wait-badge" *ngIf="order.orderStatus === 'NEW' || order.orderStatus === 'PREPARING'">
                  ~{{ calculateWait(order) }}m wait
                </span>
              </div>

              <!-- Items summary -->
              <div class="mo-items-compact">
                <div class="mo-item-row" *ngFor="let item of order.items">
                  <span class="mo-item-qty">{{ item.quantity }}×</span>
                  <span class="mo-item-name">{{ item.name }}</span>
                  <span class="mo-item-var" *ngIf="item.variant && item.variant !== 'SINGLE'">{{ item.variant }}</span>
                  <span class="mo-item-price">₹{{ item.unitPrice * item.quantity }}</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="mo-ac-footer">
                <div class="mo-ac-total">₹{{ order.totalAmount }}</div>
                <div class="mo-ac-payment">
                  <span class="mo-pay-chip" [ngClass]="order.paymentStatus === 'PAID' ? 'pc-paid' : 'pc-pending'">
                    {{ order.paymentStatus }}
                  </span>
                  <span class="mo-pay-method">{{ order.paymentMethod }}</span>
                </div>
                <button
                  *ngIf="order.orderStatus === 'NEW'"
                  class="mo-cancel-btn"
                  (click)="onCancel(order._id)">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── FILTERS ────────────────────────────────────────────────── -->
        <div class="mo-filters" *ngIf="pastOrders().length > 0 || activeOrders().length === 0">
          <div class="mo-filter-tabs">
            <button
              class="mo-ftab"
              *ngFor="let f of filters"
              [class.ftab-active]="activeFilter() === f.value"
              (click)="setFilter(f.value)">
              {{ f.label }}
              <span class="mo-ftab-count">{{ getFilterCount(f.value) }}</span>
            </button>
          </div>
        </div>

        <!-- ── PAST ORDERS ────────────────────────────────────────────── -->
        <section class="mo-section" *ngIf="filteredPastOrders().length > 0">
          <div class="mo-section-label" *ngIf="activeOrders().length > 0">Past Orders</div>

          <div class="mo-orders-list">
            <div
              class="mo-order-card"
              *ngFor="let order of filteredPastOrders(); let i = index"
              [style.animation-delay]="i * 40 + 'ms'"
              [class.mo-card-cancelled]="order.orderStatus === 'CANCELLED'">

              <!-- Card header -->
              <div class="mo-oc-head">
                <div class="mo-oc-left">
                  <span class="mo-order-num">#{{ order.orderNumber }}</span>
                  <span class="mo-oc-date">{{ order.createdAt | date:'d MMM yyyy, h:mm a' }}</span>
                </div>
                <div class="mo-oc-right">
                  <span class="mo-reply-badge" *ngIf="order.feedback?.ownerReply">
                    💬 Owner Replied
                  </span>
                  <span class="mo-status-chip" [ngClass]="'chip-' + order.orderStatus.toLowerCase()">
                    {{ order.orderStatus }}
                  </span>
                </div>
              </div>

              <!-- Service row -->
              <div class="mo-service-row mo-service-row-sm">
                <span class="mo-service-badge" [ngClass]="order.orderType === 'DINE IN' ? 'sb-dine' : 'sb-take'">
                  {{ order.orderType === 'DINE IN' ? '🍽 Dine In' : '📦 Takeaway' }}
                </span>
                <span class="mo-table-badge" *ngIf="order.tableNumber || order.tableNumbers?.length">
                  🪑 Table {{ order.tableNumber || order.tableNumbers?.join(', ') }}
                </span>
              </div>

              <!-- Items -->
              <div class="mo-items-compact">
                <div class="mo-item-row" *ngFor="let item of order.items">
                  <span class="mo-item-qty">{{ item.quantity }}×</span>
                  <span class="mo-item-name">{{ item.name }}</span>
                  <span class="mo-item-var" *ngIf="item.variant && item.variant !== 'SINGLE'">{{ item.variant }}</span>
                  <span class="mo-item-instr" *ngIf="item.instructions">"{{ item.instructions }}"</span>
                  <span class="mo-item-price">₹{{ item.unitPrice * item.quantity }}</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="mo-oc-footer">
                <div class="mo-oc-total-row">
                  <span class="mo-oc-total-lbl">Total</span>
                  <span class="mo-oc-total-val">₹{{ order.totalAmount }}</span>
                  <span class="mo-pay-chip mo-pay-chip-sm"
                    [ngClass]="order.paymentStatus === 'PAID' ? 'pc-paid' : 'pc-pending'">
                    {{ order.paymentMethod }} · {{ order.paymentStatus }}
                  </span>
                </div>

                <div class="mo-oc-actions">
                  <!-- Feedback for completed orders -->
                  <ng-container *ngIf="order.orderStatus === 'COMPLETED'">
                    <div
                      *ngIf="order.feedback?.isSubmitted; else rateBtn"
                      class="mo-feedback-pill"
                      [ngClass]="getRatingClass(order.feedback.rating)"
                      (click)="openFeedback(order, true)">
                      <span class="mo-rating-star">{{ order.feedback.rating }}★</span>
                      <span class="mo-rating-lbl">Your Review</span>
                      <span class="mo-rating-view" *ngIf="order.feedback?.ownerReply">· See Reply</span>
                    </div>
                    <ng-template #rateBtn>
                      <button class="mo-btn mo-btn-rate" (click)="openFeedback(order, false)">
                        Rate Order
                      </button>
                    </ng-template>
                  </ng-container>

                  <button
                    class="mo-btn mo-btn-reorder"
                    (click)="onReorder(order)"
                    [disabled]="order.orderStatus === 'CANCELLED'">
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── EMPTY STATE ────────────────────────────────────────────── -->
        <div class="mo-empty" *ngIf="orders().length === 0 && !isLoading()">
          <div class="mo-empty-icon">🍽️</div>
          <h3 class="mo-empty-title">No orders yet</h3>
          <p class="mo-empty-sub">Your culinary journey starts with your first order.</p>
          <a routerLink="/menu" class="mo-btn mo-btn-primary">Explore the Menu</a>
        </div>

        <!-- Empty filtered state -->
        <div class="mo-empty-filter" *ngIf="filteredPastOrders().length === 0 && activeOrders().length === 0 && orders().length > 0">
          <p>No orders match this filter.</p>
        </div>

        <!-- Loading skeleton -->
        <div class="mo-skeleton-list" *ngIf="isLoading() && orders().length === 0">
          <div class="mo-skeleton-card" *ngFor="let i of [1,2,3]"></div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --orange: #ff6600;
      --orange-dim: rgba(255,102,0,0.12);
      --green:  #22c55e;
      --blue:   #3b82f6;
      --amber:  #f59e0b;
      --red:    #ef4444;
      --bg:     #060607;
      --s1:     #0e0e10;
      --s2:     #161618;
      --s3:     #1e1e21;
      --border: rgba(255,255,255,0.06);
      --brite:  rgba(255,255,255,0.12);
      --text:   #f0f0f0;
      --muted:  #555;
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
      display: block;
    }

    /* ── Root ───────────────────────────────────────────────── */
    .mo-root {
      background: var(--bg);
      min-height: 100vh;
      color: var(--text);
    }

    /* ── Header ─────────────────────────────────────────────── */
    .mo-header {
      padding: 100px 24px 32px;
      background: linear-gradient(180deg, #0a0a0b 0%, transparent 100%);
      border-bottom: 1px solid var(--border);
    }
    .mo-header-inner {
      max-width: 760px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .mo-eyebrow {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }
    .mo-title {
      font-size: 2.6rem;
      font-weight: 900;
      letter-spacing: -1.5px;
      margin: 0 0 4px;
      line-height: 1;
    }
    .mo-accent { color: var(--orange); }
    .mo-sub { color: var(--muted); font-size: 0.82rem; margin: 0; }

    .mo-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .mo-live-pill {
      display: flex; align-items: center; gap: 7px;
      background: rgba(0,232,122,0.08); border: 1px solid rgba(0,232,122,0.2);
      color: var(--green); font-size: 0.7rem; font-weight: 800;
      padding: 7px 14px; border-radius: 20px; letter-spacing: 0.5px;
    }
    .mo-pulse {
      width: 6px; height: 6px; border-radius: 50%; background: var(--green);
      box-shadow: 0 0 6px var(--green);
      animation: mo-pulse 1.8s ease-in-out infinite;
    }
    @keyframes mo-pulse { 0%,100%{opacity:.3}50%{opacity:1} }

    .mo-refresh-btn {
      background: var(--s2); border: 1px solid var(--border);
      color: var(--muted); width: 34px; height: 34px; border-radius: 8px;
      font-size: 1rem; cursor: pointer; display: flex; align-items: center;
      justify-content: center; transition: color 0.2s, transform 0.4s;
    }
    .mo-refresh-btn:hover { color: var(--text); }
    .mo-refresh-btn.spinning { animation: mo-spin 0.6s linear infinite; }
    @keyframes mo-spin { to { transform: rotate(360deg); } }

    /* ── Body ───────────────────────────────────────────────── */
    .mo-body {
      max-width: 760px;
      margin: 0 auto;
      padding: 28px 24px 80px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* ── Section labels ──────────────────────────────────────── */
    .mo-section-label {
      font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 2.5px; color: var(--muted); margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .mo-label-live { color: var(--green); }
    .mo-pulse-sm {
      width: 5px; height: 5px; border-radius: 50%; background: var(--green);
      animation: mo-pulse 1.8s infinite;
    }

    /* ── Active order card ──────────────────────────────────── */
    .mo-active-grid { display: flex; flex-direction: column; gap: 14px; }
    .mo-active-card {
      background: var(--s1);
      border: 1px solid var(--brite);
      border-top: 3px solid var(--orange);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      animation: mo-fadein 0.35s ease both;
    }
    @keyframes mo-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

    .mo-ac-top {
      display: flex; justify-content: space-between; align-items: center;
    }

    /* Progress */
    .mo-progress-wrap { display: flex; flex-direction: column; gap: 8px; }
    .mo-progress-track {
      height: 5px; background: var(--s3); border-radius: 3px; overflow: hidden;
    }
    .mo-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--orange), #ffaa44);
      border-radius: 3px;
      transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
    }
    .mo-progress-steps {
      display: flex; justify-content: space-between;
      font-size: 0.58rem; font-weight: 700; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .step-done { color: var(--orange); }

    /* ── Service / table / sched badges ────────────────────── */
    .mo-service-row {
      display: flex; flex-wrap: wrap; gap: 7px; align-items: center;
    }
    .mo-service-row-sm { margin: -2px 0 0; }
    .mo-service-badge {
      font-size: 0.66rem; font-weight: 700; padding: 3px 9px; border-radius: 5px;
    }
    .sb-dine { background: rgba(59,130,246,0.12); color: var(--blue); border: 1px solid rgba(59,130,246,0.2); }
    .sb-take { background: rgba(245,158,11,0.12); color: var(--amber); border: 1px solid rgba(245,158,11,0.2); }
    .mo-table-badge {
      font-size: 0.66rem; font-weight: 700; padding: 3px 9px; border-radius: 5px;
      background: rgba(34,197,94,0.08); color: var(--green);
      border: 1px solid rgba(34,197,94,0.15);
    }
    .mo-sched-badge {
      font-size: 0.66rem; font-weight: 700; padding: 3px 9px; border-radius: 5px;
      background: rgba(245,158,11,0.1); color: var(--amber);
      border: 1px solid rgba(245,158,11,0.18);
    }
    .mo-wait-badge {
      font-size: 0.66rem; font-weight: 700; padding: 3px 9px; border-radius: 5px;
      background: var(--orange-dim); color: var(--orange);
      border: 1px solid rgba(255,102,0,0.2);
    }

    /* ── Items compact list ──────────────────────────────────── */
    .mo-items-compact {
      background: rgba(0,0,0,0.22);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .mo-item-row {
      display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap;
      font-size: 0.84rem;
    }
    .mo-item-qty { color: var(--orange); font-weight: 800; flex-shrink: 0; width: 22px; }
    .mo-item-name { font-weight: 600; color: #e5e5e5; flex: 1; min-width: 0; }
    .mo-item-var {
      font-size: 0.62rem; font-weight: 800; padding: 1px 6px; border-radius: 4px;
      background: rgba(255,255,255,0.08); color: #aaa; flex-shrink: 0;
    }
    .mo-item-instr {
      font-size: 0.72rem; color: #facc15; font-style: italic;
      width: 100%; padding-left: 29px; margin-top: -3px;
    }
    .mo-item-price {
      font-size: 0.8rem; font-weight: 700; color: var(--muted);
      flex-shrink: 0; margin-left: auto;
    }

    /* Active card footer */
    .mo-ac-footer {
      display: flex; align-items: center; gap: 12px;
      border-top: 1px solid var(--border); padding-top: 14px; flex-wrap: wrap;
    }
    .mo-ac-total { font-size: 1.3rem; font-weight: 900; color: var(--orange); margin-right: auto; }
    .mo-ac-payment { display: flex; align-items: center; gap: 7px; }
    .mo-pay-method { font-size: 0.7rem; color: var(--muted); font-weight: 700; }

    .mo-cancel-btn {
      background: none; border: 1px solid rgba(239,68,68,0.3);
      color: var(--red); padding: 6px 14px; border-radius: 7px;
      font-size: 0.75rem; font-weight: 700; cursor: pointer;
      transition: background 0.2s;
    }
    .mo-cancel-btn:hover { background: rgba(239,68,68,0.08); }

    /* ── Filters ─────────────────────────────────────────────── */
    .mo-filters { display: flex; }
    .mo-filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .mo-ftab {
      background: var(--s1); border: 1px solid var(--border);
      color: var(--muted); padding: 7px 14px; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.15s;
    }
    .mo-ftab:hover { color: var(--text); border-color: var(--brite); }
    .mo-ftab.ftab-active { background: var(--orange-dim); color: var(--orange); border-color: rgba(255,102,0,0.3); }
    .mo-ftab-count {
      background: var(--s3); border-radius: 10px; padding: 1px 7px;
      font-size: 0.6rem; font-weight: 800;
    }

    /* ── Past order card ────────────────────────────────────── */
    .mo-orders-list { display: flex; flex-direction: column; gap: 12px; }
    .mo-order-card {
      background: var(--s1); border: 1px solid var(--border); border-radius: 16px;
      padding: 18px 20px; display: flex; flex-direction: column; gap: 12px;
      animation: mo-fadein 0.3s ease both;
      transition: border-color 0.2s;
    }
    .mo-order-card:hover { border-color: var(--brite); }
    .mo-card-cancelled { opacity: 0.5; }

    .mo-oc-head {
      display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;
    }
    .mo-oc-left { display: flex; flex-direction: column; gap: 3px; }
    .mo-oc-right { display: flex; align-items: center; gap: 8px; }
    .mo-oc-date { font-size: 0.7rem; color: var(--muted); }

    /* Status chips */
    .mo-order-num {
      font-family: 'DM Mono', monospace; font-size: 0.95rem; font-weight: 800;
      color: var(--orange);
    }
    .mo-status-chip {
      font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; padding: 3px 9px; border-radius: 5px;
    }
    .chip-new        { background: rgba(59,130,246,0.12); color: var(--blue); }
    .chip-preparing  { background: rgba(245,158,11,0.12); color: var(--amber); }
    .chip-ready      { background: rgba(34,197,94,0.12); color: var(--green); }
    .chip-completed  { background: rgba(100,100,100,0.15); color: #888; }
    .chip-cancelled  { background: rgba(239,68,68,0.1); color: var(--red); }

    .mo-reply-badge {
      font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 4px;
      background: rgba(34,197,94,0.15); color: var(--green); white-space: nowrap;
    }

    /* Past order footer */
    .mo-oc-footer { border-top: 1px solid var(--border); padding-top: 14px; display: flex; flex-direction: column; gap: 12px; }
    .mo-oc-total-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mo-oc-total-lbl { font-size: 0.72rem; color: var(--muted); font-weight: 700; }
    .mo-oc-total-val { font-size: 1.25rem; font-weight: 900; color: var(--orange); margin-right: auto; }
    .mo-pay-chip {
      font-size: 0.62rem; font-weight: 800; padding: 2px 8px; border-radius: 4px;
    }
    .mo-pay-chip-sm { font-size: 0.6rem; }
    .pc-paid    { background: rgba(34,197,94,0.12); color: var(--green); }
    .pc-pending { background: rgba(239,68,68,0.1); color: var(--red); }

    .mo-oc-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* Feedback pill */
    .mo-feedback-pill {
      display: flex; align-items: center; gap: 8px;
      background: var(--s2); border: 1px solid var(--border);
      padding: 8px 14px; border-radius: 10px; cursor: pointer;
      transition: border-color 0.2s, transform 0.2s;
    }
    .mo-feedback-pill:hover { border-color: var(--brite); transform: translateY(-1px); }
    .mo-rating-star { font-weight: 900; color: #facc15; font-size: 0.9rem; }
    .mo-rating-lbl { font-size: 0.7rem; font-weight: 700; color: var(--muted); }
    .mo-rating-view { font-size: 0.7rem; color: var(--green); font-weight: 700; }

    /* Buttons */
    .mo-btn {
      padding: 9px 18px; border-radius: 9px; font-size: 0.8rem;
      font-weight: 800; cursor: pointer; border: none; transition: opacity 0.15s, transform 0.15s;
    }
    .mo-btn:hover:not([disabled]) { opacity: 0.85; transform: translateY(-1px); }
    .mo-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .mo-btn-rate    { background: var(--orange); color: #fff; }
    .mo-btn-reorder { background: var(--s3); color: var(--text); border: 1px solid var(--brite); }
    .mo-btn-primary {
      background: var(--orange); color: #fff; padding: 13px 32px;
      border-radius: 40px; text-decoration: none; display: inline-block;
      font-weight: 900; font-size: 0.9rem; margin-top: 8px;
    }

    /* ── Empty / skeleton ────────────────────────────────────── */
    .mo-empty {
      text-align: center; padding: 80px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .mo-empty-icon { font-size: 3rem; opacity: 0.2; }
    .mo-empty-title { font-size: 1.4rem; font-weight: 900; margin: 0; }
    .mo-empty-sub { color: var(--muted); font-size: 0.85rem; margin: 0; }
    .mo-empty-filter { text-align: center; color: var(--muted); font-size: 0.82rem; padding: 30px; }

    .mo-skeleton-list { display: flex; flex-direction: column; gap: 12px; }
    .mo-skeleton-card {
      background: var(--s1); border: 1px solid var(--border); border-radius: 16px;
      height: 160px; animation: mo-shimmer 1.4s ease-in-out infinite;
    }
    @keyframes mo-shimmer {
      0%,100%{opacity:0.4} 50%{opacity:0.7}
    }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 600px) {
      .mo-header { padding: 90px 16px 24px; }
      .mo-body { padding: 20px 16px 60px; }
      .mo-title { font-size: 2rem; }
      .mo-oc-actions { flex-direction: column; align-items: flex-start; width: 100%; }
      .mo-btn { width: 100%; text-align: center; }
    }
  `],
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private toast        = inject(ToastService);
  private router       = inject(Router);

  orders     = signal<any[]>([]);
  isLoading  = signal<boolean>(false);
  activeFilter = signal<string>('all');

  modalVisible = false;
  isViewOnly   = false;
  activeOrder: any = null;

  private refreshInterval: any;

  // Filters config
  readonly filters = [
    { label: 'All',       value: 'all'       },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  // ── Computed ──────────────────────────────────────────────────────────
  // Active (live) orders — always shown at top
  activeOrders = computed(() =>
    this.orders().filter(o => ['NEW', 'PREPARING', 'READY'].includes(o.orderStatus))
  );

  // Past orders — sorted newest first (FIX: most recent at top)
  pastOrders = computed(() =>
    this.orders()
      .filter(o => ['COMPLETED', 'CANCELLED'].includes(o.orderStatus))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

  filteredPastOrders = computed(() => {
    const past = this.pastOrders();
    const f    = this.activeFilter();
    if (f === 'all')       return past;
    if (f === 'completed') return past.filter(o => o.orderStatus === 'COMPLETED');
    if (f === 'cancelled') return past.filter(o => o.orderStatus === 'CANCELLED');
    return past;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit() {
    this.loadOrders();
    // Auto-refresh every 20s (only meaningful when active orders exist)
    this.refreshInterval = setInterval(() => {
      if (this.activeOrders().length > 0) this.loadOrders();
    }, 20000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
  }

  // ── Data ───────────────────────────────────────────────────────────────
  loadOrders() {
    this.isLoading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        // Sort all orders newest-first at load time
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.orders.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.show('Failed to load orders', 'error');
        this.isLoading.set(false);
      },
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────
  onCancel(orderId: string) {
    if (!confirm('Cancel this order?')) return;
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.toast.show('Order cancelled.', 'success');
        this.loadOrders();
      },
      error: (err) => this.toast.show(err.error?.msg || 'Cancellation failed.', 'error'),
    });
  }

  /**
   * REORDER FIX: The cart service expects items with a `pricing` object
   * (matching the MenuItem schema: { type, price, priceHalf, priceFull }).
   * Order history items only have a flat `unitPrice` field.
   * We rebuild a pricing-compatible object so the cart total doesn't show NaN.
   */
  onReorder(order: any) {
    const cartItems = order.items.map((item: any) => ({
      menuItemId: item.menuItemId,
      _id:        item.menuItemId,   // cart may key on either
      name:       item.name,
      category:   item.category,
      imageUrl:   item.imageUrl || '',
      quantity:   item.quantity,
      selectedVariant: item.variant || 'SINGLE',
      // Rebuild pricing object the cart service reads totals from
      pricing: {
        type:      item.variant && item.variant !== 'SINGLE' ? 'HALF_FULL' : 'SINGLE',
        price:     item.unitPrice,   // used by SINGLE items
        priceHalf: item.variant === 'HALF' ? item.unitPrice : item.unitPrice,
        priceFull: item.variant === 'FULL' ? item.unitPrice : item.unitPrice,
      },
      // Keep unitPrice too as a direct fallback
      unitPrice:    item.unitPrice,
      instructions: item.instructions || '',
    }));

    this.orderService.reorderToCart({ ...order, items: cartItems });
    this.toast.show('Items added to cart!', 'success');
    this.router.navigate(['/cart']);
  }

  openFeedback(order: any, viewOnly: boolean) {
    this.activeOrder = order;
    this.isViewOnly  = viewOnly;
    this.modalVisible = true;
  }

  setFilter(val: string) {
    this.activeFilter.set(val);
  }

  getFilterCount(val: string): number {
    const past = this.pastOrders();
    if (val === 'all')       return past.length;
    if (val === 'completed') return past.filter(o => o.orderStatus === 'COMPLETED').length;
    if (val === 'cancelled') return past.filter(o => o.orderStatus === 'CANCELLED').length;
    return 0;
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  getProgress(status: string): string {
    const map: Record<string, string> = {
      NEW:       '20%',
      PREPARING: '58%',
      READY:     '88%',
      COMPLETED: '100%',
    };
    return map[status] || '0%';
  }

  isStepDone(step: string, currentStatus: string): boolean {
    const order = ['NEW', 'PREPARING', 'READY', 'COMPLETED'];
    return order.indexOf(currentStatus) >= order.indexOf(step);
  }

  calculateWait(order: any): number {
    return order.orderStatus === 'NEW' ? 25 : 12;
  }

  getRatingClass(rating: number): string {
    if (rating >= 4) return 'excellent';
    if (rating === 3) return 'good';
    return 'poor';
  }
}