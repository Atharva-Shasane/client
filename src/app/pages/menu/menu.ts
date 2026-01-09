import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu';
import { CartService } from '../../services/cart';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="menu-wrapper">
      <!-- Search & Header Section -->
      <header class="page-header">
        <div class="header-content">
          <h1>Taste the <span class="highlight">Difference</span></h1>
          <p>Discover our chef's special creations and seasonal favorites.</p>

          <div class="search-container">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
              placeholder="Search for your favorite dish..."
            />
            <span class="search-icon">🔍</span>
          </div>
        </div>
      </header>

      <!-- Category Navigation -->
      <nav class="category-nav">
        <div class="nav-scroll">
          <button
            *ngFor="let cat of categories"
            (click)="filterByCategory(cat.value)"
            [class.active]="selectedCategory() === cat.value"
          >
            {{ cat.label }}
          </button>
        </div>
      </nav>

      <main class="menu-container">
        <!-- Skeleton Loading View -->
        <div *ngIf="loading()" class="grid-layout">
          <div class="skeleton-item" *ngFor="let i of [1, 2, 3, 4, 5, 6]">
            <div class="skeleton-media"></div>
            <div class="skeleton-info">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line desc"></div>
              <div class="skeleton-footer">
                <div class="skeleton-price"></div>
                <div class="skeleton-action"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Real Menu Content -->
        <div *ngIf="!loading()" class="grid-layout">
          <div class="food-card" *ngFor="let item of filteredItems()">
            <div class="card-media">
              <img [src]="item.imageUrl" (error)="handleImageError($event)" [alt]="item.name" />
              <div class="badge" [class.veg]="item.category.includes('veg')">
                {{ item.category.includes('non-veg') ? 'Non-Veg' : 'Veg' }}
              </div>
            </div>

            <div class="card-info">
              <div class="card-header">
                <h3>{{ item.name }}</h3>
                <span class="sub-cat">{{ item.subCategory }}</span>
              </div>

              <div class="card-actions">
                <!-- Single Price Flow -->
                <div *ngIf="item.pricing.type === 'SINGLE'" class="action-row single">
                  <span class="price-tag">₹{{ item.pricing.price }}</span>
                  <button (click)="addToCart(item, 'SINGLE')" class="btn-primary">Add</button>
                </div>

                <!-- Multi Variant Flow -->
                <div *ngIf="item.pricing.type === 'HALF_FULL'" class="action-row multi">
                  <button (click)="addToCart(item, 'HALF')" class="btn-variant">
                    <span class="label">Half</span>
                    <span class="val">₹{{ item.pricing.priceHalf }}</span>
                  </button>
                  <button (click)="addToCart(item, 'FULL')" class="btn-variant">
                    <span class="label">Full</span>
                    <span class="val">₹{{ item.pricing.priceFull }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && filteredItems().length === 0" class="empty-state">
          <div class="icon">🍽️</div>
          <h3>No matches found</h3>
          <p>Try searching for something else or browse another category.</p>
          <button (click)="resetFilters()" class="btn-link">Clear all filters</button>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        --brand: #ff6b00;
        --dark: #121212;
        --card-bg: #1e1e1e;
        --text-p: #ffffff;
        --text-s: #a0a0a0;
      }

      .menu-wrapper {
        background: var(--dark);
        min-height: 100vh;
        color: var(--text-p);
        padding-bottom: 80px;
      }

      /* Header & Search */
      .page-header {
        background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(18, 18, 18, 1)),
          url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070')
            center/cover;
        padding: 100px 20px 60px;
        text-align: center;
      }
      .header-content {
        max-width: 800px;
        margin: 0 auto;
      }
      h1 {
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 800;
        letter-spacing: -1px;
        line-height: 1.1;
        margin-bottom: 15px;
      }
      .highlight {
        color: var(--brand);
      }
      .page-header p {
        font-size: 1.1rem;
        color: var(--text-s);
        margin-bottom: 40px;
      }

      .search-container {
        position: relative;
        max-width: 500px;
        margin: 0 auto;
      }
      .search-container input {
        width: 100%;
        padding: 16px 50px 16px 25px;
        border-radius: 50px;
        border: 1px solid #333;
        background: rgba(255, 255, 255, 0.05);
        color: white;
        font-size: 1rem;
        backdrop-filter: blur(10px);
        transition: 0.3s;
      }
      .search-container input:focus {
        outline: none;
        border-color: var(--brand);
        background: rgba(255, 255, 255, 0.1);
      }
      .search-icon {
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.2rem;
        opacity: 0.5;
      }

      /* Category Navigation */
      .category-nav {
        position: sticky;
        top: 80px;
        z-index: 100;
        background: rgba(18, 18, 18, 0.9);
        backdrop-filter: blur(10px);
        padding: 15px 0;
        border-bottom: 1px solid #222;
      }
      .nav-scroll {
        display: flex;
        justify-content: center;
        gap: 10px;
        overflow-x: auto;
        padding: 0 20px;
      }
      .nav-scroll::-webkit-scrollbar {
        display: none;
      }
      .category-nav button {
        padding: 8px 20px;
        border-radius: 30px;
        border: 1px solid #333;
        background: transparent;
        color: var(--text-s);
        cursor: pointer;
        white-space: nowrap;
        font-weight: 600;
        transition: 0.3s;
      }
      .category-nav button.active {
        background: var(--brand);
        color: white;
        border-color: var(--brand);
      }

      /* Layout */
      .menu-container {
        max-width: 1400px;
        margin: 40px auto;
        padding: 0 20px;
      }
      .grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 30px;
      }

      /* Food Card */
      .food-card {
        background: var(--card-bg);
        border-radius: 24px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: 0.4s cubic-bezier(0.2, 0, 0, 1);
        border: 1px solid #2a2a2a;
      }
      .food-card:hover {
        transform: translateY(-10px);
        border-color: #444;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      }

      .card-media {
        height: 220px;
        position: relative;
        overflow: hidden;
      }
      .card-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: 0.8s;
      }
      .food-card:hover .card-media img {
        transform: scale(1.1);
      }
      .badge {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        background: #ff4444;
        color: white;
      }
      .badge.veg {
        background: #00c851;
      }

      .card-info {
        padding: 20px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .card-header h3 {
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 5px;
      }
      .sub-cat {
        color: var(--text-s);
        font-size: 0.85rem;
        display: block;
        margin-bottom: 20px;
      }

      .card-actions {
        margin-top: auto;
      }
      .action-row.single {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .price-tag {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--brand);
      }
      .btn-primary {
        background: var(--brand);
        color: white;
        border: none;
        padding: 12px 28px;
        border-radius: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-primary:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
      }

      .action-row.multi {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .btn-variant {
        background: #2a2a2a;
        border: 1px solid #333;
        padding: 10px;
        border-radius: 14px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 2px;
        color: var(--text-s);
        transition: 0.3s;
      }
      .btn-variant .val {
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--brand);
      }
      .btn-variant:hover {
        background: #333;
        border-color: var(--brand);
      }

      /* Skeleton Loading */
      .skeleton-item {
        background: var(--card-bg);
        border-radius: 24px;
        overflow: hidden;
        height: 420px;
        position: relative;
      }
      .skeleton-media {
        height: 220px;
        background: #2a2a2a;
      }
      .skeleton-info {
        padding: 20px;
      }
      .skeleton-line {
        background: #2a2a2a;
        border-radius: 4px;
        margin-bottom: 10px;
        position: relative;
        overflow: hidden;
      }
      .skeleton-line::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
        animation: shm 1.5s infinite;
      }
      .skeleton-line.title {
        height: 24px;
        width: 60%;
      }
      .skeleton-line.desc {
        height: 16px;
        width: 40%;
        margin-bottom: 40px;
      }
      .skeleton-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .skeleton-price {
        height: 30px;
        width: 30%;
        background: #2a2a2a;
        border-radius: 4px;
      }
      .skeleton-action {
        height: 45px;
        width: 40%;
        background: #2a2a2a;
        border-radius: 12px;
      }

      @keyframes shm {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      .empty-state {
        text-align: center;
        padding: 100px 20px;
      }
      .empty-state .icon {
        font-size: 4rem;
        margin-bottom: 20px;
      }
      .btn-link {
        background: none;
        border: none;
        color: var(--brand);
        text-decoration: underline;
        cursor: pointer;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .grid-layout {
          grid-template-columns: 1fr;
        }
        .page-header {
          padding-top: 120px;
        }
        h1 {
          font-size: 2.8rem;
        }
      }
    `,
  ],
})
export class MenuComponent implements OnInit {
  menuService = inject(MenuService);
  cartService = inject(CartService);

  private fullMenuList = signal<MenuItem[]>([]);
  filteredItems = signal<MenuItem[]>([]);
  selectedCategory = signal<string>('All');
  loading = signal<boolean>(true);
  searchQuery = '';

  categories = [
    { label: 'All Dishes', value: 'All' },
    { label: 'Veg Indian', value: 'veg-indian' },
    { label: 'Non-Veg', value: 'non-veg-indian' },
    { label: 'Beverages', value: 'beverages' },
  ];

  ngOnInit() {
    this.menuService.getMenu().subscribe({
      next: (items) => {
        // Reduced wait time for production feel
        setTimeout(() => {
          this.fullMenuList.set(items);
          this.applyFilters();
          this.loading.set(false);
        }, 600);
      },
      error: () => this.loading.set(false),
    });
  }

  filterByCategory(cat: string) {
    this.selectedCategory.set(cat);
    this.applyFilters();
  }

  applyFilters() {
    let items = this.fullMenuList();

    // Apply Category Filter
    if (this.selectedCategory() !== 'All') {
      items = items.filter((i) => i.category === this.selectedCategory());
    }

    // Apply Search Filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.subCategory.toLowerCase().includes(q)
      );
    }

    this.filteredItems.set(items);
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory.set('All');
    this.applyFilters();
  }

  addToCart(item: MenuItem, variant: 'SINGLE' | 'HALF' | 'FULL') {
    this.cartService.addToCart(item, variant);
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Delicious+Food';
  }
}
