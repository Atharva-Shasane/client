import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="dash-page">

      <!-- ── Ambient BG ── -->
      <div class="dash-bg">
        <div class="db-blob blob-1"></div>
        <div class="db-blob blob-2"></div>
        <div class="db-grain"></div>
      </div>

      <!-- ══════════════════════════════════
           HEADER
      ══════════════════════════════════ -->
      <header class="dash-header">
        <div class="dh-left">
          <p class="dh-eyebrow">
            <span class="eyebrow-dot"></span>
            Owner Panel
          </p>
          <h1 class="dh-title">Kitchen <span class="accent">Control</span></h1>
          <p class="dh-date">{{ todayLabel }}</p>
        </div>

        <!-- KPI strip -->
        <div class="kpi-strip">
          <div class="kpi-tile kpi-blue">
            <span class="kpi-num">{{ newOrders().length }}</span>
            <span class="kpi-label">Incoming</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-tile kpi-amber">
            <span class="kpi-num">{{ prepOrders().length }}</span>
            <span class="kpi-label">Preparing</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-tile kpi-green">
            <span class="kpi-num">{{ readyOrders().length }}</span>
            <span class="kpi-label">Ready</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-tile">
            <span class="kpi-num">{{ todayOrdersCount() }}</span>
            <span class="kpi-label">Today</span>
          </div>
        </div>

        <!-- Sync controls -->
        <div class="dh-right">
          <p class="sync-time" *ngIf="lastSyncTime()">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            {{ lastSyncTime() | date:'h:mm a' }}
          </p>
          <button class="refresh-btn" (click)="refresh()" [disabled]="isRefreshing()">
            <svg class="refresh-ico" [class.spinning]="isRefreshing()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            {{ isRefreshing() ? 'Syncing…' : 'Refresh' }}
          </button>
        </div>
      </header>

      <!-- ══════════════════════════════════
           KANBAN BOARD
      ══════════════════════════════════ -->
      <div class="kanban">

        <!-- ── INCOMING ── -->
        <div class="k-col">
          <div class="k-col-head k-head-blue">
            <div class="k-col-title">
              <span class="k-dot k-dot-blue"></span>
              Incoming
            </div>
            <span class="k-badge">{{ newOrders().length }}</span>
          </div>
          <div class="k-col-body">

            <div
              class="order-card"
              *ngFor="let order of newOrders()"
              (click)="openDetail(order)">
              <!-- Top row -->
              <div class="oc-top">
                <span class="oc-ref">#{{ order.orderNumber }}</span>
                <div class="oc-badges">
                  <span class="type-badge" [class.tb-dine]="order.orderType === 'DINE IN'" [class.tb-take]="order.orderType !== 'DINE IN'">
                    {{ order.orderType === 'DINE IN' ? 'Dine In' : 'Takeaway' }}
                  </span>
                  <span class="pay-badge" [class.pb-cash]="order.paymentMethod === 'CASH'" [class.pb-online]="order.paymentMethod !== 'CASH'">
                    {{ order.paymentMethod }}
                  </span>
                </div>
              </div>

              <!-- Customer -->
              <div class="oc-cust">
                <div class="oc-avatar">{{ getInitials(order.user?.name) }}</div>
                <div class="oc-cust-info">
                  <p class="oc-name">{{ order.user?.name || 'Guest' }}</p>
                  <p class="oc-phone">{{ order.user?.mobile || '—' }}</p>
                </div>
                <span class="oc-total">₹{{ order.totalAmount }}</span>
              </div>

              <!-- Logistics chips -->
              <div class="oc-logistics" (click)="$event.stopPropagation()">
                <span class="log-chip" *ngIf="order.tableNumbers?.length">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  T{{ order.tableNumbers.join(', T') }}
                </span>
                <span class="log-chip" *ngIf="order.orderType === 'DINE IN' && order.numberOfPeople">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ order.numberOfPeople }} guests
                </span>
                <span class="log-chip log-time" *ngIf="order.scheduledTime">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ order.scheduledTime | date:'h:mm a' }}
                </span>
              </div>

              <!-- Items -->
              <div class="oc-items">
                <div class="oc-item" *ngFor="let item of order.items">
                  <div class="oci-main">
                    <span class="oci-qty">{{ item.quantity }}×</span>
                    <span class="oci-name">{{ item.name }}</span>
                    <span class="var-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                      [class.vp-half]="item.variant === 'HALF'"
                      [class.vp-full]="item.variant === 'FULL'">
                      {{ item.variant }}
                    </span>
                  </div>
                  <div class="oci-note" *ngIf="item.instructions">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                    {{ item.instructions }}
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="oc-actions" (click)="$event.stopPropagation()">
                <button class="act-btn act-start" (click)="updateStatus(order._id, 'PREPARING')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Start Preparing
                </button>
                <button class="act-btn act-cancel" (click)="confirmCancel(order)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>

            <div class="col-empty" *ngIf="newOrders().length === 0">
              <div class="ce-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p>All clear — no incoming orders</p>
            </div>
          </div>
        </div>

        <!-- ── PREPARING ── -->
        <div class="k-col">
          <div class="k-col-head k-head-amber">
            <div class="k-col-title">
              <span class="k-dot k-dot-amber"></span>
              Preparing
            </div>
            <span class="k-badge">{{ prepOrders().length }}</span>
          </div>
          <div class="k-col-body">

            <div
              class="order-card"
              *ngFor="let order of prepOrders()"
              (click)="openDetail(order)">
              <div class="oc-top">
                <span class="oc-ref">#{{ order.orderNumber }}</span>
                <div class="elapsed-chip" [class.elapsed-warn]="getDuration(order.updatedAt) > 15">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ getDuration(order.updatedAt) }}m
                </div>
              </div>

              <div class="oc-cust">
                <div class="oc-avatar">{{ getInitials(order.user?.name) }}</div>
                <div class="oc-cust-info">
                  <p class="oc-name">{{ order.user?.name || 'Guest' }}</p>
                  <p class="oc-phone">{{ order.user?.mobile || '—' }}</p>
                </div>
                <span class="oc-total">₹{{ order.totalAmount }}</span>
              </div>

              <div class="oc-logistics" (click)="$event.stopPropagation()">
                <span class="log-chip" *ngIf="order.tableNumbers?.length">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  T{{ order.tableNumbers.join(', T') }}
                </span>
                <span class="log-chip" *ngIf="order.numberOfPeople">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ order.numberOfPeople }} guests
                </span>
                <span class="log-chip log-time" *ngIf="order.scheduledTime">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ order.scheduledTime | date:'h:mm a' }}
                </span>
                <span class="log-chip">
                  {{ order.orderType === 'DINE IN' ? 'Dine In' : 'Takeaway' }}
                </span>
              </div>

              <div class="oc-items">
                <div class="oc-item" *ngFor="let item of order.items">
                  <div class="oci-main">
                    <span class="oci-qty">{{ item.quantity }}×</span>
                    <span class="oci-name">{{ item.name }}</span>
                    <span class="var-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                      [class.vp-half]="item.variant === 'HALF'"
                      [class.vp-full]="item.variant === 'FULL'">
                      {{ item.variant }}
                    </span>
                  </div>
                  <div class="oci-note" *ngIf="item.instructions">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                    {{ item.instructions }}
                  </div>
                </div>
              </div>

              <div class="oc-actions" (click)="$event.stopPropagation()">
                <button class="act-btn act-ready" (click)="updateStatus(order._id, 'READY')">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Mark Ready
                </button>
                <button class="act-btn act-cancel" (click)="confirmCancel(order)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>

            <div class="col-empty" *ngIf="prepOrders().length === 0">
              <div class="ce-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <p>Kitchen is clear</p>
            </div>
          </div>
        </div>

        <!-- ── READY ── -->
        <div class="k-col">
          <div class="k-col-head k-head-green">
            <div class="k-col-title">
              <span class="k-dot k-dot-green"></span>
              Ready to Serve
            </div>
            <span class="k-badge">{{ readyOrders().length }}</span>
          </div>
          <div class="k-col-body">

            <div
              class="order-card"
              *ngFor="let order of readyOrders()"
              [class.card-unpaid]="order.paymentStatus === 'PENDING'"
              (click)="openDetail(order)">

              <div class="oc-top">
                <span class="oc-ref">#{{ order.orderNumber }}</span>
                <span class="total-chip">₹{{ order.totalAmount }}</span>
              </div>

              <!-- Payment status -->
              <div class="pay-alert" *ngIf="order.paymentStatus === 'PENDING'" (click)="$event.stopPropagation()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Collect {{ order.paymentMethod }} Payment
              </div>
              <div class="pay-ok" *ngIf="order.paymentStatus === 'PAID'" (click)="$event.stopPropagation()">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ order.paymentMethod }} Paid
              </div>

              <div class="oc-cust">
                <div class="oc-avatar">{{ getInitials(order.user?.name) }}</div>
                <div class="oc-cust-info">
                  <p class="oc-name">{{ order.user?.name || 'Guest' }}</p>
                  <p class="oc-phone">{{ order.user?.mobile || '—' }}</p>
                </div>
              </div>

              <div class="oc-logistics" (click)="$event.stopPropagation()">
                <span class="log-chip" *ngIf="order.tableNumbers?.length">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  T{{ order.tableNumbers.join(', T') }}
                </span>
                <span class="log-chip" *ngIf="order.numberOfPeople">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ order.numberOfPeople }}p
                </span>
                <span class="log-chip log-time" *ngIf="order.scheduledTime">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ order.scheduledTime | date:'h:mm a' }}
                </span>
              </div>

              <div class="oc-items">
                <div class="oc-item" *ngFor="let item of order.items">
                  <div class="oci-main">
                    <span class="oci-qty">{{ item.quantity }}×</span>
                    <span class="oci-name">{{ item.name }}</span>
                    <span class="var-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                      [class.vp-half]="item.variant === 'HALF'"
                      [class.vp-full]="item.variant === 'FULL'">
                      {{ item.variant }}
                    </span>
                  </div>
                  <div class="oci-note" *ngIf="item.instructions">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                    {{ item.instructions }}
                  </div>
                </div>
              </div>

              <div class="oc-actions" (click)="$event.stopPropagation()">
                <button class="act-btn act-complete" (click)="handleCompletion(order)">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ order.paymentStatus === 'PENDING' ? 'Collect & Complete' : 'Complete Order' }}
                </button>
                <button class="act-btn act-cancel" (click)="confirmCancel(order)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>

            <div class="col-empty" *ngIf="readyOrders().length === 0">
              <div class="ce-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p>No orders waiting</p>
            </div>
          </div>
        </div>

      </div><!-- /kanban -->

      <!-- ══════════════════════════════════
           HISTORY TABLE
      ══════════════════════════════════ -->
      <section class="history-section">
        <div class="hs-head">
          <div>
            <div class="section-label">
              <span class="label-dot"></span>
              Order History
            </div>
            <p class="hs-count">{{ filteredHistory().length }} records</p>
          </div>
          <div class="hs-filters">
            <button
              class="hf-btn"
              *ngFor="let f of historyFilters"
              [class.hf-active]="historyFilter() === f.value"
              (click)="updateHistoryFilter(f.value)">
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="hist-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Table / Guests</th>
                <th>Time</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of filteredHistory()"
                [class.row-cancelled]="order.orderStatus === 'CANCELLED'">
                <td>
                  <button class="tbl-ref" (click)="openDetail(order)">#{{ order.orderNumber }}</button>
                </td>
                <td>
                  <div class="td-stack">
                    <span class="td-main">{{ order.user?.name || 'Guest' }}</span>
                    <span class="td-sub">{{ order.user?.mobile || '—' }}</span>
                  </div>
                </td>
                <td>
                  <span class="type-badge" [class.tb-dine]="order.orderType === 'DINE IN'" [class.tb-take]="order.orderType !== 'DINE IN'">
                    {{ order.orderType === 'DINE IN' ? 'Dine In' : 'Takeaway' }}
                  </span>
                </td>
                <td>
                  <div class="td-stack">
                    <span class="td-main" *ngIf="order.tableNumbers?.length">T{{ order.tableNumbers.join(', T') }}</span>
                    <span class="td-sub" *ngIf="order.numberOfPeople">{{ order.numberOfPeople }} guests</span>
                    <span class="td-sub" *ngIf="!order.tableNumbers?.length && !order.numberOfPeople">—</span>
                  </div>
                </td>
                <td>
                  <span class="td-time" *ngIf="order.scheduledTime">{{ order.scheduledTime | date:'h:mm a' }}</span>
                  <span class="td-sub" *ngIf="!order.scheduledTime">—</span>
                </td>
                <td>
                  <div class="td-stack">
                    <span class="td-main">{{ order.paymentMethod }}</span>
                    <span class="pay-status-pill" [class.psp-paid]="order.paymentStatus === 'PAID'" [class.psp-pend]="order.paymentStatus !== 'PAID'">
                      {{ order.paymentStatus }}
                    </span>
                  </div>
                </td>
                <td class="td-amount">₹{{ order.totalAmount }}</td>
                <td>
                  <span class="status-pill" [ngClass]="getStatusClass(order.orderStatus)">
                    {{ order.orderStatus }}
                  </span>
                </td>
                <td class="td-sub">{{ order.updatedAt | date:'d MMM, h:mm a' }}</td>
                <td>
                  <div class="tbl-actions">
                    <button class="tbl-btn tbl-view" (click)="openDetail(order)">View</button>
                    <button class="tbl-btn tbl-cancel"
                      *ngIf="order.orderStatus !== 'CANCELLED'"
                      (click)="confirmCancel(order)">Cancel</button>
                    <span class="voided-label" *ngIf="order.orderStatus === 'CANCELLED'">Voided</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredHistory().length === 0">
                <td colspan="10" class="empty-row">No records for this period.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div><!-- /dash-page -->

    <!-- ══════════════════════════════════
         MODAL: ORDER DETAIL
    ══════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="detailsOrder" (click)="closeDetail($event)">
      <div class="modal-box modal-detail">
        <div class="modal-head">
          <div class="mh-left">
            <h2 class="modal-title">Order <span class="accent">#{{ detailsOrder.orderNumber }}</span></h2>
            <span class="status-pill mt4" [ngClass]="getStatusClass(detailsOrder.orderStatus)">{{ detailsOrder.orderStatus }}</span>
          </div>
          <button class="modal-close" (click)="detailsOrder = null">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Info grid -->
          <div class="info-grid">
            <div class="info-tile">
              <div class="it-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div class="it-body">
                <p class="it-label">Customer</p>
                <p class="it-value">{{ detailsOrder.user?.name || 'Guest' }}</p>
                <p class="it-sub">{{ detailsOrder.user?.mobile || 'No phone' }}</p>
                <p class="it-sub">{{ detailsOrder.user?.email || '' }}</p>
              </div>
            </div>
            <div class="info-tile">
              <div class="it-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
              </div>
              <div class="it-body">
                <p class="it-label">Service</p>
                <p class="it-value">{{ detailsOrder.orderType }}</p>
                <p class="it-sub" *ngIf="detailsOrder.tableNumbers?.length">Tables: T{{ detailsOrder.tableNumbers.join(', T') }}</p>
                <p class="it-sub" *ngIf="detailsOrder.numberOfPeople">{{ detailsOrder.numberOfPeople }} guests</p>
              </div>
            </div>
            <div class="info-tile">
              <div class="it-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="it-body">
                <p class="it-label">{{ detailsOrder.orderType === 'DINE IN' ? 'Arrival' : 'Pickup' }}</p>
                <p class="it-value it-time" *ngIf="detailsOrder.scheduledTime">{{ detailsOrder.scheduledTime | date:'h:mm a' }}</p>
                <p class="it-sub" *ngIf="!detailsOrder.scheduledTime">Not set</p>
                <p class="it-sub">Placed: {{ detailsOrder.createdAt | date:'d MMM, h:mm a' }}</p>
              </div>
            </div>
            <div class="info-tile">
              <div class="it-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div class="it-body">
                <p class="it-label">Payment</p>
                <p class="it-value">{{ detailsOrder.paymentMethod }}</p>
                <span class="pay-status-pill mt4"
                  [class.psp-paid]="detailsOrder.paymentStatus === 'PAID'"
                  [class.psp-pend]="detailsOrder.paymentStatus !== 'PAID'">
                  {{ detailsOrder.paymentStatus }}
                </span>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="detail-items-section">
            <div class="section-label" style="margin-bottom:12px">
              <span class="label-dot"></span>
              Items Ordered
            </div>
            <div class="detail-items-list">
              <div class="di-row" *ngFor="let item of detailsOrder.items">
                <div class="di-left">
                  <span class="di-qty">{{ item.quantity }}×</span>
                  <div class="di-info">
                    <div class="di-name">
                      {{ item.name }}
                      <span class="var-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                        [class.vp-half]="item.variant === 'HALF'"
                        [class.vp-full]="item.variant === 'FULL'">
                        {{ item.variant }}
                      </span>
                    </div>
                    <div class="di-note" *ngIf="item.instructions">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                      {{ item.instructions }}
                    </div>
                  </div>
                </div>
                <span class="di-price">₹{{ item.unitPrice * item.quantity }}</span>
              </div>
            </div>
            <div class="detail-total">
              <span>Total</span>
              <span class="dt-amount">₹{{ detailsOrder.totalAmount }}</span>
            </div>
          </div>

          <!-- Modal actions -->
          <div class="modal-actions" *ngIf="isActiveOrder(detailsOrder)">
            <button class="mact-btn mact-start"
              *ngIf="detailsOrder.orderStatus === 'NEW'"
              (click)="updateStatusAndClose(detailsOrder._id, 'PREPARING')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Preparing
            </button>
            <button class="mact-btn mact-ready"
              *ngIf="detailsOrder.orderStatus === 'PREPARING'"
              (click)="updateStatusAndClose(detailsOrder._id, 'READY')">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Mark Ready
            </button>
            <button class="mact-btn mact-complete"
              *ngIf="detailsOrder.orderStatus === 'READY'"
              (click)="handleCompletionFromModal(detailsOrder)">
              {{ detailsOrder.paymentStatus === 'PENDING' ? 'Collect & Complete' : 'Complete Order' }}
            </button>
            <button class="mact-btn mact-cancel" (click)="confirmCancelFromModal(detailsOrder)">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════
         MODAL: PAYMENT CONFIRMATION
    ══════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="showPaymentModal" (click)="closePayModal($event)">
      <div class="modal-box modal-pay">
        <div class="modal-head">
          <div>
            <h2 class="modal-title">Confirm Payment</h2>
            <p class="modal-sub">Order #{{ pendingOrder?.orderNumber }}</p>
          </div>
          <button class="modal-close" (click)="showPaymentModal = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="modal-body pay-body">
          <div class="pay-cust">
            <div class="oc-avatar avatar-lg">{{ getInitials(pendingOrder?.user?.name) }}</div>
            <div>
              <p class="oc-name">{{ pendingOrder?.user?.name || 'Guest' }}</p>
              <p class="oc-phone">{{ pendingOrder?.user?.mobile || '—' }}</p>
            </div>
          </div>
          <div class="pay-method-banner" [class.pmb-cash]="pendingOrder?.paymentMethod === 'CASH'" [class.pmb-online]="pendingOrder?.paymentMethod !== 'CASH'">
            <div class="pmb-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <rect *ngIf="pendingOrder?.paymentMethod === 'CASH'" x="2" y="6" width="20" height="12" rx="2"/><circle *ngIf="pendingOrder?.paymentMethod === 'CASH'" cx="12" cy="12" r="3"/>
                <rect *ngIf="pendingOrder?.paymentMethod !== 'CASH'" x="1" y="4" width="22" height="16" rx="2"/><line *ngIf="pendingOrder?.paymentMethod !== 'CASH'" x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <p class="pmb-method">{{ pendingOrder?.paymentMethod }}</p>
              <p class="pmb-hint">{{ pendingOrder?.paymentMethod === 'CASH' ? 'Collect cash from the customer' : 'Verify online payment received' }}</p>
            </div>
          </div>
          <div class="pay-amount-box">
            <p class="pab-label">Amount to Collect</p>
            <p class="pab-amount">₹{{ pendingOrder?.totalAmount }}</p>
          </div>
          <div class="modal-foot-btns">
            <button class="foot-btn foot-ghost" (click)="showPaymentModal = false">Not Yet</button>
            <button class="foot-btn foot-confirm" (click)="completeWithPayment()">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Confirm & Close Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════
         MODAL: CANCEL CONFIRMATION
    ══════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="showCancelModal" (click)="closeCancelModal($event)">
      <div class="modal-box modal-cancel">
        <div class="modal-head">
          <h2 class="modal-title">Cancel Order</h2>
          <button class="modal-close" (click)="showCancelModal = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="modal-body cancel-body">
          <div class="cancel-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p class="cancel-msg">
            Cancel <strong>Order #{{ cancelTargetOrder?.orderNumber }}</strong> for
            <strong>{{ cancelTargetOrder?.user?.name || 'Guest' }}</strong>?
          </p>
          <p class="cancel-sub">This action cannot be undone.</p>
          <div class="modal-foot-btns">
            <button class="foot-btn foot-ghost" (click)="showCancelModal = false">Keep Order</button>
            <button class="foot-btn foot-danger" (click)="executeCancelOrder()">
              Yes, Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --orange:      #ff6600;
      --orange-dim:  rgba(255,102,0,0.12);
      --orange-glow: rgba(255,102,0,0.28);
      --blue:        #4f9cf9;
      --blue-dim:    rgba(79,156,249,0.12);
      --green:       #22c55e;
      --green-dim:   rgba(34,197,94,0.12);
      --amber:       #f59e0b;
      --amber-dim:   rgba(245,158,11,0.12);
      --red:         #ef4444;
      --red-dim:     rgba(239,68,68,0.1);
      --yellow:      #eab308;
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
    .dash-page { position:relative;min-height:100vh;background:var(--surface);color:var(--text);padding:72px 0 80px;overflow-x:hidden; }
    .dash-bg { position:absolute;inset:0;pointer-events:none;z-index:0; }
    .db-blob { position:absolute;border-radius:50%;filter:blur(130px);opacity:0.07;animation:blobDrift 12s ease-in-out infinite alternate; }
    .blob-1 { width:600px;height:600px;background:var(--orange);top:-200px;right:-100px; }
    .blob-2 { width:400px;height:400px;background:#1a4fa0;bottom:0;left:-100px;animation-delay:-6s; }
    @keyframes blobDrift { from{transform:translate(0,0) scale(1)} to{transform:translate(20px,16px) scale(1.05)} }
    .db-grain { position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E"); }
    .dash-header { position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:20px 28px;background:rgba(13,13,13,0.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);animation:fadeDown 0.5s ease both; }
    @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    .dh-eyebrow { display:flex;align-items:center;gap:8px;font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--orange);margin:0 0 6px; }
    .eyebrow-dot { width:7px;height:7px;border-radius:50%;background:var(--orange);box-shadow:0 0 8px var(--orange-glow);animation:epulse 2s ease-in-out infinite; }
    @keyframes epulse { 0%,100%{box-shadow:0 0 5px var(--orange-glow)} 50%{box-shadow:0 0 14px var(--orange)} }
    .dh-title { font-size:clamp(1.5rem,2.5vw,2rem);font-weight:900;letter-spacing:-0.04em;margin:0 0 4px;line-height:1; }
    .accent { color:var(--orange); }
    .dh-date { font-size:0.68rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0; }
    .kpi-strip { display:flex;align-items:center;gap:6px;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px 20px; }
    .kpi-tile { display:flex;flex-direction:column;align-items:center;min-width:56px; }
    .kpi-num { font-size:1.6rem;font-weight:900;line-height:1; }
    .kpi-label { font-size:0.58rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-top:4px; }
    .kpi-divider { width:1px;height:36px;background:var(--border);margin:0 6px; }
    .kpi-blue .kpi-num { color:var(--blue); }
    .kpi-amber .kpi-num { color:var(--amber); }
    .kpi-green .kpi-num { color:var(--green); }
    .dh-right { display:flex;align-items:center;gap:12px; }
    .sync-time { display:flex;align-items:center;gap:5px;font-size:0.68rem;color:var(--text-muted);font-weight:600;margin:0; }
    .refresh-btn { display:flex;align-items:center;gap:7px;background:var(--surface-2);border:1px solid var(--border-h);color:var(--text-muted);padding:9px 16px;border-radius:10px;font-size:0.78rem;font-weight:700;cursor:pointer;transition:color 0.2s,border-color 0.2s,background 0.2s; }
    .refresh-btn:hover:not([disabled]) { color:var(--text);border-color:rgba(255,255,255,0.2);background:var(--surface-3); }
    .refresh-btn:disabled { opacity:0.5;cursor:not-allowed; }
    .refresh-ico { transition:transform 0.6s; }
    .refresh-ico.spinning { animation:spin 0.7s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .section-label { display:inline-flex;align-items:center;gap:8px;font-size:0.68rem;font-weight:800;letter-spacing:0.13em;text-transform:uppercase;color:var(--text-muted); }
    .label-dot { width:7px;height:7px;border-radius:50%;background:var(--text-dim); }
    .kanban { position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:20px 28px 28px; }
    .k-col { background:var(--surface-2);border:1px solid var(--border);border-radius:18px;display:flex;flex-direction:column;max-height:calc(100vh - 230px);min-height:500px;transition:border-color 0.3s; }
    .k-col-head { display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--border);border-radius:18px 18px 0 0;flex-shrink:0; }
    .k-head-blue  { border-top:2px solid var(--blue); }
    .k-head-amber { border-top:2px solid var(--amber); }
    .k-head-green { border-top:2px solid var(--green); }
    .k-col-title { display:flex;align-items:center;gap:9px;font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted); }
    .k-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0;animation:kPulse 2.5s ease-in-out infinite; }
    .k-dot-blue  { background:var(--blue);box-shadow:0 0 7px var(--blue); }
    .k-dot-amber { background:var(--amber);box-shadow:0 0 7px var(--amber); }
    .k-dot-green { background:var(--green);box-shadow:0 0 7px var(--green); }
    @keyframes kPulse { 0%,100%{opacity:1}50%{opacity:0.5} }
    .k-badge { font-size:0.72rem;font-weight:800;background:var(--surface-3);border:1px solid var(--border);padding:3px 10px;border-radius:20px;color:var(--text-muted); }
    .k-col-body { flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--surface-4) transparent; }
    .order-card { background:var(--surface-3);border:1px solid var(--border);border-radius:14px;padding:15px;display:flex;flex-direction:column;gap:10px;cursor:pointer;transition:border-color 0.22s,transform 0.22s,box-shadow 0.22s;animation:cardIn 0.3s ease both; }
    @keyframes cardIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .order-card:hover { border-color:var(--border-h);transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.35); }
    .card-unpaid { border-color:rgba(239,68,68,0.3) !important;background:rgba(239,68,68,0.03) !important; }
    .oc-top { display:flex;justify-content:space-between;align-items:center; }
    .oc-ref { font-family:'Courier New',monospace;font-size:0.95rem;font-weight:800;color:var(--orange);background:none;border:none;cursor:pointer;padding:0; }
    .oc-badges { display:flex;gap:5px;flex-wrap:wrap; }
    .type-badge { font-size:0.58rem;font-weight:800;padding:3px 8px;border-radius:5px;text-transform:uppercase;letter-spacing:0.06em; }
    .tb-dine { background:var(--blue-dim);color:var(--blue);border:1px solid rgba(79,156,249,0.22); }
    .tb-take { background:var(--amber-dim);color:var(--amber);border:1px solid rgba(245,158,11,0.22); }
    .pay-badge { font-size:0.58rem;font-weight:800;padding:3px 8px;border-radius:5px;text-transform:uppercase;letter-spacing:0.06em; }
    .pb-cash   { background:var(--green-dim);color:var(--green);border:1px solid rgba(34,197,94,0.2); }
    .pb-online { background:var(--blue-dim);color:var(--blue);border:1px solid rgba(79,156,249,0.2); }
    .elapsed-chip { display:flex;align-items:center;gap:5px;font-size:0.68rem;font-weight:800;background:var(--surface-4);border:1px solid var(--border);padding:3px 9px;border-radius:20px;color:var(--text-muted); }
    .elapsed-warn { background:var(--red-dim) !important;border-color:rgba(239,68,68,0.3) !important;color:var(--red) !important; }
    .total-chip { font-size:0.82rem;font-weight:900;background:var(--green-dim);color:var(--green);border:1px solid rgba(34,197,94,0.2);padding:3px 10px;border-radius:20px; }
    .oc-cust { display:flex;align-items:center;gap:10px; }
    .oc-avatar { width:34px;height:34px;border-radius:50%;flex-shrink:0;background:var(--orange-dim);border:1.5px solid rgba(255,102,0,0.25);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:900;color:var(--orange); }
    .avatar-lg { width:44px;height:44px;font-size:0.9rem; }
    .oc-cust-info { flex:1;min-width:0; }
    .oc-name  { font-size:0.85rem;font-weight:800;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .oc-phone { font-size:0.68rem;color:var(--text-muted);margin:0;font-family:'Courier New',monospace; }
    .oc-total { font-size:0.9rem;font-weight:900;flex-shrink:0; }
    .oc-logistics { display:flex;flex-wrap:wrap;gap:6px; }
    .log-chip { display:inline-flex;align-items:center;gap:4px;font-size:0.65rem;font-weight:700;background:var(--surface-4);border:1px solid var(--border);padding:3px 8px;border-radius:6px;color:var(--text-muted); }
    .log-time { color:var(--yellow);border-color:rgba(234,179,8,0.2);background:rgba(234,179,8,0.06); }
    .oc-items { background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px; }
    .oc-item { display:flex;flex-direction:column;gap:4px; }
    .oci-main { display:flex;align-items:center;gap:7px;flex-wrap:wrap; }
    .oci-qty  { font-size:0.8rem;font-weight:900;color:var(--orange);width:22px;flex-shrink:0; }
    .oci-name { font-size:0.82rem;font-weight:700;color:var(--text); }
    .var-pill { font-size:0.55rem;font-weight:900;padding:2px 6px;border-radius:4px;letter-spacing:0.06em; }
    .vp-half { background:#fcd34d;color:#000; }
    .vp-full { background:#34d399;color:#000; }
    .oci-note { display:flex;align-items:flex-start;gap:5px;font-size:0.7rem;color:#facc15;font-style:italic;background:rgba(250,204,21,0.07);border-left:2px solid rgba(250,204,21,0.4);padding:4px 8px;border-radius:0 6px 6px 0; }
    .pay-alert { display:flex;align-items:center;gap:7px;background:var(--red-dim);border:1px solid rgba(239,68,68,0.25);color:var(--red);font-size:0.72rem;font-weight:800;padding:7px 10px;border-radius:8px; }
    .pay-ok { display:flex;align-items:center;gap:7px;background:var(--green-dim);border:1px solid rgba(34,197,94,0.2);color:var(--green);font-size:0.72rem;font-weight:800;padding:7px 10px;border-radius:8px; }
    .oc-actions { display:flex;gap:7px; }
    .act-btn { flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 10px;border:none;border-radius:9px;font-size:0.75rem;font-weight:800;cursor:pointer;transition:opacity 0.15s,transform 0.15s; }
    .act-btn:hover { opacity:0.85;transform:translateY(-1px); }
    .act-start    { background:var(--blue);color:#fff; }
    .act-ready    { background:var(--amber);color:#000; }
    .act-complete { background:var(--green);color:#000; }
    .act-cancel   { flex:0 0 auto;width:36px;padding:9px;background:var(--surface-4);border:1px solid rgba(239,68,68,0.2);color:var(--red); }
    .act-cancel:hover { background:var(--red-dim);border-color:rgba(239,68,68,0.4); }
    .col-empty { display:flex;flex-direction:column;align-items:center;gap:10px;padding:48px 20px;color:var(--text-dim);font-size:0.78rem;font-weight:600;text-align:center; }
    .ce-icon { width:54px;height:54px;border-radius:50%;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim); }
    .history-section { position:relative;z-index:1;margin:0 28px;background:var(--surface-2);border:1px solid var(--border);border-radius:20px;padding:26px;animation:fadeUp 0.5s 0.15s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    .hs-head { display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:20px; }
    .hs-count { font-size:0.72rem;color:var(--text-muted);margin:6px 0 0;font-weight:600; }
    .hs-filters { display:flex;gap:6px; }
    .hf-btn { background:var(--surface-3);border:1px solid var(--border);color:var(--text-muted);padding:7px 14px;border-radius:8px;font-size:0.72rem;font-weight:700;cursor:pointer;transition:all 0.18s; }
    .hf-btn:hover { color:var(--text);border-color:var(--border-h); }
    .hf-active { background:var(--orange) !important;color:#fff !important;border-color:var(--orange) !important;box-shadow:0 3px 12px var(--orange-glow); }
    .table-wrap { overflow-x:auto; }
    .hist-table { width:100%;border-collapse:collapse;font-size:0.78rem;text-align:left; }
    .hist-table th { padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:0.62rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap; }
    .hist-table td { padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle; }
    .hist-table tr:last-child td { border-bottom:none; }
    .hist-table tbody tr:hover td { background:rgba(255,255,255,0.015); }
    .row-cancelled td { opacity:0.4; }
    .td-stack { display:flex;flex-direction:column;gap:2px; }
    .td-main  { font-weight:700;font-size:0.8rem; }
    .td-sub   { font-size:0.65rem;color:var(--text-muted); }
    .td-time  { font-weight:700;color:var(--yellow);font-size:0.8rem; }
    .td-amount { font-weight:900;color:var(--orange); }
    .tbl-ref { background:none;border:none;color:var(--orange);font-family:'Courier New',monospace;font-size:0.85rem;font-weight:800;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:2px; }
    .pay-status-pill { display:inline-block;font-size:0.58rem;font-weight:800;padding:2px 7px;border-radius:4px; }
    .psp-paid { background:var(--green-dim);color:var(--green); }
    .psp-pend { background:var(--red-dim);color:var(--red); }
    .mt4 { margin-top:4px;display:inline-block; }
    .status-pill { font-size:0.6rem;font-weight:800;padding:3px 8px;border-radius:5px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap; }
    .sp-new       { background:var(--blue-dim);color:var(--blue); }
    .sp-preparing { background:var(--amber-dim);color:var(--amber); }
    .sp-ready     { background:var(--green-dim);color:var(--green); }
    .sp-completed { background:rgba(100,100,100,0.15);color:#888; }
    .sp-cancelled { background:var(--red-dim);color:var(--red); }
    .tbl-actions { display:flex;align-items:center;gap:6px; }
    .tbl-btn { background:none;border:1px solid var(--border);color:var(--text-muted);padding:5px 10px;border-radius:7px;font-size:0.68rem;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap; }
    .tbl-view:hover   { border-color:var(--orange);color:var(--orange); }
    .tbl-cancel:hover { border-color:var(--red);color:var(--red); }
    .voided-label { font-size:0.65rem;color:var(--text-dim);font-style:italic; }
    .empty-row { text-align:center;color:var(--text-muted);padding:40px;font-size:0.82rem; }
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.82);backdrop-filter:blur(10px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px; }
    .modal-box { background:var(--surface-2);border:1px solid var(--border-h);border-radius:22px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 40px 80px rgba(0,0,0,0.7);animation:cardIn 0.25s ease both;overflow:hidden; }
    .modal-detail { max-width:620px; }
    .modal-pay    { max-width:420px; }
    .modal-cancel { max-width:420px; }
    .modal-head { display:flex;justify-content:space-between;align-items:flex-start;padding:22px 24px;border-bottom:1px solid var(--border);flex-shrink:0; }
    .mh-left { display:flex;flex-direction:column;gap:6px; }
    .modal-title { font-size:1.2rem;font-weight:900;margin:0; }
    .modal-sub   { font-size:0.72rem;color:var(--text-muted);margin:0; }
    .modal-close { width:32px;height:32px;border-radius:8px;background:var(--surface-3);border:1px solid var(--border);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color 0.15s,background 0.15s;flex-shrink:0; }
    .modal-close:hover { color:var(--text);background:var(--surface-4); }
    .modal-body { padding:22px 24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:20px; }
    .info-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:12px; }
    .info-tile { display:flex;align-items:flex-start;gap:12px;background:var(--surface-3);border:1px solid var(--border);border-radius:14px;padding:14px 16px;transition:border-color 0.2s; }
    .info-tile:hover { border-color:var(--border-h); }
    .it-icon { width:36px;height:36px;flex-shrink:0;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted); }
    .it-body { display:flex;flex-direction:column;gap:3px;min-width:0; }
    .it-label { font-size:0.6rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin:0; }
    .it-value { font-size:0.9rem;font-weight:800;color:var(--text);margin:0; }
    .it-time  { color:var(--yellow); }
    .it-sub   { font-size:0.7rem;color:var(--text-muted);margin:0; }
    .detail-items-section { display:flex;flex-direction:column; }
    .detail-items-list { border:1px solid var(--border);border-radius:12px 12px 0 0;overflow:hidden; }
    .di-row { display:flex;justify-content:space-between;align-items:flex-start;padding:12px 16px;border-bottom:1px solid var(--border);gap:12px; }
    .di-row:last-child { border-bottom:none; }
    .di-left  { display:flex;align-items:flex-start;gap:10px;flex:1;min-width:0; }
    .di-qty   { font-size:1rem;font-weight:900;color:var(--orange);flex-shrink:0;min-width:26px; }
    .di-info  { display:flex;flex-direction:column;gap:4px; }
    .di-name  { font-size:0.88rem;font-weight:700;display:flex;align-items:center;flex-wrap:wrap;gap:6px; }
    .di-note  { display:flex;align-items:flex-start;gap:5px;font-size:0.72rem;color:#facc15;background:rgba(250,204,21,0.07);border-left:2px solid rgba(250,204,21,0.4);padding:4px 8px;border-radius:0 6px 6px 0; }
    .di-price { font-size:0.88rem;font-weight:800;flex-shrink:0; }
    .detail-total { display:flex;justify-content:space-between;align-items:center;background:var(--surface-3);border:1px solid var(--border);border-top:none;border-radius:0 0 12px 12px;padding:14px 16px;font-size:0.78rem;font-weight:800;color:var(--text-muted); }
    .dt-amount { font-size:1.5rem;font-weight:900;color:var(--orange);letter-spacing:-0.04em; }
    .modal-actions { display:flex;gap:10px;flex-wrap:wrap; }
    .mact-btn { flex:1;min-width:120px;padding:12px 16px;border:none;border-radius:11px;font-size:0.82rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:opacity 0.15s,transform 0.15s; }
    .mact-btn:hover { opacity:0.88;transform:translateY(-1px); }
    .mact-start    { background:var(--blue);color:#fff; }
    .mact-ready    { background:var(--amber);color:#000; }
    .mact-complete { background:var(--green);color:#000; }
    .mact-cancel   { background:var(--surface-3);color:var(--red);border:1px solid rgba(239,68,68,0.22); }
    .pay-body { align-items:stretch; }
    .pay-cust { display:flex;align-items:center;gap:14px;background:var(--surface-3);border:1px solid var(--border);border-radius:14px;padding:14px 18px; }
    .pay-method-banner { display:flex;align-items:center;gap:14px;border-radius:14px;padding:16px 18px; }
    .pmb-cash   { background:var(--green-dim);border:1px solid rgba(34,197,94,0.2); }
    .pmb-online { background:var(--blue-dim);border:1px solid rgba(79,156,249,0.2); }
    .pmb-icon { width:44px;height:44px;flex-shrink:0;border-radius:12px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:var(--text-muted); }
    .pmb-method { font-size:0.9rem;font-weight:900;margin:0 0 3px; }
    .pmb-hint   { font-size:0.72rem;color:var(--text-muted);margin:0; }
    .pay-amount-box { background:var(--surface-3);border:1px solid rgba(255,102,0,0.3);border-radius:14px;padding:20px 22px;text-align:center; }
    .pab-label  { font-size:0.65rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px; }
    .pab-amount { font-size:2.6rem;font-weight:900;color:var(--orange);letter-spacing:-0.05em;margin:0;line-height:1; }
    .cancel-body { align-items:center;text-align:center;gap:14px; }
    .cancel-icon-wrap { width:56px;height:56px;border-radius:50%;background:var(--red-dim);border:1px solid rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center;color:var(--red); }
    .cancel-msg { font-size:0.9rem;line-height:1.65;color:var(--text);margin:0; }
    .cancel-sub { font-size:0.78rem;color:var(--text-muted);margin:0; }
    .modal-foot-btns { display:flex;gap:10px;width:100%; }
    .foot-btn { flex:1;padding:14px;border:none;border-radius:12px;font-size:0.88rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.18s,transform 0.18s; }
    .foot-btn:hover { opacity:0.88;transform:translateY(-1px); }
    .foot-ghost   { background:var(--surface-3);color:var(--text-muted);border:1px solid var(--border); }
    .foot-confirm { background:var(--green);color:#000; }
    .foot-danger  { background:var(--red);color:#fff; }
    @media (max-width:1100px) { .kanban{grid-template-columns:1fr} .k-col{max-height:none;min-height:auto} .k-col-body{max-height:400px} .kpi-strip{display:none} }
    @media (max-width:768px)  { .dash-header{padding:16px 20px} .kanban{padding:14px 20px;gap:12px} .history-section{margin:0 20px} .info-grid{grid-template-columns:1fr} .modal-actions{flex-direction:column} .modal-foot-btns{flex-direction:column} }
    @media (max-width:480px)  { .kanban{padding:12px 16px} .history-section{margin:0 16px;padding:18px} .modal-body{padding:18px} }
  `],
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private toast        = inject(ToastService);
  private cdr          = inject(ChangeDetectorRef);

  // FIX: Signal now typed as any[] and always initialized to empty array.
  // The server returns { orders: [...], pagination: {...} } since our
  // pagination improvement — we extract the orders array in refresh().
  orders        = signal<any[]>([]);
  isRefreshing  = signal<boolean>(false);
  lastSyncTime  = signal<Date | null>(null);
  historyFilter = signal<string>('today');

  detailsOrder      : any = null;
  pendingOrder      : any = null;
  cancelTargetOrder : any = null;
  showPaymentModal      = false;
  showCancelModal       = false;

  private autoRefreshInterval: any;

  readonly todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  readonly historyFilters = [
    { label: 'Today',   value: 'today' },
    { label: '7 Days',  value: 'week'  },
    { label: '30 Days', value: 'month' },
  ];

  // FIX: All computed signals now defensively guard with Array.isArray()
  // so that if the signal ever holds a non-array value, .filter() won't throw.
  newOrders = computed(() => {
    const list = this.orders();
    return Array.isArray(list) ? list.filter(o => o.orderStatus === 'NEW') : [];
  });

  prepOrders = computed(() => {
    const list = this.orders();
    return Array.isArray(list) ? list.filter(o => o.orderStatus === 'PREPARING') : [];
  });

  readyOrders = computed(() => {
    const list = this.orders();
    return Array.isArray(list) ? list.filter(o => o.orderStatus === 'READY') : [];
  });

  todayOrdersCount = computed(() => {
    const list = this.orders();
    if (!Array.isArray(list)) return 0;
    const today = new Date().toDateString();
    return list.filter(o => new Date(o.createdAt).toDateString() === today).length;
  });

  filteredHistory = computed(() => {
    const list = this.orders();
    if (!Array.isArray(list)) return [];
    const pool = list.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.orderStatus));
    const now  = new Date();
    return pool.filter(o => {
      const d = new Date(o.createdAt);
      if (this.historyFilter() === 'today') return d.toDateString() === now.toDateString();
      const diff = (now.getTime() - d.getTime()) / 86400000;
      if (this.historyFilter() === 'week')  return diff <= 7;
      if (this.historyFilter() === 'month') return diff <= 30;
      return true;
    });
  });

  ngOnInit() {
    this.refresh();
    this.autoRefreshInterval = setInterval(() => this.refresh(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.autoRefreshInterval);
    document.body.style.overflow = '';
  }

  refresh() {
    if (this.isRefreshing()) return;
    this.isRefreshing.set(true);
    this.orderService.getOwnerDashboardData().subscribe({
      next: (response: any) => {
        // FIX: Server now returns { orders: [], pagination: {} }.
        // Extract the orders array. Also handle legacy flat-array responses
        // in case the server hasn't been deployed yet.
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.orders)
          ? response.orders
          : [];

        this.orders.set(list);
        this.lastSyncTime.set(new Date());
        this.isRefreshing.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isRefreshing.set(false);
        this.toast.error('Sync failed. Check connection.');
      },
    });
  }

  updateStatus(id: string, status: string, paymentStatus?: string) {
    this.orderService.updateOrderStatus(id, status, paymentStatus).subscribe({
      next: () => { this.toast.success(`Order → ${status}`); this.refresh(); },
      error: () => this.toast.error('Failed to update order.'),
    });
  }

  openDetail(order: any) {
    this.detailsOrder = order;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeDetail(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.detailsOrder = null;
      document.body.style.overflow = '';
    }
  }

  isActiveOrder(order: any): boolean {
    return ['NEW', 'PREPARING', 'READY'].includes(order?.orderStatus);
  }

  updateStatusAndClose(id: string, status: string) {
    this.detailsOrder = null;
    document.body.style.overflow = '';
    this.updateStatus(id, status);
  }

  handleCompletionFromModal(order: any) {
    this.detailsOrder = null;
    document.body.style.overflow = '';
    this.handleCompletion(order);
  }

  confirmCancelFromModal(order: any) {
    this.detailsOrder = null;
    document.body.style.overflow = '';
    this.confirmCancel(order);
  }

  handleCompletion(order: any) {
    this.pendingOrder     = order;
    this.showPaymentModal = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  completeWithPayment() {
    if (!this.pendingOrder) return;
    this.updateStatus(this.pendingOrder._id, 'COMPLETED', 'PAID');
    this.showPaymentModal = false;
    this.pendingOrder     = null;
    document.body.style.overflow = '';
  }

  closePayModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showPaymentModal = false;
      document.body.style.overflow = '';
    }
  }

  confirmCancel(order: any) {
    this.cancelTargetOrder = order;
    this.showCancelModal   = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeCancelModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showCancelModal   = false;
      this.cancelTargetOrder = null;
      document.body.style.overflow = '';
    }
  }

  executeCancelOrder() {
    if (!this.cancelTargetOrder) return;
    this.orderService.updateOrderStatus(this.cancelTargetOrder._id, 'CANCELLED').subscribe({
      next: () => {
        this.toast.success(`Order #${this.cancelTargetOrder.orderNumber} cancelled.`);
        this.showCancelModal   = false;
        this.cancelTargetOrder = null;
        document.body.style.overflow = '';
        this.refresh();
      },
      error: () => this.toast.error('Failed to cancel order.'),
    });
  }

  updateHistoryFilter(val: string) { this.historyFilter.set(val); }

  getDuration(startTime: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 60000));
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'NEW':       'sp-new',
      'PREPARING': 'sp-preparing',
      'READY':     'sp-ready',
      'COMPLETED': 'sp-completed',
      'CANCELLED': 'sp-cancelled',
    };
    return map[status] ?? 'sp-completed';
  }
}