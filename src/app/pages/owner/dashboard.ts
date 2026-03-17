import {
  Component,
  inject,
  OnInit,
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
    <div class="admin-layout">
      <div class="admin-container">
        <!-- Header -->
        <header class="admin-header">
          <div class="header-titles">
            <h1>Order Management</h1>
            <p>Live tracking and operations dashboard</p>
          </div>
          <div class="header-actions">
            <div class="quick-stats">
              <div class="stat">
                <span class="stat-lbl">Active</span>
                <span class="stat-val primary">{{ activeOrders().length }}</span>
              </div>
              <div class="stat">
                <span class="stat-lbl">Today</span>
                <span class="stat-val">{{ todayOrdersCount() }}</span>
              </div>
            </div>
            <button class="btn-sync" (click)="refresh()" [disabled]="isRefreshing()">
              {{ isRefreshing() ? 'Syncing...' : '↻ Refresh' }}
            </button>
          </div>
        </header>

        <!-- Live Operations Board -->
        <div class="ops-board">
          <!-- Column 1: Incoming -->
          <div class="ops-column">
            <div class="col-header incoming-border">
              <h2>
                Incoming <span>({{ newOrders().length }})</span>
              </h2>
            </div>
            <div class="col-scroll">
              <div class="order-card" *ngFor="let order of newOrders()">
                <div class="card-top">
                  <button class="ref-link" (click)="openDetailedView(order)">
                    #{{ order.orderNumber }}
                  </button>
                  <span class="time">{{ order.createdAt | date: 'shortTime' }}</span>
                </div>
                <div class="card-mid">
                  <div class="cust-name">{{ order.userId?.name || 'Guest' }}</div>
                  <div class="tags">
                    <span class="tag bg-dark">{{ order.orderType }}</span>
                    <!-- FIXED: Display tableNumbers array -->
                    <span class="tag bg-green" *ngIf="order.tableNumbers?.length">
                      T: {{ order.tableNumbers.join(', ') }}
                    </span>
                    <span class="tag bg-purple" *ngIf="order.scheduledTime">
                      ⏱️ {{ order.scheduledTime | date: 'shortTime' }}
                    </span>
                    <span class="tag bg-blue" *ngIf="order.orderType === 'DINE IN' && order.numberOfPeople">
                      👥 {{ order.numberOfPeople }}
                    </span>
                  </div>
                </div>

                <!-- Full Order Details Preview -->
                <div class="card-items-preview">
                  <div class="kitchen-item" *ngFor="let item of order.items">
                    <div class="item-line">
                      <b>{{ item.quantity }}x</b>
                      <span class="i-name highlight-text">{{ item.name }}</span>
                      <span
                        class="i-var-badge"
                        [ngClass]="item.variant?.toLowerCase()"
                        *ngIf="item.variant && item.variant !== 'SINGLE'"
                      >
                        {{ item.variant }}
                      </span>
                    </div>
                    <div class="item-note" *ngIf="item.instructions">
                      📝 "{{ item.instructions }}"
                    </div>
                  </div>
                </div>

                <button class="btn-action bg-blue" (click)="updateStatus(order._id, 'PREPARING')">
                  Start Preparing
                </button>
              </div>
              <div class="empty-col" *ngIf="newOrders().length === 0">No incoming orders</div>
            </div>
          </div>

          <!-- Column 2: Preparing -->
          <div class="ops-column">
            <div class="col-header preparing-border">
              <h2>
                Preparing <span>({{ prepOrders().length }})</span>
              </h2>
            </div>
            <div class="col-scroll">
              <div class="order-card" *ngFor="let order of prepOrders()">
                <div class="card-top">
                  <button class="ref-link" (click)="openDetailedView(order)">
                    #{{ order.orderNumber }}
                  </button>
                  <span class="time text-orange">{{ getDuration(order.updatedAt) }}m elapsed</span>
                </div>
                <div class="card-mid">
                  <div class="cust-name">{{ order.userId?.name || 'Guest' }}</div>
                  <div class="tags">
                    <!-- FIXED: Display tableNumbers array -->
                    <span class="tag bg-green" *ngIf="order.tableNumbers?.length">
                      T: {{ order.tableNumbers.join(', ') }}
                    </span>
                    <span class="tag bg-purple" *ngIf="order.scheduledTime">
                      ⏱️ {{ order.scheduledTime | date: 'shortTime' }}
                    </span>
                    <span class="tag bg-blue" *ngIf="order.orderType === 'DINE IN' && order.numberOfPeople">
                      👥 {{ order.numberOfPeople }}
                    </span>
                  </div>
                </div>

                <div class="card-items-preview">
                  <div class="kitchen-item" *ngFor="let item of order.items">
                    <div class="item-line">
                      <b>{{ item.quantity }}x</b>
                      <span class="i-name highlight-text">{{ item.name }}</span>
                      <span
                        class="i-var-badge"
                        [ngClass]="item.variant?.toLowerCase()"
                        *ngIf="item.variant && item.variant !== 'SINGLE'"
                      >
                        {{ item.variant }}
                      </span>
                    </div>
                    <div class="item-note" *ngIf="item.instructions">
                      📝 "{{ item.instructions }}"
                    </div>
                  </div>
                </div>

                <button class="btn-action bg-orange" (click)="updateStatus(order._id, 'READY')">
                  Mark as Ready
                </button>
              </div>
              <div class="empty-col" *ngIf="prepOrders().length === 0">Kitchen is clear</div>
            </div>
          </div>

          <!-- Column 3: Ready -->
          <div class="ops-column">
            <div class="col-header ready-border">
              <h2>
                Ready to Serve <span>({{ readyOrders().length }})</span>
              </h2>
            </div>
            <div class="col-scroll">
              <div
                class="order-card"
                *ngFor="let order of readyOrders()"
                [class.card-unpaid]="order.paymentStatus === 'PENDING'"
              >
                <div class="card-top">
                  <button class="ref-link" (click)="openDetailedView(order)">
                    #{{ order.orderNumber }}
                  </button>
                  <span class="total-amt">₹{{ order.totalAmount }}</span>
                </div>

                <div class="payment-alert" *ngIf="order.paymentStatus === 'PENDING'">
                  Collect Payment: {{ order.paymentMethod }}
                </div>

                <div class="card-mid">
                  <div class="cust-name">{{ order.userId?.name || 'Guest' }}</div>
                  <div class="tags">
                    <!-- FIXED: Display tableNumbers array -->
                    <span class="tag bg-green" *ngIf="order.tableNumbers?.length">
                      T: {{ order.tableNumbers.join(', ') }}
                    </span>
                    <span class="tag bg-purple" *ngIf="order.scheduledTime">
                      ⏱️ {{ order.scheduledTime | date: 'shortTime' }}
                    </span>
                  </div>
                </div>

                <div class="card-items-preview">
                  <div class="kitchen-item" *ngFor="let item of order.items">
                    <div class="item-line">
                      <b>{{ item.quantity }}x</b>
                      <span class="i-name highlight-text">{{ item.name }}</span>
                      <span
                        class="i-var-badge"
                        [ngClass]="item.variant?.toLowerCase()"
                        *ngIf="item.variant && item.variant !== 'SINGLE'"
                      >
                        {{ item.variant }}
                      </span>
                    </div>
                  </div>
                </div>

                <button class="btn-action bg-green" (click)="handleCompletion(order)">
                  {{
                    order.paymentStatus === 'PENDING' ? 'Collect Cash & Close' : 'Complete Order'
                  }}
                </button>
              </div>
              <div class="empty-col" *ngIf="readyOrders().length === 0">No orders waiting</div>
            </div>
          </div>
        </div>

        <!-- History Table -->
        <section class="history-section">
          <div class="history-header">
            <h2>Recent History</h2>
            <select
              [ngModel]="historyFilter()"
              (ngModelChange)="updateHistoryFilter($event)"
              class="select-filter"
            >
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let order of filteredHistory()"
                  [class.dim-row]="order.orderStatus === 'CANCELLED'"
                >
                  <td>
                    <button class="ref-link" (click)="openDetailedView(order)">
                      #{{ order.orderNumber }}
                    </button>
                  </td>
                  <td>
                    <div class="td-stack">
                      <span>{{ order.userId?.name || 'Guest' }}</span>
                      <span class="td-sub">{{ order.userId?.mobile || 'N/A' }}</span>
                    </div>
                  </td>
                  <td>{{ order.orderType }}</td>
                  <td>
                    <span class="status-badge" [ngClass]="order.orderStatus.toLowerCase()">
                      {{ order.orderStatus }}
                    </span>
                  </td>
                  <td>₹{{ order.totalAmount }}</td>
                  <td>{{ order.updatedAt | date: 'short' }}</td>
                  <td>
                    <button
                      class="btn-text-danger"
                      *ngIf="order.orderStatus !== 'CANCELLED'"
                      (click)="voidOrderRecord(order._id)"
                    >
                      Cancel/Void
                    </button>
                    <span class="void-txt" *ngIf="order.orderStatus === 'CANCELLED'">Voided</span>
                  </td>
                </tr>
                <tr *ngIf="filteredHistory().length === 0">
                  <td colspan="7" class="text-center">No history found for this period.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- MODALS -->

      <!-- Detailed Order View Modal -->
      <div class="overlay" *ngIf="detailsOrder">
        <div class="modal-box details-modal">
          <div class="modal-header">
            <h2>Order Details #{{ detailsOrder.orderNumber }}</h2>
            <button class="btn-close" (click)="detailsOrder = null">✕</button>
          </div>

          <div class="modal-body">
            <div class="info-blocks">
              <div class="info-box">
                <span class="info-lbl">Customer</span>
                <span class="info-val">{{ detailsOrder.userId?.name || 'Guest' }}</span>
                <span class="info-sub">{{ detailsOrder.userId?.mobile }}</span>
              </div>
              <div class="info-box">
                <span class="info-lbl">Service</span>
                <span class="info-val">{{ detailsOrder.orderType }}</span>
                <!-- FIXED: Display tableNumbers array in Modal -->
                <span class="info-sub" *ngIf="detailsOrder.tableNumbers?.length">
                  Tables: {{ detailsOrder.tableNumbers.join(', ') }}
                </span>
                <span
                  class="info-sub"
                  *ngIf="detailsOrder.orderType === 'DINE IN' && detailsOrder.numberOfPeople"
                  >Guests: {{ detailsOrder.numberOfPeople }}</span
                >
                <span class="info-sub text-purple text-bold" *ngIf="detailsOrder.scheduledTime">
                  {{ detailsOrder.orderType === 'DINE IN' ? 'Arriving' : 'Pickup' }}:
                  {{ detailsOrder.scheduledTime | date: 'shortTime' }}
                </span>
              </div>
              <div class="info-box">
                <span class="info-lbl">Payment</span>
                <span
                  class="info-val"
                  [class.text-green]="detailsOrder.paymentStatus === 'PAID'"
                  [class.text-red]="detailsOrder.paymentStatus !== 'PAID'"
                >
                  {{ detailsOrder.paymentStatus }}
                </span>
                <span class="info-sub">Method: {{ detailsOrder.paymentMethod }}</span>
              </div>
            </div>

            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 15%">Qty</th>
                    <th>Item Details</th>
                    <th class="text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of detailsOrder.items">
                    <td class="qty-lg">{{ item.quantity }}x</td>
                    <td>
                      <div class="item-name-lg">
                        {{ item.name }}
                        <span
                          class="variant-badge"
                          [ngClass]="item.variant?.toLowerCase()"
                          *ngIf="item.variant && item.variant !== 'SINGLE'"
                        >
                          {{ item.variant }}
                        </span>
                      </div>
                      <div class="item-ins" *ngIf="item.instructions">
                        Note: {{ item.instructions }}
                      </div>
                    </td>
                    <td class="text-right font-bold">₹{{ item.unitPrice * item.quantity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="modal-total">
              <span>Total Amount</span>
              <span class="total-val">₹{{ detailsOrder.totalAmount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cash Handover Modal -->
      <div class="overlay" *ngIf="showPaymentModal">
        <div class="modal-box cash-modal">
          <div class="modal-header">
            <h2>Confirm Cash Payment</h2>
            <button class="btn-close" (click)="showPaymentModal = false">✕</button>
          </div>
          <div class="modal-body text-center">
            <p>
              Please confirm receipt of physical cash for
              <strong>Order #{{ pendingOrder?.orderNumber }}</strong
              >.
            </p>

            <div class="cash-amount-box">
              <span class="cash-lbl">Collect from {{ pendingOrder?.userId?.name }}</span>
              <span class="cash-val">₹{{ pendingOrder?.totalAmount }}</span>
            </div>

            <div class="modal-actions">
              <button class="btn-outline" (click)="showPaymentModal = false">Cancel</button>
              <button class="btn-fill bg-primary" (click)="completeWithPayment('PAID')">
                Confirm & Close Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Base Variables & Reset */
      :host {
        --bg-dark: #050505;
        --surface: rgba(20, 20, 20, 0.8);
        --surface-light: rgba(30, 30, 30, 0.6);
        --border: rgba(255, 255, 255, 0.08);
        --text-main: #ffffff;
        --text-muted: #888888;
        --primary: #ff6600;
        --blue: #3498db;
        --orange: #f39c12;
        --green: #2ecc71;
        --red: #ef4444;
      }

      .admin-layout {
        background: var(--bg-dark);
        min-height: 100vh;
        color: var(--text-main);
        font-family: system-ui, -apple-system, sans-serif;
        padding-top: 80px;
      }
      .admin-container {
        max-width: 1440px;
        margin: 0 auto;
        padding: 20px;
      }

      h1 { font-size: 1.5rem; margin: 0 0 4px 0; font-weight: 700; }
      h2 { font-size: 1.1rem; margin: 0; font-weight: 600; }
      p { font-size: 0.85rem; color: var(--text-muted); margin: 0; }

      .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--surface);
        backdrop-filter: blur(20px);
        padding: 20px 24px;
        border-radius: 12px;
        border: 1px solid var(--border);
        margin-bottom: 24px;
      }
      .header-actions { display: flex; align-items: center; gap: 24px; }
      .quick-stats { display: flex; gap: 20px; border-right: 1px solid var(--border); padding-right: 20px; }
      .stat { display: flex; flex-direction: column; }
      .stat-lbl { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
      .stat-val { font-size: 1.25rem; font-weight: 700; }
      .stat-val.primary { color: var(--primary); }

      .btn-sync {
        background: var(--surface-light);
        color: var(--text-main);
        border: 1px solid var(--border);
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-sync:hover:not([disabled]) { background: #2a2a2a; }

      .ops-board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 40px;
      }
      .ops-column {
        background: var(--surface);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        height: calc(100vh - 280px);
        min-height: 500px;
      }

      .col-header { padding: 16px; border-bottom: 1px solid var(--border); }
      .col-header h2 { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
      .col-header h2 span { color: var(--text-muted); font-size: 0.9rem; font-weight: normal; }

      .incoming-border { border-top: 3px solid var(--blue); border-radius: 12px 12px 0 0; }
      .preparing-border { border-top: 3px solid var(--orange); border-radius: 12px 12px 0 0; }
      .ready-border { border-top: 3px solid var(--green); border-radius: 12px 12px 0 0; }

      .col-scroll { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
      .order-card { background: var(--surface-light); backdrop-filter: blur(10px); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; }
      .card-unpaid { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05); }

      .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .ref-link { background: none; border: none; color: var(--primary); font-family: monospace; font-size: 1.05rem; font-weight: bold; cursor: pointer; padding: 0; text-decoration: underline; }
      .time { font-size: 0.8rem; color: var(--text-muted); }
      .total-amt { font-size: 1rem; font-weight: bold; color: var(--green); }
      .text-orange { color: var(--orange); }

      .payment-alert { background: var(--red); color: white; font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; text-align: center; margin-bottom: 12px; font-weight: bold; }
      .card-mid { margin-bottom: 12px; }
      .cust-name { font-size: 1rem; font-weight: 600; margin-bottom: 6px; }
      .tags { display: flex; gap: 6px; flex-wrap: wrap; }
      .tag { font-size: 0.7rem; padding: 3px 6px; border-radius: 4px; font-weight: 600; }
      .bg-dark { background: #000; border: 1px solid rgba(255, 255, 255, 0.1); color: #eee; }
      .bg-green { background: rgba(46, 204, 113, 0.15); color: var(--green); border: 1px solid rgba(46, 204, 113, 0.2); }
      .bg-purple { background: rgba(255, 204, 0, 0.1); color: #ffcc00; border: 1px solid rgba(255, 204, 0, 0.2); }
      .bg-blue { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); }

      .card-items-preview { font-size: 0.85rem; color: #ccc; background: rgba(0, 0, 0, 0.2); padding: 10px; border-radius: 6px; margin-bottom: 16px; flex-grow: 1; border: 1px solid #1a1a1a; }
      .kitchen-item { margin-bottom: 8px; }
      .item-line { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
      .item-line b { color: var(--primary); font-size: 0.95rem; }
      .highlight-text { font-weight: 700; color: #fff; font-size: 0.9rem; }
      .i-var-badge { padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; color: #000; }
      .i-var-badge.half { background: #fcd34d; }
      .i-var-badge.full { background: #34d399; }

      .item-note { font-size: 0.75rem; color: #facc15; font-style: italic; background: rgba(250, 204, 21, 0.1); padding: 4px 8px; border-radius: 4px; margin-top: 4px; border-left: 2px solid #facc15; }
      .btn-action { width: 100%; padding: 10px; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: white; cursor: pointer; transition: 0.2s; }
      .empty-col { text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 40px 0; }

      .history-section { background: var(--surface); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
      .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .select-filter { background: var(--surface-light); border: 1px solid var(--border); color: var(--text-main); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; outline: none; }
      .table-container { overflow-x: auto; }
      .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
      .data-table th { padding: 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; }
      .data-table td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .status-badge { font-size: 0.7rem; padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
      .status-badge.completed { background: rgba(16, 185, 129, 0.1); color: var(--green); }
      .status-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: var(--red); }
      .btn-text-danger { background: none; border: none; color: var(--red); cursor: pointer; font-size: 0.8rem; text-decoration: underline; }

      .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
      .modal-box { background: var(--surface); backdrop-filter: blur(25px); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5); }
      .details-modal { max-width: 600px; }
      .cash-modal { max-width: 400px; }
      .modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
      .btn-close { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }
      .modal-body { padding: 20px; overflow-y: auto; }

      .info-blocks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
      .info-box { background: var(--surface-light); padding: 12px; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; }
      .info-lbl { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
      .info-val { font-size: 0.9rem; font-weight: 600; margin-bottom: 2px; }
      .info-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
      .text-green { color: var(--green); }
      .text-red { color: var(--red); }
      .text-purple { color: #ffcc00; }
      .text-bold { font-weight: bold; }

      .items-table-wrapper { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
      .items-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left; }
      .items-table th { background: #1a1a1a; padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; }
      .items-table td { padding: 16px 12px; border-bottom: 1px solid var(--border); }

      .qty-lg { font-size: 1.1rem; font-weight: bold; color: var(--primary); vertical-align: top; }
      .item-name-lg { font-size: 1.05rem; font-weight: 700; color: #fff; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
      .variant-badge { padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; color: #000; }
      .variant-badge.half { background: #fcd34d; }
      .variant-badge.full { background: #34d399; }

      .modal-total { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border); }
      .total-val { font-size: 1.5rem; font-weight: bold; color: var(--primary); }

      .cash-amount-box { background: var(--surface-light); border: 1px solid var(--primary); padding: 20px; border-radius: 8px; margin: 20px 0; display: flex; flex-direction: column; align-items: center; }
      .cash-lbl { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; }
      .cash-val { font-size: 2rem; font-weight: bold; color: var(--primary); }

      .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); padding: 10px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
      .btn-fill { border: none; padding: 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: white; cursor: pointer; }
      .bg-primary { background: var(--primary); }

      @media (max-width: 1024px) {
        .ops-board { grid-template-columns: 1fr; }
        .ops-column { height: auto; min-height: auto; max-height: 500px; }
        .info-blocks { grid-template-columns: 1fr; }
      }
      @media (max-width: 600px) {
        .admin-header { flex-direction: column; align-items: flex-start; gap: 16px; }
        .header-actions { width: 100%; justify-content: space-between; }
      }
    `,
  ],
})
export class OwnerDashboardComponent implements OnInit {
  orderService = inject(OrderService);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  orders = signal<any[]>([]);
  isRefreshing = signal<boolean>(false);

  showPaymentModal = false;
  detailsOrder: any = null;
  pendingOrder: any = null;
  historyFilter = signal<string>('today');

  newOrders = computed(() => this.orders().filter((o) => o.orderStatus === 'NEW'));
  prepOrders = computed(() => this.orders().filter((o) => o.orderStatus === 'PREPARING'));
  readyOrders = computed(() => this.orders().filter((o) => o.orderStatus === 'READY'));

  activeOrders = computed(() =>
    this.orders().filter((o) => ['NEW', 'PREPARING', 'READY'].includes(o.orderStatus)),
  );

  todayOrdersCount = computed(() => {
    const todayStr = new Date().toDateString();
    return this.orders().filter((o) => new Date(o.createdAt).toDateString() === todayStr).length;
  });

  filteredHistory = computed(() => {
    const historyPool = this.orders().filter((o) =>
      ['COMPLETED', 'CANCELLED'].includes(o.orderStatus),
    );
    const range = this.historyFilter();
    const now = new Date();

    return historyPool.filter((o) => {
      const oDate = new Date(o.createdAt);
      if (range === 'today') return oDate.toDateString() === now.toDateString();
      if (range === 'week') {
        const diffDays = (now.getTime() - oDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (range === 'month') {
        const diffDays = (now.getTime() - oDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  });

  constructor() {
    effect(() => {
      if (this.showPaymentModal || this.detailsOrder) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnInit() {
    this.refresh();
    setInterval(() => this.refresh(), 30000);
  }

  updateHistoryFilter(val: string) {
    this.historyFilter.set(val);
    this.cdr.detectChanges();
  }

  refresh() {
    if (this.isRefreshing()) return;
    this.isRefreshing.set(true);
    this.orderService.getOwnerDashboardData().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isRefreshing.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isRefreshing.set(false);
        this.toast.error('Sync failed.');
      },
    });
  }

  updateStatus(id: string, status: string, paymentStatus?: string) {
    this.orderService.updateOrderStatus(id, status, paymentStatus).subscribe({
      next: () => {
        this.toast.success(`Moved to ${status}`);
        this.refresh();
      },
      error: () => this.toast.error('Error updating order.'),
    });
  }

  voidOrderRecord(id: string) {
    if (confirm('Cancel and VOID this record?')) {
      this.orderService.updateOrderStatus(id, 'CANCELLED').subscribe(() => {
        this.toast.success('Order Voided.');
        this.refresh();
      });
    }
  }

  openDetailedView(order: any) {
    this.detailsOrder = order;
    this.cdr.detectChanges();
  }

  handleCompletion(order: any) {
    if (order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING') {
      this.pendingOrder = order;
      this.showPaymentModal = true;
      this.cdr.detectChanges();
    } else {
      this.updateStatus(order._id, 'COMPLETED');
    }
  }

  completeWithPayment(status: 'PAID' | 'PENDING') {
    if (!this.pendingOrder) return;
    this.updateStatus(this.pendingOrder._id, 'COMPLETED', status);
    this.showPaymentModal = false;
    this.pendingOrder = null;
  }

  getDuration(startTime: string): number {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((now - start) / 60000));
  }
}