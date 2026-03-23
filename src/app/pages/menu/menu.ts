import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="menu-page">

      <!-- ── Ambient background ── -->
      <div class="menu-bg">
        <div class="mb-blob blob-1"></div>
        <div class="mb-blob blob-2"></div>
        <div class="mb-grain"></div>
      </div>

      <!-- ══════════════════════════════════
           HEADER
      ══════════════════════════════════ -->
      <header class="menu-header">
        <div class="mh-inner">
          <div class="mh-text">
            <p class="mh-eyebrow">
              <span class="eyebrow-dot"></span>
              Killa Kitchen
            </p>
            <h1 class="mh-title">The <span class="accent">Collection</span></h1>
            <p class="mh-sub">Curated flavors from our legendary kitchen. Fresh, bold, and made to order.</p>
          </div>

          <!-- Search -->
          <div class="search-wrap">
            <div class="search-box" [class.search-focused]="searchFocused">
              <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="applyFilters()"
                (focus)="searchFocused = true"
                (blur)="searchFocused = false"
                placeholder="Search dishes or categories…"
                class="search-input"
              />
              <button
                class="search-clear"
                *ngIf="searchQuery.length > 0"
                (click)="clearSearch()">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              </button>
            </div>

            <!-- Live result count -->
            <p class="result-count" *ngIf="!loading()">
              <span class="rc-num">{{ filteredItems().length }}</span>
              {{ filteredItems().length === 1 ? 'dish' : 'dishes' }} found
            </p>
          </div>
        </div>
      </header>

      <!-- ══════════════════════════════════
           STICKY CATEGORY NAV
      ══════════════════════════════════ -->
      <nav class="cat-nav">
        <div class="cat-inner">
          <div class="cat-chips">
            <button
              class="cat-chip"
              *ngFor="let cat of activeCategories()"
              [class.chip-active]="selectedCategory() === cat.value"
              [class.chip-special]="cat.value === 'Recommended'"
              (click)="filterByCategory(cat.value)">
              <!-- AI pulse dot -->
              <span class="chip-ai-dot" *ngIf="cat.value === 'Recommended'"></span>
              <!-- Category color pip -->
              <span class="chip-pip pip-veg"    *ngIf="cat.value === 'veg'"></span>
              <span class="chip-pip pip-nonveg" *ngIf="cat.value === 'non-veg'"></span>
              <span class="chip-pip pip-drink"  *ngIf="cat.value === 'drinks'"></span>
              {{ cat.label }}
              <!-- Count badge -->
              <span class="chip-count" *ngIf="cat.value !== 'Recommended'">
                {{ getCategoryCount(cat.value) }}
              </span>
            </button>
          </div>
        </div>
      </nav>

      <!-- ══════════════════════════════════
           MAIN CONTENT
      ══════════════════════════════════ -->
      <main class="menu-main">
        <div class="menu-container">

          <!-- ── Skeleton loader ── -->
          <div class="menu-grid" *ngIf="loading()">
            <div class="skeleton-card" *ngFor="let i of skeletons">
              <div class="sk-img"></div>
              <div class="sk-body">
                <div class="sk-line sk-long"></div>
                <div class="sk-line sk-short"></div>
                <div class="sk-line sk-mid"></div>
              </div>
            </div>
          </div>

          <!-- ── Empty state ── -->
          <div class="empty-state" *ngIf="!loading() && filteredItems().length === 0">
            <div class="empty-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3 class="empty-title">Nothing found</h3>
            <p class="empty-sub">We couldn't find anything matching your search. Try different filters.</p>
            <button class="btn-reset" (click)="resetFilters()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
              View All Dishes
            </button>
          </div>

          <!-- ── Menu grid ── -->
          <div class="menu-grid" *ngIf="!loading() && filteredItems().length > 0">
            <div
              class="menu-card"
              *ngFor="let item of filteredItems(); trackBy: trackById"
              [class.card-recommended]="isRecommended(item)">

              <!-- AI / Chef's pick badge -->
              <div class="chefs-badge" *ngIf="isRecommended(item)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Chef's Pick
              </div>

              <!-- Image -->
              <div class="card-media">
                <img
                  [src]="item.imageUrl"
                  [alt]="item.name"
                  (error)="handleImageError($event)"
                  class="card-img"
                />
                <div class="card-img-overlay"></div>

                <!-- Category pill on image -->
                <span class="cat-pill"
                  [class.pill-veg]="item.category === 'veg'"
                  [class.pill-nonveg]="item.category === 'non-veg'"
                  [class.pill-drink]="item.category === 'drinks'">
                  <span class="pill-dot"></span>
                  {{ item.category === 'non-veg' ? 'Non-Veg' : item.category === 'veg' ? 'Veg' : 'Drink' }}
                </span>

                <!-- Availability indicator -->
                <span class="unavail-badge" *ngIf="!item.isAvailable">
                  Unavailable
                </span>
              </div>

              <!-- Card body -->
              <div class="card-body">
                <!-- Name + rating -->
                <div class="card-top">
                  <h3 class="card-name">{{ item.name }}</h3>

                  <div class="card-rating">
                    <ng-container *ngIf="item.averageRating && item.averageRating > 0; else noRating">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#ffd700"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span class="rating-num">{{ item.averageRating | number:'1.1-1' }}</span>
                      <span class="rating-ct">({{ item.totalReviews || 0 }})</span>
                    </ng-container>
                    <ng-template #noRating>
                      <span class="new-pill">NEW</span>
                    </ng-template>
                  </div>
                </div>

                <!-- Subcategory -->
                <p class="card-sub">{{ item.subCategory | titlecase }}</p>

                <!-- ── SINGLE pricing ── -->
                <div class="pricing-row" *ngIf="item.pricing.type === 'SINGLE'">
                  <span class="card-price">₹{{ item.pricing.price }}</span>
                  <button
                    class="add-btn"
                    [class.add-btn-added]="addedItems().has(item._id + '-SINGLE')"
                    [disabled]="!item.isAvailable"
                    (click)="addToCart(item, 'SINGLE')">
                    <ng-container *ngIf="addedItems().has(item._id + '-SINGLE')">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      Added
                    </ng-container>
                    <ng-container *ngIf="!addedItems().has(item._id + '-SINGLE')">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                      Add
                    </ng-container>
                  </button>
                </div>

                <!-- ── HALF/FULL pricing ── -->
                <div class="variant-row" *ngIf="item.pricing.type === 'HALF_FULL'">
                  <button
                    class="variant-btn"
                    [class.variant-added]="addedItems().has(item._id + '-HALF')"
                    [disabled]="!item.isAvailable"
                    (click)="addToCart(item, 'HALF')">
                    <div class="vb-top">
                      <span class="vb-label">Half</span>
                      <ng-container *ngIf="addedItems().has(item._id + '-HALF')">
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </ng-container>
                    </div>
                    <span class="vb-price">₹{{ item.pricing.priceHalf }}</span>
                  </button>
                  <button
                    class="variant-btn"
                    [class.variant-added]="addedItems().has(item._id + '-FULL')"
                    [disabled]="!item.isAvailable"
                    (click)="addToCart(item, 'FULL')">
                    <div class="vb-top">
                      <span class="vb-label">Full</span>
                      <ng-container *ngIf="addedItems().has(item._id + '-FULL')">
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </ng-container>
                    </div>
                    <span class="vb-price">₹{{ item.pricing.priceFull }}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

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
      --green-dim:   rgba(34,197,94,0.12);
      --red:         #ef4444;
      --cyan:        #06b6d4;
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
    .menu-page {
      position: relative;
      min-height: 100vh;
      background: var(--surface);
      color: var(--text);
      overflow-x: hidden;
      padding-bottom: 100px;
    }

    .menu-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .mb-blob {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.08;
      animation: blobDrift 12s ease-in-out infinite alternate;
    }
    .blob-1 { width: 600px; height: 600px; background: var(--orange); top: -200px; right: -120px; }
    .blob-2 { width: 400px; height: 400px; background: #c73e00; top: 40%; left: -100px; animation-delay: -6s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(24px,20px) scale(1.06); }
    }
    .mb-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════ */
    .menu-header {
      position: relative; z-index: 1;
      padding: 120px 28px 60px;
      max-width: 1400px; margin: 0 auto;
      animation: fadeUp 0.6s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(22px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .mh-inner {
      display: flex; justify-content: space-between;
      align-items: flex-end; gap: 40px; flex-wrap: wrap;
    }

    /* Eyebrow */
    .mh-eyebrow {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--orange); margin: 0 0 12px;
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

    .mh-title {
      font-size: clamp(2.8rem, 5vw, 4.5rem);
      font-weight: 900; letter-spacing: -0.04em;
      margin: 0 0 14px; line-height: 1;
    }
    .accent { color: var(--orange); }
    .mh-sub {
      color: var(--text-muted); font-size: 1rem;
      line-height: 1.65; max-width: 440px; margin: 0;
    }

    /* Search */
    .search-wrap {
      flex: 0 0 420px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .search-box {
      position: relative;
      display: flex; align-items: center;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 0 14px;
      transition: border-color 0.22s, box-shadow 0.22s, background 0.22s;
    }
    .search-box.search-focused {
      border-color: rgba(255,102,0,0.45);
      background: var(--surface-3);
      box-shadow: 0 0 0 3px rgba(255,102,0,0.08);
    }
    .search-ico { color: var(--text-dim); flex-shrink: 0; }
    .search-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text); font-size: 0.9rem;
      padding: 14px 10px;
      font-family: inherit;
    }
    .search-input::placeholder { color: var(--text-dim); }
    .search-clear {
      background: none; border: none;
      color: var(--text-muted); cursor: pointer;
      padding: 4px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.15s, background 0.15s;
    }
    .search-clear:hover { color: var(--text); background: rgba(255,255,255,0.05); }

    .result-count {
      font-size: 0.72rem; color: var(--text-muted);
      margin: 0; font-weight: 600; text-align: right;
    }
    .rc-num { color: var(--orange); font-weight: 900; font-size: 0.85rem; }

    /* ═══════════════════════════════════════════
       CATEGORY NAV
    ═══════════════════════════════════════════ */
    .cat-nav {
      position: sticky;
      top: 0; z-index: 200;
      background: rgba(13,13,13,0.9);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-bottom: 1px solid var(--border);
      padding: 14px 0;
    }
    .cat-inner {
      max-width: 1400px; margin: 0 auto; padding: 0 28px;
    }
    .cat-chips {
      display: flex; gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 2px;
    }
    .cat-chips::-webkit-scrollbar { display: none; }

    .cat-chip {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 18px;
      border-radius: 40px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.78rem; font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.2s;
      flex-shrink: 0;
    }
    .cat-chip:hover {
      color: var(--text);
      border-color: var(--border-h);
      transform: translateY(-1px);
    }
    .chip-active {
      background: var(--orange) !important;
      border-color: var(--orange) !important;
      color: #fff !important;
      box-shadow: 0 4px 16px var(--orange-glow);
    }
    .chip-special {
      border-color: rgba(255,102,0,0.35);
      color: var(--orange);
    }

    /* Chip dots */
    .chip-ai-dot {
      display: inline-block;
      width: 7px; height: 7px; border-radius: 50%;
      background: currentColor;
      animation: aiPulse 2s ease-in-out infinite;
    }
    @keyframes aiPulse {
      0%,100% { opacity:1; }
      50%      { opacity:0.4; }
    }
    .chip-pip { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
    .pip-veg    { background: var(--green); }
    .pip-nonveg { background: var(--red); }
    .pip-drink  { background: var(--cyan); }

    .chip-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 18px;
      background: rgba(255,255,255,0.06);
      border-radius: 10px;
      font-size: 0.62rem; font-weight: 800;
      padding: 0 5px;
      transition: background 0.2s;
    }
    .chip-active .chip-count { background: rgba(255,255,255,0.2); }

    /* ═══════════════════════════════════════════
       MAIN CONTENT
    ═══════════════════════════════════════════ */
    .menu-main {
      position: relative; z-index: 1;
      padding-top: 48px;
    }
    .menu-container {
      max-width: 1400px; margin: 0 auto; padding: 0 28px;
    }

    /* ── Skeleton ── */
    .skeleton-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 22px;
      overflow: hidden;
      animation: shimmer 1.6s ease-in-out infinite alternate;
    }
    @keyframes shimmer {
      from { opacity:0.6; }
      to   { opacity:1; }
    }
    .sk-img {
      height: 210px;
      background: var(--surface-3);
    }
    .sk-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .sk-line {
      height: 14px; background: var(--surface-3); border-radius: 6px;
    }
    .sk-long  { width: 75%; }
    .sk-mid   { width: 55%; }
    .sk-short { width: 35%; }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 50vh; gap: 16px; text-align: center;
      animation: fadeUp 0.4s ease both;
    }
    .empty-icon-wrap {
      width: 72px; height: 72px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-dim); margin-bottom: 8px;
    }
    .empty-title { font-size: 1.5rem; font-weight: 900; margin: 0; }
    .empty-sub   { color: var(--text-muted); font-size: 0.9rem; margin: 0; max-width: 360px; line-height: 1.6; }
    .btn-reset {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 11px 22px; border-radius: 10px;
      font-weight: 700; font-size: 0.82rem;
      cursor: pointer; margin-top: 8px;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .btn-reset:hover { color: var(--text); border-color: var(--border-h); background: var(--surface-3); }

    /* ════════════════════════════════════════
       MENU GRID
    ════════════════════════════════════════ */
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 22px;
    }

    /* ════════════════════════════════════════
       MENU CARD
    ════════════════════════════════════════ */
    .menu-card {
      position: relative;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 22px;
      overflow: hidden;
      display: flex; flex-direction: column;
      transition: border-color 0.28s, transform 0.28s, box-shadow 0.28s;
      animation: fadeUp 0.5s ease both;
    }
    .menu-card:hover {
      transform: translateY(-6px);
      border-color: var(--border-h);
      box-shadow: 0 20px 55px rgba(0,0,0,0.45);
    }
    .card-recommended {
      border-color: rgba(255,102,0,0.35) !important;
      box-shadow: 0 0 0 1px rgba(255,102,0,0.12);
    }
    .card-recommended:hover {
      border-color: rgba(255,102,0,0.6) !important;
      box-shadow: 0 20px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,102,0,0.2);
    }

    /* Chef's pick badge */
    .chefs-badge {
      position: absolute; top: 14px; right: 14px; z-index: 5;
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--orange);
      color: #fff;
      font-size: 0.6rem; font-weight: 900;
      letter-spacing: 0.08em; text-transform: uppercase;
      padding: 5px 10px; border-radius: 8px;
      box-shadow: 0 4px 16px var(--orange-glow);
    }

    /* Image area */
    .card-media {
      position: relative;
      height: 210px; overflow: hidden;
    }
    .card-img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: transform 0.45s ease;
    }
    .menu-card:hover .card-img { transform: scale(1.07); }
    .card-img-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(13,13,13,0.55) 0%, transparent 55%);
    }

    /* Category pill */
    .cat-pill {
      position: absolute; bottom: 12px; left: 14px;
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(8px);
      color: #fff;
      font-size: 0.6rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 5px 10px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .pill-dot {
      width: 6px; height: 6px; border-radius: 50%;
    }
    .pill-veg    .pill-dot { background: var(--green); }
    .pill-nonveg .pill-dot { background: var(--red); }
    .pill-drink  .pill-dot { background: var(--cyan); }

    /* Unavailable badge */
    .unavail-badge {
      position: absolute; top: 14px; left: 14px; z-index: 5;
      background: rgba(0,0,0,0.7);
      color: var(--text-muted);
      font-size: 0.6rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 4px 10px; border-radius: 7px;
      border: 1px solid var(--border);
    }

    /* Card body */
    .card-body {
      padding: 18px 18px 20px;
      flex: 1; display: flex; flex-direction: column; gap: 6px;
    }
    .card-top {
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 8px;
      margin-bottom: 4px;
    }
    .card-name {
      font-size: 1.05rem; font-weight: 800;
      margin: 0; line-height: 1.3; color: var(--text);
      flex: 1;
    }

    /* Rating */
    .card-rating {
      display: flex; align-items: center; gap: 4px;
      flex-shrink: 0;
    }
    .rating-num { font-weight: 800; font-size: 0.82rem; color: var(--text); }
    .rating-ct  { font-size: 0.7rem; color: var(--text-muted); }
    .new-pill {
      font-size: 0.58rem; font-weight: 800;
      background: var(--orange-dim);
      color: var(--orange);
      padding: 2px 8px; border-radius: 5px;
      border: 1px solid rgba(255,102,0,0.18);
    }

    .card-sub {
      font-size: 0.75rem; color: var(--text-muted);
      font-weight: 600; margin: 0 0 10px;
    }

    /* ── Single price row ── */
    .pricing-row {
      display: flex; align-items: center;
      justify-content: space-between; gap: 10px;
      margin-top: auto;
    }
    .card-price {
      font-size: 1.6rem; font-weight: 900;
      color: var(--orange); letter-spacing: -0.03em; line-height: 1;
    }

    .add-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--orange-dim);
      color: var(--orange);
      border: 1px solid rgba(255,102,0,0.22);
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 800; font-size: 0.82rem;
      cursor: pointer;
      transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
      white-space: nowrap;
    }
    .add-btn:hover:not([disabled]) {
      background: var(--orange); color: #fff;
      border-color: var(--orange);
      transform: scale(1.04);
      box-shadow: 0 4px 16px var(--orange-glow);
    }
    .add-btn-added {
      background: var(--green-dim) !important;
      color: var(--green) !important;
      border-color: rgba(34,197,94,0.28) !important;
    }
    .add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* ── Half/Full variant row ── */
    .variant-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      margin-top: auto;
    }
    .variant-btn {
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 12px 14px;
      cursor: pointer; text-align: left;
      display: flex; flex-direction: column; gap: 4px;
      transition: border-color 0.2s, background 0.2s, transform 0.2s;
    }
    .variant-btn:hover:not([disabled]) {
      border-color: rgba(255,102,0,0.4);
      background: var(--orange-dim);
      transform: translateY(-2px);
    }
    .variant-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .variant-added {
      border-color: rgba(34,197,94,0.35) !important;
      background: var(--green-dim) !important;
    }
    .vb-top {
      display: flex; align-items: center; justify-content: space-between;
    }
    .vb-label {
      font-size: 0.62rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    .variant-added .vb-label { color: var(--green); }
    .vb-price {
      font-size: 1.15rem; font-weight: 900;
      color: var(--orange); letter-spacing: -0.02em;
    }
    .variant-added .vb-price { color: var(--green); }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 900px) {
      .mh-inner { flex-direction: column; align-items: flex-start; }
      .search-wrap { flex: 0 0 100%; width: 100%; }
    }
    @media (max-width: 600px) {
      .menu-header { padding: 96px 20px 48px; }
      .menu-container { padding: 0 16px; }
      .cat-inner { padding: 0 16px; }
      .menu-grid { grid-template-columns: 1fr; }
      .mh-title { font-size: 2.6rem; }
    }
  `],
})
export class MenuComponent implements OnInit {
  menuService = inject(MenuService);
  cartService = inject(CartService);
  authService = inject(AuthService);
  // BUG FIX: inject ToastService for cart feedback
  private toast = inject(ToastService, { optional: true } as any);

  private fullMenuList    = signal<MenuItem[]>([]);
  private recommendedIds  = signal<Set<string>>(new Set());

  filteredItems    = signal<MenuItem[]>([]);
  selectedCategory = signal<string>('All');
  loading          = signal<boolean>(true);
  addedItems       = signal<Set<string>>(new Set());

  searchQuery   = '';
  searchFocused = false;

  // BUG FIX: expose skeletons array for *ngFor (can't use literals in template)
  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly categories = [
    { label: 'All',     value: 'All' },
    { label: 'Veg',     value: 'veg' },
    { label: 'Non-Veg', value: 'non-veg' },
    { label: 'Drinks',  value: 'drinks' },
  ];

  activeCategories = computed(() => {
    if (this.recommendedIds().size > 0) {
      return [{ label: '✦ For You', value: 'Recommended' }, ...this.categories];
    }
    return this.categories;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // BUG FIX: was `getMenu()` — correct method is `getMenuItems()`
    this.menuService.getMenuItems().subscribe({
      next: (items: MenuItem[]) => {
        this.fullMenuList.set(items);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Menu load error:', err);
        this.loading.set(false);
      },
    });

    // Load AI recommendations for all users (service sends userId via body internally)
    this.menuService.getAiRecommendations().subscribe({
      next: (items: MenuItem[]) => {
        const ids = new Set<string>(items.map(i => i._id).filter((id): id is string => !!id));
        this.recommendedIds.set(ids);
        // Auto-select "For You" tab only for logged-in users
        if (ids.size > 0 && this.authService.isLoggedIn()) {
          this.selectedCategory.set('Recommended');
          this.applyFilters();
        }
      },
      error: () => console.warn('AI recommendations unavailable.'),
    });
  }

  isRecommended(item: MenuItem): boolean {
    return !!item._id && this.recommendedIds().has(item._id);
  }

  // BUG FIX: returns count per category for the chip badges
  getCategoryCount(cat: string): number {
    if (cat === 'All') return this.fullMenuList().length;
    return this.fullMenuList().filter(i => i.category === cat).length;
  }

  filterByCategory(cat: string) {
    this.selectedCategory.set(cat);
    this.applyFilters();
  }

  applyFilters() {
    let items: MenuItem[] = [];

    if (this.selectedCategory() === 'Recommended') {
      // Show recommended items from the full list (preserves isAvailable etc.)
      items = this.fullMenuList().filter(i => !!i._id && this.recommendedIds().has(i._id));
    } else if (this.selectedCategory() === 'All') {
      items = this.fullMenuList();
    } else {
      items = this.fullMenuList().filter(i => i.category === this.selectedCategory());
    }

    // Search filter — covers name AND subCategory
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        i => i.name.toLowerCase().includes(q) ||
             i.subCategory.toLowerCase().includes(q) ||
             i.category.toLowerCase().includes(q)
      );
    }

    this.filteredItems.set(items);
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory.set('All');
    this.applyFilters();
  }

  addToCart(item: MenuItem, variant: 'SINGLE' | 'HALF' | 'FULL') {
    if (!item.isAvailable) return;

    this.cartService.addToCart(item, variant);

    // Toast feedback
    if (this.toast) {
      this.toast.show(`${item.name} added to cart!`, 'success');
    }

    // UI tick feedback — auto-reset after 2s
    const key = `${item._id}-${variant}`;
    this.addedItems.update(prev => new Set(prev).add(key));
    setTimeout(() => {
      this.addedItems.update(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  }

  // BUG FIX: trackBy for ngFor performance (avoids full list re-render on filter change)
  trackById(_: number, item: MenuItem): string {
    return item._id ?? '';
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/111111/333333?text=Killa+Kitchen';
  }
}