import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectorRef,
  effect,
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
    <div class="od-root">

      <!-- ══ HEADER ══════════════════════════════════════════════════════ -->
      <header class="od-header">
        <div class="od-header-left">
          <div class="od-brand">Kitchen <span class="od-accent">Control</span></div>
          <div class="od-date">{{ todayLabel }}</div>
        </div>
        <div class="od-header-center">
          <div class="od-kpi">
            <span class="od-kpi-n od-color-blue">{{ newOrders().length }}</span>
            <span class="od-kpi-l">Incoming</span>
          </div>
          <div class="od-kpi-divider"></div>
          <div class="od-kpi">
            <span class="od-kpi-n od-color-orange">{{ prepOrders().length }}</span>
            <span class="od-kpi-l">Preparing</span>
          </div>
          <div class="od-kpi-divider"></div>
          <div class="od-kpi">
            <span class="od-kpi-n od-color-green">{{ readyOrders().length }}</span>
            <span class="od-kpi-l">Ready</span>
          </div>
          <div class="od-kpi-divider"></div>
          <div class="od-kpi">
            <span class="od-kpi-n">{{ todayOrdersCount() }}</span>
            <span class="od-kpi-l">Today Total</span>
          </div>
        </div>
        <div class="od-header-right">
          <div class="od-sync-info" *ngIf="lastSyncTime()">
            Last sync {{ lastSyncTime() | date:'shortTime' }}
          </div>
          <button class="od-btn-refresh" (click)="refresh()" [disabled]="isRefreshing()">
            <span class="od-refresh-icon" [class.spinning]="isRefreshing()">↻</span>
            {{ isRefreshing() ? 'Syncing…' : 'Refresh' }}
          </button>
        </div>
      </header>

      <!-- ══ KANBAN BOARD ═════════════════════════════════════════════════ -->
      <div class="od-board">

        <!-- ── Column: INCOMING ─────────────────────────────────────────── -->
        <div class="od-col">
          <div class="od-col-head od-col-head-blue">
            <div class="od-col-title">
              <span class="od-col-dot od-dot-blue"></span>
              Incoming Orders
            </div>
            <span class="od-col-count">{{ newOrders().length }}</span>
          </div>
          <div class="od-col-body">

            <div class="od-card" *ngFor="let order of newOrders()">
              <!-- Card top row -->
              <div class="od-card-toprow">
                <button class="od-order-ref" (click)="openDetail(order)">
                  #{{ order.orderNumber }}
                </button>
                <div class="od-card-badges">
                  <span class="od-badge" [ngClass]="order.orderType === 'DINE IN' ? 'badge-dine' : 'badge-take'">
                    {{ order.orderType === 'DINE IN' ? '🍽 Dine In' : '📦 Takeaway' }}
                  </span>
                  <span class="od-badge badge-pay" [ngClass]="order.paymentMethod === 'CASH' ? 'badge-pay-cash' : 'badge-pay-online'">
                    {{ order.paymentMethod === 'CASH' ? '💵 Cash' : '💳 Online' }}
                  </span>
                </div>
              </div>

              <!-- Customer info row -->
              <div class="od-cust-row">
                <div class="od-cust-avatar">{{ getInitials(order.user?.name) }}</div>
                <div class="od-cust-info">
                  <div class="od-cust-name">{{ order.user?.name || 'Guest' }}</div>
                  <div class="od-cust-phone">{{ order.user?.mobile || '—' }}</div>
                </div>
                <div class="od-order-total">₹{{ order.totalAmount }}</div>
              </div>

              <!-- Logistics row: table / people / arrival -->
              <div class="od-logistics">
                <div class="od-logistic-item" *ngIf="order.tableNumbers?.length">
                  <span class="od-log-icon">🪑</span>
                  <span class="od-log-label">Table</span>
                  <span class="od-log-val">{{ order.tableNumbers.join(', ') }}</span>
                </div>
                <div class="od-logistic-item" *ngIf="order.orderType === 'DINE IN' && order.numberOfPeople">
                  <span class="od-log-icon">👥</span>
                  <span class="od-log-label">Guests</span>
                  <span class="od-log-val">{{ order.numberOfPeople }}</span>
                </div>
                <div class="od-logistic-item od-arrival" *ngIf="order.scheduledTime">
                  <span class="od-log-icon">⏰</span>
                  <span class="od-log-label">{{ order.orderType === 'DINE IN' ? 'Arrives' : 'Pickup' }}</span>
                  <span class="od-log-val od-color-yellow">{{ order.scheduledTime | date:'h:mm a' }}</span>
                </div>
              </div>

              <!-- Items list -->
              <div class="od-items-list">
                <div class="od-item-row" *ngFor="let item of order.items">
                  <div class="od-item-main">
                    <span class="od-item-qty">{{ item.quantity }}×</span>
                    <span class="od-item-name">{{ item.name }}</span>
                    <span class="od-variant-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                      [ngClass]="item.variant === 'HALF' ? 'vp-half' : 'vp-full'">
                      {{ item.variant }}
                    </span>
                  </div>
                  <div class="od-item-note" *ngIf="item.instructions">
                    <span class="od-note-icon">📝</span> {{ item.instructions }}
                  </div>
                </div>
              </div>

              <!-- Action -->
              <div class="od-card-actions">
                <button class="od-act-btn od-act-start" (click)="updateStatus(order._id, 'PREPARING')">
                  Start Preparing
                </button>
                <button class="od-act-btn od-act-cancel" (click)="confirmCancel(order)">
                  Cancel
                </button>
              </div>
            </div>

            <div class="od-empty" *ngIf="newOrders().length === 0">
              <span class="od-empty-icon">🎉</span>
              <span>All clear — no incoming orders</span>
            </div>
          </div>
        </div>

        <!-- ── Column: PREPARING ────────────────────────────────────────── -->
        <div class="od-col">
          <div class="od-col-head od-col-head-orange">
            <div class="od-col-title">
              <span class="od-col-dot od-dot-orange"></span>
              Preparing
            </div>
            <span class="od-col-count">{{ prepOrders().length }}</span>
          </div>
          <div class="od-col-body">

            <div class="od-card" *ngFor="let order of prepOrders()">
              <div class="od-card-toprow">
                <button class="od-order-ref" (click)="openDetail(order)">
                  #{{ order.orderNumber }}
                </button>
                <div class="od-elapsed" [class.od-elapsed-warn]="getDuration(order.updatedAt) > 15">
                  <span class="od-elapsed-icon">⏱</span>
                  {{ getDuration(order.updatedAt) }}m elapsed
                </div>
              </div>

              <div class="od-cust-row">
                <div class="od-cust-avatar">{{ getInitials(order.user?.name) }}</div>
                <div class="od-cust-info">
                  <div class="od-cust-name">{{ order.user?.name || 'Guest' }}</div>
                  <div class="od-cust-phone">{{ order.user?.mobile || '—' }}</div>
                </div>
                <div class="od-order-total">₹{{ order.totalAmount }}</div>
              </div>

              <div class="od-logistics">
                <div class="od-logistic-item" *ngIf="order.tableNumbers?.length">
                  <span class="od-log-icon">🪑</span>
                  <span class="od-log-label">Table</span>
                  <span class="od-log-val">{{ order.tableNumbers.join(', ') }}</span>
                </div>
                <div class="od-logistic-item" *ngIf="order.orderType === 'DINE IN' && order.numberOfPeople">
                  <span class="od-log-icon">👥</span>
                  <span class="od-log-label">Guests</span>
                  <span class="od-log-val">{{ order.numberOfPeople }}</span>
                </div>
                <div class="od-logistic-item" *ngIf="order.scheduledTime">
                  <span class="od-log-icon">⏰</span>
                  <span class="od-log-label">{{ order.orderType === 'DINE IN' ? 'Arrives' : 'Pickup' }}</span>
                  <span class="od-log-val od-color-yellow">{{ order.scheduledTime | date:'h:mm a' }}</span>
                </div>
                <div class="od-logistic-item">
                  <span class="od-log-icon">{{ order.orderType === 'DINE IN' ? '🍽' : '📦' }}</span>
                  <span class="od-log-label">Type</span>
                  <span class="od-log-val">{{ order.orderType }}</span>
                </div>
              </div>

              <div class="od-items-list">
                <div class="od-item-row" *ngFor="let item of order.items">
                  <div class="od-item-main">
                    <span class="od-item-qty">{{ item.quantity }}×</span>
                    <span class="od-item-name">{{ item.name }}</span>
                    <span class="od-variant-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                      [ngClass]="item.variant === 'HALF' ? 'vp-half' : 'vp-full'">
                      {{ item.variant }}
                    </span>
                  </div>
                  <div class="od-item-note" *ngIf="item.instructions">
                    <span class="od-note-icon">📝</span> {{ item.instructions }}
                  </div>
                </div>
              </div>

              <div class="od-card-actions">
                <button class="od-act-btn od-act-ready" (click)="updateStatus(order._id, 'READY')">
                  Mark Ready
                </button>
                <button class="od-act-btn od-act-cancel" (click)="confirmCancel(order)">
                  Cancel
                </button>
              </div>
            </div>

            <div class="od-empty" *ngIf="prepOrders().length === 0">
              <span class="od-empty-icon">🍳</span>
              <span>Kitchen is clear</span>
            </div>
          </div>
        </div>

        <!-- ── Column: READY ────────────────────────────────────────────── -->
        <div class="od-col">
          <div class="od-col-head od-col-head-green">
            <div class="od-col-title">
              <span class="od-col-dot od-dot-green"></span>
              Ready to Serve
            </div>
            <span class="od-col-count">{{ readyOrders().length }}</span>
          </div>
          <div class="od-col-body">

            <div class="od-card" *ngFor="let order of readyOrders()"
              [class.od-card-unpaid]="order.paymentStatus === 'PENDING'">

              <div class="od-card-toprow">
                <button class="od-order-ref" (click)="openDetail(order)">
                  #{{ order.orderNumber }}
                </button>
                <span class="od-total-chip">₹{{ order.totalAmount }}</span>
              </div>

              <!-- Payment status alert -->
              <div class="od-pay-alert" *ngIf="order.paymentStatus === 'PENDING'">
                <span>⚠️ Collect {{ order.paymentMethod }} Payment</span>
              </div>
              <div class="od-pay-ok" *ngIf="order.paymentStatus === 'PAID'">
                <span>✓ {{ order.paymentMethod }} Paid</span>
              </div>

              <div class="od-cust-row">
                <div class="od-cust-avatar">{{ getInitials(order.user?.name) }}</div>
                <div class="od-cust-info">
                  <div class="od-cust-name">{{ order.user?.name || 'Guest' }}</div>
                  <div class="od-cust-phone">{{ order.user?.mobile || '—' }}</div>
                </div>
              </div>

              <div class="od-logistics">
                <div class="od-logistic-item" *ngIf="order.tableNumbers?.length">
                  <span class="od-log-icon">🪑</span>
                  <span class="od-log-label">Table</span>
                  <span class="od-log-val">{{ order.tableNumbers.join(', ') }}</span>
                </div>
                <div class="od-logistic-item" *ngIf="order.orderType === 'DINE IN' && order.numberOfPeople">
                  <span class="od-log-icon">👥</span>
                  <span class="od-log-label">Guests</span>
                  <span class="od-log-val">{{ order.numberOfPeople }}</span>
                </div>
                <div class="od-logistic-item" *ngIf="order.scheduledTime">
                  <span class="od-log-icon">⏰</span>
                  <span class="od-log-label">{{ order.orderType === 'DINE IN' ? 'Arrives' : 'Pickup' }}</span>
                  <span class="od-log-val od-color-yellow">{{ order.scheduledTime | date:'h:mm a' }}</span>
                </div>
              </div>

              <div class="od-items-list">
                <div class="od-item-row" *ngFor="let item of order.items">
                  <div class="od-item-main">
                    <span class="od-item-qty">{{ item.quantity }}×</span>
                    <span class="od-item-name">{{ item.name }}</span>
                    <span class="od-variant-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                      [ngClass]="item.variant === 'HALF' ? 'vp-half' : 'vp-full'">
                      {{ item.variant }}
                    </span>
                  </div>
                  <div class="od-item-note" *ngIf="item.instructions">
                    <span class="od-note-icon">📝</span> {{ item.instructions }}
                  </div>
                </div>
              </div>

              <div class="od-card-actions">
                <button class="od-act-btn od-act-complete" (click)="handleCompletion(order)">
                  {{ order.paymentStatus === 'PENDING' ? '💵 Collect & Complete' : '✓ Complete Order' }}
                </button>
                <button class="od-act-btn od-act-cancel" (click)="confirmCancel(order)">
                  Cancel
                </button>
              </div>
            </div>

            <div class="od-empty" *ngIf="readyOrders().length === 0">
              <span class="od-empty-icon">✅</span>
              <span>No orders waiting</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ HISTORY ═══════════════════════════════════════════════════════ -->
      <section class="od-history">
        <div class="od-history-head">
          <div>
            <h2 class="od-section-title">Order <span class="od-accent">History</span></h2>
            <p class="od-section-sub">{{ filteredHistory().length }} records</p>
          </div>
          <div class="od-history-filters">
            <button
              class="od-filter-btn"
              *ngFor="let f of historyFilters"
              [class.active]="historyFilter() === f.value"
              (click)="updateHistoryFilter(f.value)"
            >{{ f.label }}</button>
          </div>
        </div>

        <div class="od-table-wrap">
          <table class="od-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Table / Guests</th>
                <th>Arrival / Pickup</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of filteredHistory()"
                [class.od-row-cancelled]="order.orderStatus === 'CANCELLED'">
                <td>
                  <button class="od-order-ref" (click)="openDetail(order)">
                    #{{ order.orderNumber }}
                  </button>
                </td>
                <td>
                  <div class="od-td-stack">
                    <span class="od-td-main">{{ order.user?.name || 'Guest' }}</span>
                    <span class="od-td-sub">{{ order.user?.mobile || '—' }}</span>
                  </div>
                </td>
                <td>
                  <span class="od-badge" [ngClass]="order.orderType === 'DINE IN' ? 'badge-dine' : 'badge-take'">
                    {{ order.orderType === 'DINE IN' ? '🍽 Dine In' : '📦 Takeaway' }}
                  </span>
                </td>
                <td>
                  <div class="od-td-stack">
                    <span *ngIf="order.tableNumbers?.length" class="od-td-main">🪑 {{ order.tableNumbers.join(', ') }}</span>
                    <span *ngIf="order.numberOfPeople" class="od-td-sub">👥 {{ order.numberOfPeople }} guests</span>
                    <span *ngIf="!order.tableNumbers?.length && !order.numberOfPeople" class="od-td-sub">—</span>
                  </div>
                </td>
                <td>
                  <span *ngIf="order.scheduledTime" class="od-color-yellow">
                    {{ order.scheduledTime | date:'h:mm a' }}
                  </span>
                  <span *ngIf="!order.scheduledTime" class="od-td-sub">—</span>
                </td>
                <td>
                  <div class="od-td-stack">
                    <span class="od-td-main">{{ order.paymentMethod }}</span>
                    <span class="od-pay-status" [ngClass]="order.paymentStatus === 'PAID' ? 'ps-paid' : 'ps-pending'">
                      {{ order.paymentStatus }}
                    </span>
                  </div>
                </td>
                <td class="od-td-bold">₹{{ order.totalAmount }}</td>
                <td>
                  <span class="od-status-badge" [ngClass]="'sb-' + order.orderStatus.toLowerCase().replace(' ','')">
                    {{ order.orderStatus }}
                  </span>
                </td>
                <td class="od-td-sub">{{ order.updatedAt | date:'d MMM, h:mm a' }}</td>
                <td>
                  <button class="od-tbl-btn od-tbl-view" (click)="openDetail(order)">View</button>
                  <button
                    class="od-tbl-btn od-tbl-cancel"
                    *ngIf="order.orderStatus !== 'CANCELLED'"
                    (click)="confirmCancel(order)">
                    Cancel
                  </button>
                  <span class="od-voided" *ngIf="order.orderStatus === 'CANCELLED'">Voided</span>
                </td>
              </tr>
              <tr *ngIf="filteredHistory().length === 0">
                <td colspan="10" class="od-empty-row">No records for this period.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- ══ MODAL: ORDER DETAIL ═══════════════════════════════════════════ -->
    <div class="od-overlay" *ngIf="detailsOrder" (click)="closeDetail($event)">
      <div class="od-modal od-modal-detail">
        <div class="od-modal-head">
          <div>
            <h2 class="od-modal-title">Order <span class="od-accent">#{{ detailsOrder.orderNumber }}</span></h2>
            <span class="od-status-badge" [ngClass]="'sb-' + detailsOrder.orderStatus.toLowerCase().replace(' ','')">
              {{ detailsOrder.orderStatus }}
            </span>
          </div>
          <button class="od-close-btn" (click)="detailsOrder = null">✕</button>
        </div>

        <div class="od-modal-body">
          <!-- Info grid -->
          <div class="od-info-grid">
            <div class="od-info-card">
              <div class="od-info-icon">👤</div>
              <div class="od-info-content">
                <div class="od-info-label">Customer</div>
                <div class="od-info-value">{{ detailsOrder.user?.name || 'Guest' }}</div>
                <div class="od-info-sub">{{ detailsOrder.user?.mobile || 'No phone' }}</div>
                <div class="od-info-sub">{{ detailsOrder.user?.email || '' }}</div>
              </div>
            </div>
            <div class="od-info-card">
              <div class="od-info-icon">{{ detailsOrder.orderType === 'DINE IN' ? '🍽' : '📦' }}</div>
              <div class="od-info-content">
                <div class="od-info-label">Service</div>
                <div class="od-info-value">{{ detailsOrder.orderType }}</div>
                <div class="od-info-sub" *ngIf="detailsOrder.tableNumbers?.length">
                  Tables: {{ detailsOrder.tableNumbers.join(', ') }}
                </div>
                <div class="od-info-sub" *ngIf="detailsOrder.numberOfPeople">
                  {{ detailsOrder.numberOfPeople }} guests
                </div>
              </div>
            </div>
            <div class="od-info-card">
              <div class="od-info-icon">⏰</div>
              <div class="od-info-content">
                <div class="od-info-label">{{ detailsOrder.orderType === 'DINE IN' ? 'Arrival Time' : 'Pickup Time' }}</div>
                <div class="od-info-value od-color-yellow" *ngIf="detailsOrder.scheduledTime">
                  {{ detailsOrder.scheduledTime | date:'h:mm a' }}
                </div>
                <div class="od-info-value od-td-sub" *ngIf="!detailsOrder.scheduledTime">Not set</div>
                <div class="od-info-sub">Placed: {{ detailsOrder.createdAt | date:'d MMM, h:mm a' }}</div>
              </div>
            </div>
            <div class="od-info-card">
              <div class="od-info-icon">💳</div>
              <div class="od-info-content">
                <div class="od-info-label">Payment</div>
                <div class="od-info-value">{{ detailsOrder.paymentMethod }}</div>
                <div class="od-pay-status"
                  [ngClass]="detailsOrder.paymentStatus === 'PAID' ? 'ps-paid' : 'ps-pending'">
                  {{ detailsOrder.paymentStatus }}
                </div>
              </div>
            </div>
          </div>

          <!-- Items table -->
          <div class="od-items-section">
            <div class="od-items-title">Order Items</div>
            <div class="od-detail-items">
              <div class="od-detail-item" *ngFor="let item of detailsOrder.items">
                <div class="od-di-left">
                  <span class="od-di-qty">{{ item.quantity }}×</span>
                  <div class="od-di-info">
                    <div class="od-di-name">
                      {{ item.name }}
                      <span class="od-variant-pill" *ngIf="item.variant && item.variant !== 'SINGLE'"
                        [ngClass]="item.variant === 'HALF' ? 'vp-half' : 'vp-full'">
                        {{ item.variant }}
                      </span>
                    </div>
                    <div class="od-di-note" *ngIf="item.instructions">
                      📝 Special: {{ item.instructions }}
                    </div>
                  </div>
                </div>
                <div class="od-di-price">₹{{ item.unitPrice * item.quantity }}</div>
              </div>
            </div>
            <div class="od-detail-total">
              <span>Total</span>
              <span class="od-total-big">₹{{ detailsOrder.totalAmount }}</span>
            </div>
          </div>

          <!-- Actions if order is still active -->
          <div class="od-modal-actions" *ngIf="isActiveOrder(detailsOrder)">
            <button
              class="od-modal-act-btn"
              *ngIf="detailsOrder.orderStatus === 'NEW'"
              (click)="updateStatusAndClose(detailsOrder._id, 'PREPARING')">
              Start Preparing
            </button>
            <button
              class="od-modal-act-btn od-act-ready"
              *ngIf="detailsOrder.orderStatus === 'PREPARING'"
              (click)="updateStatusAndClose(detailsOrder._id, 'READY')">
              Mark Ready
            </button>
            <button
              class="od-modal-act-btn od-act-complete"
              *ngIf="detailsOrder.orderStatus === 'READY'"
              (click)="handleCompletionFromModal(detailsOrder)">
              {{ detailsOrder.paymentStatus === 'PENDING' ? 'Collect & Complete' : 'Complete Order' }}
            </button>
            <button
              class="od-modal-act-btn od-act-cancel"
              (click)="confirmCancelFromModal(detailsOrder)">
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ MODAL: PAYMENT CONFIRMATION ══════════════════════════════════ -->
    <div class="od-overlay" *ngIf="showPaymentModal" (click)="closePayModal($event)">
      <div class="od-modal od-modal-pay">
        <div class="od-modal-head">
          <h2 class="od-modal-title">Confirm Payment</h2>
          <button class="od-close-btn" (click)="showPaymentModal = false">✕</button>
        </div>
        <div class="od-modal-body od-pay-body">
          <div class="od-pay-order-ref">#{{ pendingOrder?.orderNumber }}</div>

          <div class="od-pay-cust">
            <div class="od-cust-avatar od-avatar-lg">{{ getInitials(pendingOrder?.user?.name) }}</div>
            <div>
              <div class="od-cust-name">{{ pendingOrder?.user?.name || 'Guest' }}</div>
              <div class="od-cust-phone">{{ pendingOrder?.user?.mobile || '—' }}</div>
            </div>
          </div>

          <div class="od-pay-method-banner"
            [ngClass]="pendingOrder?.paymentMethod === 'CASH' ? 'pmb-cash' : 'pmb-online'">
            <span class="od-pmb-icon">{{ pendingOrder?.paymentMethod === 'CASH' ? '💵' : '💳' }}</span>
            <div>
              <div class="od-pmb-method">{{ pendingOrder?.paymentMethod }}</div>
              <div class="od-pmb-hint">
                {{ pendingOrder?.paymentMethod === 'CASH'
                  ? 'Collect physical cash from the customer'
                  : 'Verify online payment has been received' }}
              </div>
            </div>
          </div>

          <div class="od-pay-amount-box">
            <div class="od-pab-label">Amount to Collect</div>
            <div class="od-pab-amount">₹{{ pendingOrder?.totalAmount }}</div>
          </div>

          <div class="od-pay-actions">
            <button class="od-pay-btn od-pay-cancel" (click)="showPaymentModal = false">
              Not Yet
            </button>
            <button class="od-pay-btn od-pay-confirm" (click)="completeWithPayment()">
              ✓ Confirm & Close Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ MODAL: CANCEL CONFIRMATION ════════════════════════════════════ -->
    <div class="od-overlay" *ngIf="showCancelModal" (click)="closeCancelModal($event)">
      <div class="od-modal od-modal-cancel">
        <div class="od-modal-head">
          <h2 class="od-modal-title">Cancel Order</h2>
          <button class="od-close-btn" (click)="showCancelModal = false">✕</button>
        </div>
        <div class="od-modal-body od-cancel-body">
          <div class="od-cancel-icon">⚠️</div>
          <p class="od-cancel-msg">
            Are you sure you want to cancel
            <strong>Order #{{ cancelTargetOrder?.orderNumber }}</strong>
            for <strong>{{ cancelTargetOrder?.user?.name || 'Guest' }}</strong>?
          </p>
          <p class="od-cancel-sub">This action cannot be undone.</p>
          <div class="od-pay-actions">
            <button class="od-pay-btn od-pay-cancel" (click)="showCancelModal = false">
              Keep Order
            </button>
            <button class="od-pay-btn od-cancel-confirm" (click)="executeCancelOrder()">
              Yes, Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Variables ─────────────────────────────────────────── */
    :host {
      --bg:     #07080a;
      --s1:     #0f1012;
      --s2:     #161719;
      --s3:     #1e2022;
      --border: rgba(255,255,255,0.07);
      --brite:  rgba(255,255,255,0.13);
      --text:   #f2f2f2;
      --muted:  #666;
      --muted2: #444;
      --orange: #ff6600;
      --blue:   #4f9cf9;
      --green:  #22c55e;
      --yellow: #eab308;
      --red:    #ef4444;
      --amber:  #f59e0b;
      font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
    }

    /* ── Root ──────────────────────────────────────────────── */
    .od-root {
      background: var(--bg);
      min-height: 100vh;
      color: var(--text);
      padding: 80px 0 60px;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .od-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 18px 28px;
      background: var(--s1);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .od-brand {
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .od-accent { color: var(--orange); }
    .od-date { font-size: 0.72rem; color: var(--muted); margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

    .od-header-center {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--s2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 20px;
    }
    .od-kpi { display: flex; flex-direction: column; align-items: center; min-width: 52px; }
    .od-kpi-n { font-size: 1.5rem; font-weight: 900; line-height: 1; }
    .od-kpi-l { font-size: 0.6rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
    .od-kpi-divider { width: 1px; height: 36px; background: var(--border); margin: 0 8px; }
    .od-color-blue   { color: var(--blue); }
    .od-color-orange { color: var(--amber); }
    .od-color-green  { color: var(--green); }
    .od-color-yellow { color: var(--yellow); }

    .od-header-right { display: flex; align-items: center; gap: 14px; }
    .od-sync-info { font-size: 0.68rem; color: var(--muted); }
    .od-btn-refresh {
      display: flex; align-items: center; gap: 7px;
      background: var(--s3); border: 1px solid var(--brite);
      color: var(--text); padding: 9px 18px; border-radius: 8px;
      font-size: 0.82rem; font-weight: 700; cursor: pointer;
      transition: background 0.2s;
    }
    .od-btn-refresh:hover:not([disabled]) { background: #2a2c30; }
    .od-refresh-icon { font-size: 1rem; display: inline-block; transition: transform 0.6s; }
    .od-refresh-icon.spinning { animation: od-spin 0.7s linear infinite; }
    @keyframes od-spin { to { transform: rotate(360deg); } }

    /* ── Board ───────────────────────────────────────────────── */
    .od-board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      padding: 20px 20px 28px;
      gap: 16px;
    }

    .od-col {
      background: var(--s1);
      border: 1px solid var(--border);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 220px);
      min-height: 480px;
    }

    .od-col-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      border-radius: 14px 14px 0 0;
    }
    .od-col-head-blue   { border-top: 3px solid var(--blue); }
    .od-col-head-orange { border-top: 3px solid var(--amber); }
    .od-col-head-green  { border-top: 3px solid var(--green); }
    .od-col-title { display: flex; align-items: center; gap: 9px; font-size: 0.88rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ccc; }
    .od-col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .od-dot-blue   { background: var(--blue); box-shadow: 0 0 8px var(--blue); }
    .od-dot-orange { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
    .od-dot-green  { background: var(--green); box-shadow: 0 0 8px var(--green); }
    .od-col-count { font-size: 0.78rem; font-weight: 800; background: var(--s3); padding: 3px 9px; border-radius: 20px; border: 1px solid var(--border); }

    .od-col-body {
      flex: 1; overflow-y: auto; padding: 14px;
      display: flex; flex-direction: column; gap: 12px;
      scrollbar-width: thin; scrollbar-color: var(--s3) transparent;
    }

    /* ── Order Card ─────────────────────────────────────────── */
    .od-card {
      background: var(--s2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s;
    }
    .od-card:hover { border-color: var(--brite); }
    .od-card-unpaid { border-color: rgba(239,68,68,0.35) !important; background: rgba(239,68,68,0.04); }

    .od-card-toprow {
      display: flex; justify-content: space-between; align-items: center;
    }
    .od-order-ref {
      background: none; border: none; color: var(--orange);
      font-family: 'DM Mono', monospace; font-size: 1rem; font-weight: 700;
      cursor: pointer; padding: 0; letter-spacing: 0.5px;
      text-decoration: underline; text-underline-offset: 3px;
    }

    .od-card-badges { display: flex; gap: 6px; flex-wrap: wrap; }
    .od-badge {
      font-size: 0.65rem; font-weight: 700; padding: 3px 8px;
      border-radius: 5px; white-space: nowrap;
    }
    .badge-dine { background: rgba(79,156,249,0.15); color: var(--blue); border: 1px solid rgba(79,156,249,0.25); }
    .badge-take { background: rgba(234,179,8,0.15); color: var(--yellow); border: 1px solid rgba(234,179,8,0.25); }
    .badge-pay-cash { background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.2); }
    .badge-pay-online { background: rgba(79,156,249,0.1); color: var(--blue); border: 1px solid rgba(79,156,249,0.2); }

    .od-elapsed {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.75rem; font-weight: 700; color: var(--muted);
      background: var(--s3); padding: 3px 9px; border-radius: 20px;
    }
    .od-elapsed-warn { color: var(--red) !important; background: rgba(239,68,68,0.1) !important; }
    .od-elapsed-icon { font-size: 0.7rem; }

    .od-total-chip {
      font-size: 0.9rem; font-weight: 800; color: var(--green);
      background: rgba(34,197,94,0.1); padding: 3px 10px; border-radius: 20px;
    }

    /* Customer row */
    .od-cust-row {
      display: flex; align-items: center; gap: 11px;
    }
    .od-cust-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--orange), #c45000);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800; color: #fff;
      flex-shrink: 0; letter-spacing: 0.5px;
    }
    .od-avatar-lg { width: 48px; height: 48px; font-size: 0.95rem; }
    .od-cust-info { flex: 1; min-width: 0; }
    .od-cust-name { font-size: 0.9rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .od-cust-phone { font-size: 0.72rem; color: var(--muted); font-family: 'DM Mono', monospace; }
    .od-order-total { font-size: 0.95rem; font-weight: 800; color: var(--text); flex-shrink: 0; }

    /* Logistics */
    .od-logistics {
      display: flex; flex-wrap: wrap; gap: 8px;
      background: var(--s3); border-radius: 8px; padding: 10px 12px;
    }
    .od-logistic-item {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.72rem; padding: 3px 8px;
      background: var(--s1); border-radius: 5px;
      border: 1px solid var(--border);
    }
    .od-log-icon { font-size: 0.8rem; }
    .od-log-label { color: var(--muted); font-weight: 600; }
    .od-log-val { font-weight: 700; margin-left: 2px; }
    .od-arrival .od-log-val { font-size: 0.78rem; }

    /* Items */
    .od-items-list {
      background: rgba(0,0,0,0.25);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .od-item-row { display: flex; flex-direction: column; gap: 4px; }
    .od-item-main { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
    .od-item-qty { font-size: 0.82rem; font-weight: 800; color: var(--orange); width: 22px; }
    .od-item-name { font-size: 0.85rem; font-weight: 700; color: #eee; }
    .od-variant-pill {
      font-size: 0.6rem; font-weight: 800; padding: 2px 6px;
      border-radius: 4px; color: #000;
    }
    .vp-half { background: #fcd34d; }
    .vp-full { background: #34d399; }
    .od-item-note {
      font-size: 0.72rem; color: #facc15; font-style: italic;
      background: rgba(250,204,21,0.08); border-left: 2px solid rgba(250,204,21,0.5);
      padding: 4px 8px; border-radius: 0 5px 5px 0;
      display: flex; align-items: flex-start; gap: 4px;
    }
    .od-note-icon { flex-shrink: 0; }

    /* Payment alerts on card */
    .od-pay-alert {
      background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
      color: var(--red); font-size: 0.75rem; font-weight: 700;
      padding: 6px 10px; border-radius: 6px; text-align: center;
    }
    .od-pay-ok {
      background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
      color: var(--green); font-size: 0.72rem; font-weight: 700;
      padding: 5px 10px; border-radius: 6px; text-align: center;
    }

    /* Card action buttons */
    .od-card-actions { display: flex; gap: 8px; }
    .od-act-btn {
      flex: 1; padding: 9px 10px; border: none; border-radius: 8px;
      font-size: 0.78rem; font-weight: 700; cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
    }
    .od-act-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .od-act-start    { background: var(--blue); color: #fff; }
    .od-act-ready    { background: var(--amber); color: #000; }
    .od-act-complete { background: var(--green); color: #000; }
    .od-act-cancel   { background: var(--s3); color: var(--red); border: 1px solid rgba(239,68,68,0.25); flex: 0 0 auto; padding: 9px 12px; }

    /* Empty state */
    .od-empty {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 40px 20px; color: var(--muted); font-size: 0.82rem;
    }
    .od-empty-icon { font-size: 1.8rem; }

    /* ── History ─────────────────────────────────────────────── */
    .od-history {
      margin: 0 20px;
      background: var(--s1);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
    }
    .od-history-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 16px; margin-bottom: 20px;
    }
    .od-section-title { font-size: 1.3rem; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 3px; }
    .od-section-sub { font-size: 0.75rem; color: var(--muted); margin: 0; }
    .od-history-filters { display: flex; gap: 6px; }
    .od-filter-btn {
      background: var(--s2); border: 1px solid var(--border);
      color: var(--muted); padding: 7px 14px; border-radius: 7px;
      font-size: 0.75rem; font-weight: 700; cursor: pointer;
      transition: all 0.15s;
    }
    .od-filter-btn:hover { color: var(--text); border-color: var(--brite); }
    .od-filter-btn.active { background: var(--orange); color: #fff; border-color: var(--orange); }

    .od-table-wrap { overflow-x: auto; }
    .od-table {
      width: 100%; border-collapse: collapse;
      font-size: 0.8rem; text-align: left;
    }
    .od-table th {
      padding: 11px 14px; border-bottom: 1px solid var(--border);
      color: var(--muted); font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 1px; white-space: nowrap;
    }
    .od-table td {
      padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: middle;
    }
    .od-row-cancelled td { opacity: 0.45; }
    .od-td-stack { display: flex; flex-direction: column; gap: 2px; }
    .od-td-main { font-weight: 600; }
    .od-td-sub { font-size: 0.7rem; color: var(--muted); font-family: 'DM Mono', monospace; }
    .od-td-bold { font-weight: 800; }

    .od-pay-status {
      font-size: 0.65rem; font-weight: 800; padding: 2px 7px;
      border-radius: 4px; display: inline-block; margin-top: 3px;
    }
    .ps-paid    { background: rgba(34,197,94,0.15); color: var(--green); }
    .ps-pending { background: rgba(239,68,68,0.12); color: var(--red); }

    .od-status-badge {
      font-size: 0.65rem; font-weight: 800; padding: 3px 8px;
      border-radius: 5px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .sb-new        { background: rgba(79,156,249,0.15); color: var(--blue); }
    .sb-preparing  { background: rgba(245,158,11,0.15); color: var(--amber); }
    .sb-ready      { background: rgba(34,197,94,0.15); color: var(--green); }
    .sb-completed  { background: rgba(100,100,100,0.2); color: #aaa; }
    .sb-cancelled  { background: rgba(239,68,68,0.1); color: var(--red); }

    .od-tbl-btn {
      background: none; border: 1px solid var(--border);
      padding: 5px 10px; border-radius: 6px; font-size: 0.7rem;
      font-weight: 700; cursor: pointer; margin-right: 5px;
      transition: all 0.15s;
    }
    .od-tbl-view:hover  { border-color: var(--orange); color: var(--orange); }
    .od-tbl-cancel:hover { border-color: var(--red); color: var(--red); }
    .od-voided { font-size: 0.7rem; color: var(--muted); font-style: italic; }
    .od-empty-row { text-align: center; color: var(--muted); padding: 40px; }

    /* ── Modals ──────────────────────────────────────────────── */
    .od-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.82); backdrop-filter: blur(6px);
      z-index: 9999; display: flex; align-items: center;
      justify-content: center; padding: 16px;
    }
    .od-modal {
      background: var(--s1); border: 1px solid var(--brite);
      border-radius: 16px; width: 100%;
      max-height: 88vh; display: flex; flex-direction: column;
      box-shadow: 0 24px 60px rgba(0,0,0,0.6);
      animation: od-slide-up 0.2s ease;
    }
    @keyframes od-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .od-modal-detail { max-width: 620px; }
    .od-modal-pay    { max-width: 400px; }
    .od-modal-cancel { max-width: 400px; }

    .od-modal-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 24px; border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .od-modal-title { font-size: 1.15rem; font-weight: 900; margin: 0; letter-spacing: -0.3px; }
    .od-close-btn {
      background: var(--s3); border: 1px solid var(--border);
      color: var(--muted); width: 32px; height: 32px;
      border-radius: 8px; cursor: pointer; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.15s;
    }
    .od-close-btn:hover { color: var(--text); }

    .od-modal-body { padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }

    .od-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .od-info-card {
      background: var(--s2); border: 1px solid var(--border);
      border-radius: 10px; padding: 14px 16px;
      display: flex; gap: 12px; align-items: flex-start;
    }
    .od-info-icon { font-size: 1.3rem; flex-shrink: 0; }
    .od-info-content { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .od-info-label { font-size: 0.62rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    .od-info-value { font-size: 0.9rem; font-weight: 700; }
    .od-info-sub { font-size: 0.72rem; color: var(--muted); }

    .od-items-section { display: flex; flex-direction: column; gap: 0; }
    .od-items-title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 10px; }
    .od-detail-items {
      border: 1px solid var(--border); border-radius: 10px 10px 0 0; overflow: hidden;
    }
    .od-detail-item {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 13px 16px; border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    .od-detail-item:last-child { border-bottom: none; }
    .od-di-left { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0; }
    .od-di-qty { font-size: 1.1rem; font-weight: 800; color: var(--orange); flex-shrink: 0; min-width: 28px; }
    .od-di-info { display: flex; flex-direction: column; gap: 4px; }
    .od-di-name { font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
    .od-di-note { font-size: 0.75rem; color: #facc15; background: rgba(250,204,21,0.08); border-left: 2px solid rgba(250,204,21,0.4); padding: 4px 8px; border-radius: 0 5px 5px 0; }
    .od-di-price { font-size: 0.9rem; font-weight: 800; flex-shrink: 0; }
    .od-detail-total {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--s2); border: 1px solid var(--border); border-top: none;
      border-radius: 0 0 10px 10px; padding: 14px 16px;
      font-size: 0.8rem; font-weight: 700; color: var(--muted);
    }
    .od-total-big { font-size: 1.4rem; font-weight: 900; color: var(--orange); }

    .od-modal-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .od-modal-act-btn {
      flex: 1; min-width: 120px; padding: 12px;
      border: none; border-radius: 9px; font-size: 0.82rem;
      font-weight: 700; cursor: pointer; transition: opacity 0.15s;
      background: var(--blue); color: #fff;
    }
    .od-modal-act-btn:hover { opacity: 0.85; }
    .od-modal-act-btn.od-act-ready { background: var(--amber); color: #000; }
    .od-modal-act-btn.od-act-complete { background: var(--green); color: #000; }
    .od-modal-act-btn.od-act-cancel { background: var(--s3); color: var(--red); border: 1px solid rgba(239,68,68,0.25); }

    /* Payment modal */
    .od-pay-body { text-align: center; align-items: center; }
    .od-pay-order-ref { font-family: 'DM Mono', monospace; font-size: 1.1rem; font-weight: 800; color: var(--orange); }
    .od-pay-cust { display: flex; align-items: center; gap: 14px; background: var(--s2); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; width: 100%; }
    .od-pay-method-banner {
      width: 100%; border-radius: 10px; padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
    }
    .pmb-cash   { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); }
    .pmb-online { background: rgba(79,156,249,0.1); border: 1px solid rgba(79,156,249,0.25); }
    .od-pmb-icon { font-size: 1.8rem; flex-shrink: 0; }
    .od-pmb-method { font-size: 0.85rem; font-weight: 800; }
    .od-pmb-hint { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }
    .od-pay-amount-box { background: var(--s2); border: 1px solid var(--orange); border-radius: 12px; padding: 18px 28px; width: 100%; }
    .od-pab-label { font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    .od-pab-amount { font-size: 2.2rem; font-weight: 900; color: var(--orange); }
    .od-pay-actions { display: flex; gap: 10px; width: 100%; }
    .od-pay-btn { flex: 1; padding: 13px; border: none; border-radius: 9px; font-size: 0.85rem; font-weight: 800; cursor: pointer; transition: opacity 0.15s; }
    .od-pay-btn:hover { opacity: 0.88; }
    .od-pay-cancel  { background: var(--s3); color: var(--muted); border: 1px solid var(--border); }
    .od-pay-confirm { background: var(--green); color: #000; }

    /* Cancel modal */
    .od-cancel-body { text-align: center; align-items: center; gap: 14px !important; }
    .od-cancel-icon { font-size: 2.5rem; }
    .od-cancel-msg { font-size: 0.9rem; line-height: 1.6; color: var(--text); margin: 0; }
    .od-cancel-sub { font-size: 0.78rem; color: var(--muted); margin: 0; }
    .od-cancel-confirm { background: var(--red); color: #fff; }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 1100px) {
      .od-board { grid-template-columns: 1fr; }
      .od-col { max-height: none; min-height: auto; }
      .od-col-body { max-height: 420px; }
    }
    @media (max-width: 768px) {
      .od-header { padding: 14px 16px; }
      .od-header-center { display: none; }
      .od-board { padding: 12px; gap: 12px; }
      .od-history { margin: 0 12px; padding: 16px; }
      .od-info-grid { grid-template-columns: 1fr; }
      .od-brand { font-size: 1.1rem; }
    }
    @media (max-width: 480px) {
      .od-modal-actions { flex-direction: column; }
      .od-pay-actions { flex-direction: column; }
    }
  `],
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private toast        = inject(ToastService);
  private cdr          = inject(ChangeDetectorRef);

  // ── State ──────────────────────────────────────────────────────────────
  orders        = signal<any[]>([]);
  isRefreshing  = signal<boolean>(false);
  lastSyncTime  = signal<Date | null>(null);
  historyFilter = signal<string>('today');

  // Modal state
  detailsOrder      : any = null;
  pendingOrder      : any = null;
  cancelTargetOrder : any = null;
  showPaymentModal      = false;
  showCancelModal       = false;

  private autoRefreshInterval: any;

  // ── Static ──────────────────────────────────────────────────────────────
  readonly todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  readonly historyFilters = [
    { label: 'Today',   value: 'today' },
    { label: '7 Days',  value: 'week'  },
    { label: '30 Days', value: 'month' },
  ];

  // ── Computed ────────────────────────────────────────────────────────────
  newOrders   = computed(() => this.orders().filter(o => o.orderStatus === 'NEW'));
  prepOrders  = computed(() => this.orders().filter(o => o.orderStatus === 'PREPARING'));
  readyOrders = computed(() => this.orders().filter(o => o.orderStatus === 'READY'));
  activeOrders= computed(() => this.orders().filter(o => ['NEW','PREPARING','READY'].includes(o.orderStatus)));

  todayOrdersCount = computed(() => {
    const today = new Date().toDateString();
    return this.orders().filter(o => new Date(o.createdAt).toDateString() === today).length;
  });

  filteredHistory = computed(() => {
    const pool = this.orders().filter(o => ['COMPLETED','CANCELLED'].includes(o.orderStatus));
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

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit() {
    this.refresh();
    this.autoRefreshInterval = setInterval(() => this.refresh(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.autoRefreshInterval);
    document.body.style.overflow = '';
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  refresh() {
    if (this.isRefreshing()) return;
    this.isRefreshing.set(true);
    this.orderService.getOwnerDashboardData().subscribe({
      next: (data) => {
        this.orders.set(data);
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
      next: () => {
        this.toast.success(`Order → ${status}`);
        this.refresh();
      },
      error: () => this.toast.error('Failed to update order.'),
    });
  }

  // ── Modal: Order Detail ──────────────────────────────────────────────────
  openDetail(order: any) {
    this.detailsOrder = order;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeDetail(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('od-overlay')) {
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

  // ── Modal: Payment ───────────────────────────────────────────────────────
  // ALL orders (CASH and ONLINE, DINE IN and TAKEAWAY) go through payment confirmation
  handleCompletion(order: any) {
    this.pendingOrder    = order;
    this.showPaymentModal = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  completeWithPayment() {
    if (!this.pendingOrder) return;
    // Mark payment as PAID regardless of method (owner confirms receipt)
    this.updateStatus(this.pendingOrder._id, 'COMPLETED', 'PAID');
    this.showPaymentModal = false;
    this.pendingOrder     = null;
    document.body.style.overflow = '';
  }

  closePayModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('od-overlay')) {
      this.showPaymentModal = false;
      document.body.style.overflow = '';
    }
  }

  // ── Modal: Cancel ────────────────────────────────────────────────────────
  confirmCancel(order: any) {
    this.cancelTargetOrder = order;
    this.showCancelModal   = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeCancelModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('od-overlay')) {
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  updateHistoryFilter(val: string) {
    this.historyFilter.set(val);
  }

  getDuration(startTime: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 60000));
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
}