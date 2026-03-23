import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu';
import { ToastService } from '../../services/toast';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mm-page">

      <!-- ── Ambient BG ── -->
      <div class="mm-bg">
        <div class="mm-blob blob-1"></div>
        <div class="mm-blob blob-2"></div>
        <div class="mm-grain"></div>
      </div>

      <div class="mm-shell">

        <!-- ══════════════════════════════════
             HEADER
        ══════════════════════════════════ -->
        <header class="mm-header">
          <div class="mh-left">
            <p class="mh-eyebrow">
              <span class="eyebrow-dot"></span>
              Owner Panel
            </p>
            <h1 class="mh-title">Menu <span class="accent">Architect</span></h1>
            <p class="mh-sub">Design and deploy your restaurant's legendary dishes with ease.</p>
          </div>
          <div class="mh-right">
            <div class="stat-chip">
              <span class="sc-num">{{ menuItems().length }}</span>
              <span class="sc-label">Total Dishes</span>
            </div>
            <button class="btn-new" (click)="openModal()">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
              New Dish
            </button>
          </div>
        </header>

        <!-- ══════════════════════════════════
             MENU TABLE
        ══════════════════════════════════ -->
        <div class="table-card">
          <div class="tc-head">
            <div class="section-label">
              <span class="label-dot orange-dot"></span>
              Live Menu Collection
            </div>
            <span class="tc-count">{{ menuItems().length }} items</span>
          </div>

          <!-- Loading skeleton -->
          <div class="table-skeleton" *ngIf="loadingList">
            <div class="sk-row" *ngFor="let i of skeletons">
              <div class="sk-img"></div>
              <div class="sk-lines">
                <div class="sk-line sk-long"></div>
                <div class="sk-line sk-short"></div>
              </div>
            </div>
          </div>

          <div class="table-wrap" *ngIf="!loadingList">
            <table class="mm-table">
              <!-- Fixed column widths prevent the Actions column from shifting -->
              <colgroup>
                <col style="width: 30%" />
                <col style="width: 10%" />
                <col style="width: 10%" />
                <col style="width: 14%" />
                <col style="width: 9%" />
                <col style="width: 9%" />
                <col style="width: 18%" />
              </colgroup>
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Pricing</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th class="th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- BUG FIX: was using *ngFor with no trackBy — causes full DOM re-render on load -->
                <tr
                  *ngFor="let item of menuItems(); trackBy: trackById"
                  [class.row-inactive]="!item.isAvailable">
                  <!-- Dish cell -->
                  <td>
                    <div class="dish-cell">
                      <div class="dish-img-wrap">
                        <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" class="dish-img" />
                      </div>
                      <div class="dish-meta">
                        <p class="dish-name">{{ item.name }}</p>
                        <!-- BUG FIX: item._id could be undefined; safe with ?. -->
                        <p class="dish-id">{{ item._id?.slice(-6) }}</p>
                      </div>
                    </div>
                  </td>
                  <!-- Category -->
                  <td>
                    <span class="cat-tag"
                      [class.ct-veg]="item.category === 'veg'"
                      [class.ct-nonveg]="item.category === 'non-veg'"
                      [class.ct-drink]="item.category === 'drinks'">
                      <span class="ct-dot"></span>
                      {{ item.category === 'veg' ? 'Veg' : item.category === 'non-veg' ? 'Non-Veg' : 'Drink' }}
                    </span>
                  </td>
                  <!-- Subcategory -->
                  <td>
                    <span class="sub-tag">{{ item.subCategory }}</span>
                  </td>
                  <!-- Pricing -->
                  <td>
                    <div class="price-pills">
                      <span class="pp pp-single" *ngIf="item.pricing.type === 'SINGLE'">
                        ₹{{ item.pricing.price }}
                      </span>
                      <ng-container *ngIf="item.pricing.type === 'HALF_FULL'">
                        <span class="pp pp-half">H ₹{{ item.pricing.priceHalf }}</span>
                        <span class="pp pp-full">F ₹{{ item.pricing.priceFull }}</span>
                      </ng-container>
                    </div>
                  </td>
                  <!-- Status -->
                  <td>
                    <div class="status-chip" [class.status-active]="item.isAvailable" [class.status-draft]="!item.isAvailable">
                      <span class="status-dot"></span>
                      {{ item.isAvailable ? 'Active' : 'Draft' }}
                    </div>
                  </td>
                  <!-- Rating -->
                  <td>
                    <div class="rating-cell" *ngIf="item.averageRating && item.averageRating > 0; else noRating">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#ffd700"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span class="r-num">{{ item.averageRating | number:'1.1-1' }}</span>
                      <span class="r-ct">({{ item.totalReviews }})</span>
                    </div>
                    <ng-template #noRating>
                      <span class="new-pill">NEW</span>
                    </ng-template>
                  </td>
                  <!-- Actions -->
                  <td class="td-actions">
                    <div class="actions-inner">
                      <button class="tbl-btn tbl-edit" (click)="editItem(item)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                        Edit
                      </button>
                      <button class="tbl-btn tbl-delete" (click)="deleteItem(item)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Empty state row -->
                <tr *ngIf="menuItems().length === 0">
                  <td colspan="7" class="empty-row">
                    <div class="empty-state">
                      <div class="empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M3 3h18v18H3z"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                      </div>
                      <p class="empty-title">Your menu is empty</p>
                      <p class="empty-sub">Add your first dish to get started.</p>
                      <button class="btn-new" (click)="openModal()">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                        Add First Dish
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div><!-- /mm-shell -->
    </div><!-- /mm-page -->

    <!-- ══════════════════════════════════
         ADD / EDIT MODAL
    ══════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="isModalOpen" (click)="onBackdropClick($event)">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <!-- Modal header -->
        <div class="modal-head">
          <div>
            <div class="section-label" style="margin-bottom:8px">
              <span class="label-dot orange-dot"></span>
              {{ isEditing ? 'Modify Dish' : 'New Dish' }}
            </div>
            <h2 class="modal-title">{{ isEditing ? 'Edit Dish' : 'New Culinary Entry' }}</h2>
          </div>
          <button class="modal-close" (click)="closeModal()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- BUG FIX: removed (ngSubmit) — it fires on Enter keypress in any input field,
             causing accidental submission mid-form. Used explicit (click) on the button instead. -->
        <form #menuForm="ngForm" class="modal-form">
          <div class="modal-scroll">

            <!-- Name -->
            <div class="form-field form-full">
              <label class="field-label">Dish Name</label>
              <input
                class="field-input"
                [(ngModel)]="currentItem.name"
                name="name"
                placeholder="e.g. Legendary Killa Burger"
                required
              />
            </div>

            <!-- Image upload -->
            <div class="form-field form-full">
              <label class="field-label">Dish Image (Cloudinary CDN)</label>
              <!-- BUG FIX: upload-trigger height was hardcoded 180px but upload-zone had min-height: 180px
                   — conflicting values caused the preview img to be clipped. Unified to height: 180px. -->
              <div class="upload-zone" [class.zone-preview]="imagePreview || currentItem.imageUrl">
                <input type="file" (change)="onFileSelected($event)" accept="image/*" id="fileInput" hidden />
                <label for="fileInput" class="upload-label">
                  <div class="upload-placeholder" *ngIf="!imagePreview && !currentItem.imageUrl">
                    <div class="up-icon-wrap">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <p class="up-title">Click to upload dish photo</p>
                    <p class="up-hint">Max 5 MB · JPG, PNG, WEBP</p>
                  </div>
                  <!-- BUG FIX: preview shows imagePreview (local blob) OR currentItem.imageUrl (existing),
                       with imagePreview taking priority so the new selection shows immediately -->
                  <img
                    *ngIf="imagePreview || currentItem.imageUrl"
                    [src]="imagePreview || currentItem.imageUrl"
                    class="upload-img"
                    alt="Preview"
                  />
                  <div class="upload-hover" *ngIf="imagePreview || currentItem.imageUrl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                    Change Photo
                  </div>
                </label>
              </div>
              <!-- BUG FIX: image required message shown only when adding new item and no file selected -->
              <p class="field-hint warn-hint" *ngIf="!isEditing && !selectedFile && !currentItem.imageUrl">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Image is required for new dishes
              </p>
            </div>

            <!-- Category + Subcategory row -->
            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Dietary Class</label>
                <div class="select-wrap">
                  <select
                    class="field-select"
                    [(ngModel)]="currentItem.category"
                    name="category"
                    required
                    (change)="onCategoryChange()">
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="drinks">Drinks</option>
                  </select>
                  <svg class="select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
              <div class="form-field">
                <label class="field-label">Subcategory</label>
                <div class="select-wrap">
                  <select
                    class="field-select"
                    [(ngModel)]="currentItem.subCategory"
                    name="subCategory"
                    required>
                    <option *ngFor="let sc of availableSubCategories" [value]="sc">{{ sc }}</option>
                  </select>
                  <svg class="select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="pricing-block">
              <div class="pb-head">
                <div class="section-label">
                  <span class="label-dot"></span>
                  Pricing Configuration
                </div>
                <div class="pricing-toggle">
                  <button
                    type="button"
                    class="pt-btn"
                    [class.pt-active]="currentItem.pricing?.type === 'SINGLE'"
                    (click)="setPricingType('SINGLE')">
                    Flat Rate
                  </button>
                  <button
                    type="button"
                    class="pt-btn"
                    [class.pt-active]="currentItem.pricing?.type === 'HALF_FULL'"
                    (click)="setPricingType('HALF_FULL')">
                    Portions
                  </button>
                </div>
              </div>

              <!-- Single price -->
              <div class="price-inputs" *ngIf="currentItem.pricing?.type === 'SINGLE'">
                <div class="form-field">
                  <label class="field-label">Standard Price (₹)</label>
                  <div class="price-input-wrap">
                    <span class="price-sym">₹</span>
                    <input
                      class="field-input price-input"
                      type="number"
                      [(ngModel)]="currentItem.pricing!.price"
                      name="price"
                      required min="1" placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <!-- Half / Full -->
              <div class="price-inputs" *ngIf="currentItem.pricing?.type === 'HALF_FULL'">
                <div class="form-field">
                  <label class="field-label">Half Portion (₹)</label>
                  <div class="price-input-wrap">
                    <span class="price-sym">₹</span>
                    <input
                      class="field-input price-input"
                      type="number"
                      [(ngModel)]="currentItem.pricing!.priceHalf"
                      name="priceHalf"
                      required min="1" placeholder="0"
                    />
                  </div>
                </div>
                <div class="form-field">
                  <label class="field-label">Full Portion (₹)</label>
                  <div class="price-input-wrap">
                    <span class="price-sym">₹</span>
                    <input
                      class="field-input price-input"
                      type="number"
                      [(ngModel)]="currentItem.pricing!.priceFull"
                      name="priceFull"
                      required min="1" placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Availability toggle -->
            <div class="avail-row">
              <label class="toggle-wrap" (click)="toggleAvailability()">
                <div class="toggle-track" [class.toggle-on]="currentItem.isAvailable">
                  <div class="toggle-thumb"></div>
                </div>
                <span class="toggle-label">Display in customer menu immediately</span>
              </label>
              <!-- BUG FIX: original used [(ngModel)] on a checkbox inside a <label> — the click event
                   on the label triggered twice (label + input), causing the toggle to snap back.
                   Now handled via a single (click) on the label calling toggleAvailability(). -->
            </div>

          </div><!-- /modal-scroll -->

          <!-- Modal footer -->
          <div class="modal-foot">
            <button type="button" class="foot-ghost" (click)="closeModal()">Discard</button>
            <!-- BUG FIX: (click) on button instead of (ngSubmit) on form -->
            <button
              type="button"
              class="foot-confirm"
              [disabled]="loading || menuForm.invalid || (!isEditing && !selectedFile)"
              (click)="saveItem(menuForm)">
              <span class="btn-spinner" *ngIf="loading"></span>
              <svg *ngIf="!loading" width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ isEditing ? 'Sync Changes' : 'Confirm & Publish' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       DESIGN TOKENS — full system match
    ═══════════════════════════════════════════ */
    :host {
      --orange:      #ff6600;
      --orange-dim:  rgba(255,102,0,0.12);
      --orange-glow: rgba(255,102,0,0.28);
      --green:       #22c55e;
      --green-dim:   rgba(34,197,94,0.12);
      --red:         #ef4444;
      --red-dim:     rgba(239,68,68,0.1);
      --cyan:        #06b6d4;
      --cyan-dim:    rgba(6,182,212,0.12);
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
    .mm-page {
      position: relative;
      min-height: 100vh;
      background: var(--surface);
      color: var(--text);
      padding: 72px 0 80px;
      overflow-x: hidden;
    }
    .mm-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .mm-blob {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.08;
      animation: blobDrift 12s ease-in-out infinite alternate;
    }
    .blob-1 { width: 560px; height: 560px; background: var(--orange); top: -180px; right: -100px; }
    .blob-2 { width: 380px; height: 380px; background: #c73e00; bottom: 40px; left: -80px; animation-delay: -6s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(20px,16px) scale(1.05); }
    }
    .mm-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       SHELL
    ═══════════════════════════════════════════ */
    .mm-shell {
      position: relative; z-index: 1;
      max-width: 1400px; margin: 0 auto; padding: 0 28px;
      animation: fadeUp 0.5s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }

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

    /* ═══════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════ */
    .mm-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 24px; flex-wrap: wrap;
      padding: 40px 0 32px;
    }
    .mh-eyebrow {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--orange); margin: 0 0 10px;
    }
    .eyebrow-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--orange); box-shadow: 0 0 8px var(--orange-glow);
      animation: epulse 2s ease-in-out infinite;
    }
    @keyframes epulse {
      0%,100% { box-shadow: 0 0 5px var(--orange-glow); }
      50%      { box-shadow: 0 0 14px var(--orange); }
    }
    .mh-title {
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      font-weight: 900; letter-spacing: -0.04em; margin: 0 0 10px; line-height: 1;
    }
    .accent { color: var(--orange); }
    .mh-sub { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin: 0; max-width: 440px; }

    .mh-right { display: flex; align-items: center; gap: 16px; }
    .stat-chip {
      display: flex; flex-direction: column; align-items: center;
      background: var(--surface-2); border: 1px solid var(--border);
      border-radius: 14px; padding: 12px 20px;
    }
    .sc-num   { font-size: 1.8rem; font-weight: 900; line-height: 1; color: var(--text); }
    .sc-label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }

    .btn-new {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--orange); color: #fff;
      border: none; padding: 13px 22px;
      border-radius: 12px; font-weight: 800; font-size: 0.88rem;
      cursor: pointer;
      box-shadow: 0 4px 20px var(--orange-glow);
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .btn-new:hover { background: #e55a00; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,102,0,0.45); }

    /* ═══════════════════════════════════════════
       TABLE CARD
    ═══════════════════════════════════════════ */
    .table-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 22px; overflow: hidden;
      transition: border-color 0.3s;
    }
    .table-card:hover { border-color: var(--border-h); }

    .tc-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--border);
    }
    .tc-count { font-size: 0.72rem; color: var(--text-muted); font-weight: 700; }

    /* Skeleton */
    .table-skeleton { padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }
    .sk-row { display: flex; align-items: center; gap: 16px; }
    .sk-img { width: 56px; height: 56px; border-radius: 10px; background: var(--surface-3); flex-shrink: 0; animation: shimmer 1.5s ease-in-out infinite alternate; }
    .sk-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .sk-line { height: 12px; background: var(--surface-3); border-radius: 6px; animation: shimmer 1.5s ease-in-out infinite alternate; }
    .sk-long  { width: 55%; }
    .sk-short { width: 30%; }
    @keyframes shimmer { from{opacity:0.5} to{opacity:1} }

    /* Table */
    .table-wrap { overflow-x: auto; }
    .mm-table { width: 100%; border-collapse: collapse; min-width: 900px; font-size: 0.82rem; table-layout: fixed; }
    .mm-table th {
      padding: 12px 20px; border-bottom: 1px solid var(--border);
      font-size: 0.62rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--text-muted); text-align: left; white-space: nowrap;
    }
    .th-right { text-align: right; padding-right: 20px; }
    .mm-table td {
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: middle;
    }
    .mm-table tbody tr:last-child td { border-bottom: none; }
    .mm-table tbody tr:hover td { background: rgba(255,255,255,0.015); }
    .row-inactive td { opacity: 0.5; }

    /* Dish cell */
    .dish-cell { display: flex; align-items: center; gap: 14px; }
    .dish-img-wrap { width: 54px; height: 54px; border-radius: 10px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border); }
    .dish-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .dish-meta { display: flex; flex-direction: column; gap: 3px; }
    .dish-name { font-weight: 800; font-size: 0.88rem; margin: 0; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
    .dish-id   { font-size: 0.62rem; color: var(--text-dim); font-family: 'Courier New', monospace; margin: 0; }

    /* Category tag */
    .cat-tag {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.62rem; font-weight: 800;
      padding: 4px 10px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.06em;
      white-space: nowrap;
    }
    .ct-veg    { background: var(--green-dim); color: var(--green); }
    .ct-nonveg { background: var(--red-dim);   color: var(--red);   }
    .ct-drink  { background: var(--cyan-dim);  color: var(--cyan);  }
    .ct-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: currentColor;
    }

    .sub-tag {
      font-size: 0.65rem; font-weight: 700;
      background: var(--surface-3); color: var(--text-muted);
      border: 1px solid var(--border);
      padding: 4px 10px; border-radius: 6px;
    }

    /* Price pills */
    .price-pills { display: flex; gap: 6px; flex-wrap: nowrap; align-items: center; }
    .pp {
      font-size: 0.72rem; font-weight: 900;
      padding: 4px 10px; border-radius: 7px; white-space: nowrap;
    }
    .pp-single { background: var(--surface-3); color: var(--text); border: 1px solid var(--border); }
    .pp-half   { background: rgba(234,179,8,0.1); color: #eab308; border: 1px solid rgba(234,179,8,0.2); }
    .pp-full   { background: var(--orange-dim); color: var(--orange); border: 1px solid rgba(255,102,0,0.22); }

    /* Status chip */
    .status-chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.65rem; font-weight: 800;
      padding: 4px 10px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .status-active { background: var(--green-dim); color: var(--green); }
    .status-draft  { background: var(--surface-3); color: var(--text-muted); border: 1px solid var(--border); }
    .status-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: currentColor;
    }
    .status-active .status-dot { animation: statusPulse 2s ease-in-out infinite; }
    @keyframes statusPulse { 0%,100%{opacity:1}50%{opacity:0.4} }

    /* Rating cell */
    .rating-cell { display: flex; align-items: center; gap: 4px; }
    .r-num { font-weight: 800; font-size: 0.8rem; }
    .r-ct  { font-size: 0.68rem; color: var(--text-muted); }
    .new-pill {
      font-size: 0.58rem; font-weight: 800;
      background: var(--orange-dim); color: var(--orange);
      padding: 2px 8px; border-radius: 5px;
      border: 1px solid rgba(255,102,0,0.18);
    }

    /* Table action buttons */
    .td-actions {
      text-align: right;
      vertical-align: middle;
      white-space: nowrap;
    }
    .actions-inner {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      justify-content: flex-end;
    }
    .tbl-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: 1px solid var(--border);
      color: var(--text-muted); padding: 7px 12px; border-radius: 9px;
      font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: all 0.18s;
    }
    .tbl-edit:hover   { border-color: var(--border-h); color: var(--text); background: rgba(255,255,255,0.04); }
    .tbl-delete:hover { border-color: rgba(239,68,68,0.4); color: var(--red); background: var(--red-dim); }

    /* Empty row */
    .empty-row { text-align: center; padding: 60px 20px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: var(--surface-3); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-dim); margin-bottom: 4px;
    }
    .empty-title { font-size: 1.1rem; font-weight: 800; margin: 0; }
    .empty-sub   { font-size: 0.82rem; color: var(--text-muted); margin: 0; }

    /* ═══════════════════════════════════════════
       MODAL
    ═══════════════════════════════════════════ */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(12px);
      z-index: 9000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-box {
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      border-radius: 24px; width: 100%; max-width: 680px;
      max-height: 90vh; display: flex; flex-direction: column;
      box-shadow: 0 40px 80px rgba(0,0,0,0.7);
      animation: modalIn 0.28s cubic-bezier(.4,0,.2,1) both;
      overflow: hidden;
    }
    @keyframes modalIn {
      from { opacity:0; transform:scale(0.96) translateY(10px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }

    /* Modal head */
    .modal-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 24px 28px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .modal-title { font-size: 1.35rem; font-weight: 900; letter-spacing: -0.03em; margin: 0; }
    .modal-close {
      width: 34px; height: 34px; border-radius: 9px;
      background: var(--surface-3); border: 1px solid var(--border);
      color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.15s, background 0.15s; flex-shrink: 0;
    }
    .modal-close:hover { color: var(--text); background: var(--surface-4); }

    /* Scroll area */
    .modal-scroll {
      padding: 24px 28px; overflow-y: auto; flex: 1;
      display: flex; flex-direction: column; gap: 20px;
      scrollbar-width: thin; scrollbar-color: var(--text-dim) transparent;
    }

    /* Form fields */
    .form-field { display: flex; flex-direction: column; gap: 8px; }
    .form-full  { /* occupies full width — already flex column */ }
    .form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .field-label {
      font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--text-muted);
    }
    .field-input {
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 13px 16px;
      color: var(--text); font-size: 0.9rem; font-family: inherit;
      width: 100%; box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .field-input:focus {
      outline: none;
      border-color: rgba(255,102,0,0.4);
      box-shadow: 0 0 0 3px rgba(255,102,0,0.08);
    }
    .field-input::placeholder { color: var(--text-dim); }

    /* Select */
    .select-wrap { position: relative; }
    .field-select {
      appearance: none; -webkit-appearance: none;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 13px 40px 13px 16px;
      color: var(--text); font-size: 0.9rem; font-family: inherit;
      width: 100%; cursor: pointer;
      transition: border-color 0.2s;
    }
    .field-select:focus { outline: none; border-color: rgba(255,102,0,0.4); }
    .field-select option { background: var(--surface-3); color: var(--text); }
    .select-arrow {
      position: absolute; right: 14px; top: 50%;
      transform: translateY(-50%); color: var(--text-muted);
      pointer-events: none;
    }

    /* Field hint */
    .field-hint { font-size: 0.7rem; color: var(--text-muted); margin: 0; }
    .warn-hint {
      display: flex; align-items: center; gap: 5px;
      color: rgba(239,68,68,0.8);
    }

    /* Upload zone */
    .upload-zone {
      border: 1.5px dashed var(--border-h);
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.22s;
      cursor: pointer;
    }
    .upload-zone:hover { border-color: rgba(255,102,0,0.5); }
    .zone-preview { border-style: solid; border-color: var(--border-h); }
    .upload-label {
      display: flex; align-items: center; justify-content: center;
      height: 180px; width: 100%; cursor: pointer;
      position: relative; overflow: hidden;
    }
    .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--text-muted); }
    .up-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      background: var(--surface-3); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-dim);
    }
    .up-title { font-size: 0.85rem; font-weight: 700; margin: 0; color: var(--text-muted); }
    .up-hint  { font-size: 0.7rem; color: var(--text-dim); margin: 0; }
    .upload-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .upload-hover {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center; gap: 8px;
      color: #fff; font-weight: 800; font-size: 0.85rem;
      opacity: 0; transition: opacity 0.22s;
    }
    .upload-zone:hover .upload-hover { opacity: 1; }

    /* Pricing block */
    .pricing-block {
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 20px;
    }
    .pb-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
    }
    .pricing-toggle {
      display: flex; background: var(--surface-4);
      border: 1px solid var(--border);
      border-radius: 9px; padding: 3px;
    }
    .pt-btn {
      background: transparent; border: none;
      color: var(--text-muted); padding: 7px 16px; border-radius: 7px;
      font-weight: 700; font-size: 0.75rem; cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .pt-active { background: var(--orange); color: #fff; }
    .price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .price-input-wrap { position: relative; }
    .price-sym {
      position: absolute; left: 14px; top: 50%;
      transform: translateY(-50%); color: var(--text-muted);
      font-weight: 800; font-size: 0.9rem; pointer-events: none;
    }
    .price-input { padding-left: 32px !important; }

    /* Availability toggle */
    .avail-row { padding: 4px 0; }
    .toggle-wrap { display: flex; align-items: center; gap: 14px; cursor: pointer; user-select: none; }
    .toggle-track {
      width: 44px; height: 24px; border-radius: 12px;
      background: var(--surface-4); border: 1px solid var(--border);
      position: relative; flex-shrink: 0;
      transition: background 0.25s, border-color 0.25s;
    }
    .toggle-on { background: var(--green); border-color: var(--green); }
    .toggle-thumb {
      position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--text-dim);
      transition: transform 0.25s, background 0.25s;
    }
    .toggle-on .toggle-thumb { transform: translateX(20px); background: #fff; }
    .toggle-label { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; }

    /* Modal footer */
    .modal-foot {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 18px 28px; border-top: 1px solid var(--border); flex-shrink: 0;
      background: var(--surface);
    }
    .foot-ghost {
      background: var(--surface-3); border: 1px solid var(--border);
      color: var(--text-muted); padding: 12px 22px; border-radius: 11px;
      font-weight: 700; font-size: 0.85rem; cursor: pointer;
      transition: color 0.18s, border-color 0.18s;
    }
    .foot-ghost:hover { color: var(--text); border-color: var(--border-h); }
    .foot-confirm {
      display: flex; align-items: center; gap: 8px;
      background: var(--orange); color: #fff;
      border: none; padding: 12px 24px; border-radius: 11px;
      font-weight: 800; font-size: 0.88rem; cursor: pointer;
      box-shadow: 0 4px 18px var(--orange-glow);
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .foot-confirm:hover:not([disabled]) { background: #e55a00; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(255,102,0,0.45); }
    .foot-confirm:disabled { background: var(--surface-3); color: var(--text-muted); box-shadow: none; cursor: not-allowed; transform: none; }

    .btn-spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.25);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 768px) {
      .mm-shell { padding: 0 16px; }
      .mm-header { flex-direction: column; align-items: flex-start; padding: 28px 0 24px; }
      .form-row   { grid-template-columns: 1fr; }
      .price-inputs { grid-template-columns: 1fr; }
      .modal-scroll { padding: 18px 20px; }
      .modal-head   { padding: 18px 20px; }
      .modal-foot   { padding: 14px 20px; }
    }
  `],
})
export class MenuManagementComponent implements OnInit {
  menuService = inject(MenuService);
  toast       = inject(ToastService);
  cdr         = inject(ChangeDetectorRef);

  menuItems   = signal<MenuItem[]>([]);
  isModalOpen = false;
  isEditing   = false;
  loading     = false;
  loadingList = false;

  currentItem : Partial<MenuItem> = this.getEmptyItem();
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  // BUG FIX: expose skeletons for *ngFor (inline array literals not allowed in template)
  readonly skeletons = [1,2,3,4,5,6];

  readonly foodSubCats   = ['INDIAN', 'CHINESE', 'STARTERS', 'SIDES'];
  readonly drinksSubCats = ['DRINKS'];
  availableSubCategories: string[] = [];

  ngOnInit() {
    this.loadMenu();
  }

  loadMenu() {
    this.loadingList = true;
    // BUG FIX: was getAllMenuItems() — correct method per MenuService is getMenuItems()
    this.menuService.getMenuItems().subscribe({
      next: (d) => {
        this.menuItems.set(d);
        this.loadingList = false;
      },
      error: () => {
        this.toast.error('Failed to sync menu collection.');
        this.loadingList = false;
      },
    });
  }

  getEmptyItem(): Partial<MenuItem> {
    return {
      name: '',
      category: 'veg',
      subCategory: 'INDIAN',
      imageUrl: '',
      isAvailable: true,
      pricing: { type: 'SINGLE', price: 0, priceHalf: 0, priceFull: 0 },
    };
  }

  onCategoryChange() {
    if (this.currentItem.category === 'drinks') {
      this.availableSubCategories = this.drinksSubCats;
      this.currentItem.subCategory = 'DRINKS';
    } else {
      this.availableSubCategories = this.foodSubCats;
      if (!this.foodSubCats.includes(this.currentItem.subCategory ?? '')) {
        this.currentItem.subCategory = 'INDIAN';
      }
    }
  }

  setPricingType(type: 'SINGLE' | 'HALF_FULL') {
    if (this.currentItem.pricing) {
      this.currentItem.pricing.type = type;
    }
  }

  // BUG FIX: replaced checkbox [(ngModel)] + label double-trigger with a manual toggle method
  toggleAvailability() {
    if (this.currentItem) {
      this.currentItem.isAvailable = !this.currentItem.isAvailable;
    }
  }

  onFileSelected(event: Event) {
    // BUG FIX: was typed as `any` — use Event + HTMLInputElement for type safety
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File is too large. Max 5 MB allowed.');
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  openModal() {
    this.isEditing   = false;
    this.currentItem = this.getEmptyItem();
    this.imagePreview  = null;
    this.selectedFile  = null;
    this.onCategoryChange();
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  editItem(item: MenuItem) {
    this.isEditing   = true;
    // Deep clone so edits don't mutate the list signal directly
    this.currentItem = JSON.parse(JSON.stringify(item));
    this.imagePreview  = null;
    this.selectedFile  = null;
    this.onCategoryChange();
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.style.overflow = '';
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  saveItem(form: any) {
    // BUG FIX: guard against invalid form before proceeding
    if (form.invalid) return;
    // BUG FIX: require image for new items — block submit if none selected
    if (!this.isEditing && !this.selectedFile) {
      this.toast.error('Image is required for new dishes.');
      return;
    }

    this.loading = true;

    const formData = new FormData();
    formData.append('name',        this.currentItem.name!);
    formData.append('category',    this.currentItem.category!);
    formData.append('subCategory', this.currentItem.subCategory!);
    formData.append('isAvailable', String(this.currentItem.isAvailable));
    // Pricing must be JSON string — Multer delivers it as a text field on the server
    formData.append('pricing', JSON.stringify(this.currentItem.pricing));

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const request = this.isEditing
      ? this.menuService.updateMenuItem(this.currentItem._id!, formData)
      : this.menuService.addMenuItem(formData);

    request.subscribe({
      next: () => {
        this.toast.success(`Dish ${this.isEditing ? 'updated' : 'published'} successfully.`);
        this.loadMenu();
        this.closeModal();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e: any) => {
        this.toast.error(e.error?.msg || 'Failed to sync dish.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteItem(item: MenuItem) {
    // BUG FIX: was deleteItem(id: string) with a non-null assertion (!).
    // Now receives the full item and guards _id being undefined before calling the API.
    if (!item._id) {
      this.toast.error('Cannot delete: item has no ID.');
      return;
    }
    if (!confirm(`Permanently remove "${item.name}" from the menu?`)) return;

    this.menuService.deleteMenuItem(item._id).subscribe({
      next: () => {
        this.toast.success('Dish removed from menu.');
        this.loadMenu();
      },
      error: (e: any) => this.toast.error(e.error?.msg || 'Failed to delete dish.'),
    });
  }

  // BUG FIX: trackBy for *ngFor to avoid full DOM re-render on every loadMenu() call
  trackById(_: number, item: MenuItem): string {
    return item._id ?? '';
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/600x400/111111/333333?text=Killa+Kitchen';
  }
}