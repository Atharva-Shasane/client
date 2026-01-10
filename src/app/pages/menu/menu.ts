import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="menu-wrapper">
      <header class="menu-header">
        <div class="container">
          <div class="header-inner">
            <div class="title-group">
              <h1>The <span class="highlight">Collection</span></h1>
              <p>Curated flavors from our legendary kitchen.</p>
            </div>
            <div class="search-bar">
              <span class="icon">🔍</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="applyFilters()"
                placeholder="Search by name or category..."
              />
            </div>
          </div>
        </div>
      </header>

      <nav class="category-sticky">
        <div class="container">
          <div class="chips-container">
            <button
              *ngFor="let cat of activeCategories()"
              (click)="filterByCategory(cat.value)"
              [class.active]="selectedCategory() === cat.value"
              [class.special]="cat.value === 'Recommended'"
            >
              <span class="dot" *ngIf="cat.value === 'Recommended'"></span>
              {{ cat.label }}
            </button>
          </div>
        </div>
      </nav>

      <main class="menu-content container">
        <div *ngIf="loading()" class="grid">
          <div class="skeleton-card" *ngFor="let i of [1, 2, 3, 4, 5, 6]">
            <div class="s-img"></div>
            <div class="s-line long"></div>
            <div class="s-line short"></div>
          </div>
        </div>

        <div *ngIf="!loading()" class="grid">
          <div
            class="food-item"
            *ngFor="let item of filteredItems()"
            [class.recommended-border]="selectedCategory() === 'Recommended'"
          >
            <div class="media">
              <img [src]="item.imageUrl" (error)="handleImageError($event)" [alt]="item.name" />
              <div class="category-pill">
                {{
                  item.category === 'non-veg'
                    ? 'Non-Veg'
                    : item.category === 'veg'
                    ? 'Veg'
                    : 'Drink'
                }}
              </div>
            </div>

            <div class="info">
              <div class="meta">
                <h3>{{ item.name }}</h3>
                <p class="subtitle">{{ item.subCategory }}</p>
              </div>

              <div class="pricing-actions">
                <div *ngIf="item.pricing.type === 'SINGLE'" class="single-price">
                  <span class="price">₹{{ item.pricing.price }}</span>
                  <button (click)="addToCart(item, 'SINGLE')" class="add-main">Add to Cart</button>
                </div>

                <div *ngIf="item.pricing.type === 'HALF_FULL'" class="multi-price">
                  <button (click)="addToCart(item, 'HALF')" class="variant-btn">
                    <span class="v-name">Half</span>
                    <span class="v-price">₹{{ item.pricing.priceHalf }}</span>
                  </button>
                  <button (click)="addToCart(item, 'FULL')" class="variant-btn">
                    <span class="v-name">Full</span>
                    <span class="v-price">₹{{ item.pricing.priceFull }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="ai-recommendation-badge" *ngIf="selectedCategory() === 'Recommended'">
              AI Match
            </div>
          </div>
        </div>

        <div *ngIf="!loading() && filteredItems().length === 0" class="empty-results">
          <div class="empty-icon">🍽️</div>
          <h2>Nothing found</h2>
          <p>We couldn't find anything matching your search.</p>
          <button (click)="resetFilters()" class="reset-btn">View All Dishes</button>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .menu-wrapper {
        background: #0a0a0a;
        min-height: 100vh;
        color: white;
        padding-bottom: 100px;
        font-family: 'Poppins', sans-serif;
      }
      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .highlight {
        color: #ff6600;
      }
      .menu-header {
        padding: 120px 0 60px;
        background: linear-gradient(to bottom, #111, #0a0a0a);
      }
      .header-inner {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 40px;
        flex-wrap: wrap;
      }
      .title-group h1 {
        font-size: 3.5rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -1px;
      }
      .title-group p {
        color: #888;
        margin-top: 10px;
        font-size: 1.1rem;
      }
      .search-bar {
        position: relative;
        flex-grow: 1;
        max-width: 450px;
      }
      .search-bar .icon {
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
      }
      .search-bar input {
        width: 100%;
        background: #1a1a1a;
        border: 1px solid #333;
        padding: 16px 16px 16px 50px;
        border-radius: 16px;
        color: white;
        font-size: 1rem;
        transition: 0.3s;
      }
      .search-bar input:focus {
        outline: none;
        border-color: #ff6600;
        background: #222;
      }
      .category-sticky {
        position: sticky;
        top: 80px;
        z-index: 100;
        background: rgba(10, 10, 10, 0.8);
        backdrop-filter: blur(15px);
        padding: 15px 0;
        border-bottom: 1px solid #222;
      }
      .chips-container {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 5px;
      }
      .chips-container::-webkit-scrollbar {
        display: none;
      }
      .chips-container button {
        padding: 10px 24px;
        border-radius: 50px;
        border: 1px solid #333;
        background: transparent;
        color: #888;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: 0.3s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .chips-container button.active {
        background: #ff6600;
        color: white;
        border-color: #ff6600;
      }
      .chips-container button.special {
        border-color: #ff6600;
        color: #ff6600;
      }
      .chips-container button.special.active {
        background: #ff6600;
        color: white;
      }
      .dot {
        width: 8px;
        height: 8px;
        background: #ff6600;
        border-radius: 50%;
      }
      .active .dot {
        background: white;
      }
      .menu-content {
        margin-top: 50px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 32px;
      }
      .food-item {
        background: #161616;
        border-radius: 28px;
        overflow: hidden;
        border: 1px solid #222;
        transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
      }
      .food-item:hover {
        transform: translateY(-10px);
        border-color: #444;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      }
      .recommended-border {
        border: 2px solid #ff6600;
      }
      .media {
        height: 230px;
        position: relative;
        overflow: hidden;
      }
      .media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: 0.6s;
      }
      .food-item:hover .media img {
        transform: scale(1.1);
      }
      .category-pill {
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        color: white;
        padding: 5px 15px;
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
      }
      .info {
        padding: 25px;
      }
      .meta h3 {
        font-size: 1.5rem;
        margin: 0;
        font-weight: 800;
      }
      .subtitle {
        color: #666;
        font-size: 0.9rem;
        margin: 6px 0 25px;
      }
      .pricing-actions {
        margin-top: auto;
      }
      .single-price {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .price {
        font-size: 1.8rem;
        font-weight: 900;
        color: #ff6600;
      }
      .add-main {
        background: #ff6600;
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
      }
      .add-main:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
      }
      .multi-price {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .variant-btn {
        background: #222;
        border: 1px solid #333;
        padding: 12px;
        border-radius: 16px;
        cursor: pointer;
        text-align: left;
        transition: 0.2s;
      }
      .variant-btn .v-name {
        display: block;
        font-size: 0.75rem;
        color: #888;
        font-weight: 600;
        text-transform: uppercase;
      }
      .variant-btn .v-price {
        display: block;
        font-size: 1.2rem;
        font-weight: 800;
        color: #ff6600;
        margin-top: 4px;
      }
      .variant-btn:hover {
        border-color: #ff6600;
        background: #2a2a2a;
      }
      .ai-recommendation-badge {
        position: absolute;
        bottom: 15px;
        right: 20px;
        background: #ff6600;
        color: white;
        font-size: 0.6rem;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 800;
      }
      .empty-results {
        text-align: center;
        padding: 80px 0;
      }
      .empty-icon {
        font-size: 4rem;
        margin-bottom: 20px;
      }
      .reset-btn {
        background: #333;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 20px;
      }
      .skeleton-card {
        background: #161616;
        height: 400px;
        border-radius: 28px;
        padding: 20px;
      }
      .s-img {
        height: 200px;
        background: #222;
        border-radius: 20px;
        margin-bottom: 20px;
      }
      .s-line {
        height: 20px;
        background: #222;
        border-radius: 4px;
        margin-bottom: 10px;
      }
      .s-line.long {
        width: 80%;
      }
      .s-line.short {
        width: 40%;
      }
      @media (max-width: 768px) {
        .menu-header {
          padding-top: 100px;
          text-align: center;
        }
        .header-inner {
          justify-content: center;
        }
        .title-group h1 {
          font-size: 2.8rem;
        }
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MenuComponent implements OnInit {
  menuService = inject(MenuService);
  cartService = inject(CartService);
  authService = inject(AuthService);

  private fullMenuList = signal<MenuItem[]>([]);
  private recommendedItems = signal<MenuItem[]>([]);

  filteredItems = signal<MenuItem[]>([]);
  selectedCategory = signal<string>('All');
  loading = signal<boolean>(true);
  searchQuery = '';

  // UPDATED: Simplified internal mapping to match new DB keys
  categories = [
    { label: 'All', value: 'All' },
    { label: 'Veg', value: 'veg' },
    { label: 'Non-Veg', value: 'non-veg' },
    { label: 'Drinks', value: 'drinks' },
  ];

  activeCategories = computed(() => {
    if (this.recommendedItems().length > 0) {
      return [{ label: 'For You', value: 'Recommended' }, ...this.categories];
    }
    return this.categories;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.menuService.getMenu().subscribe({
      next: (items) => {
        this.fullMenuList.set(items);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    if (this.authService.isLoggedIn()) {
      this.menuService.getAiRecommendations().subscribe({
        next: (items) => {
          this.recommendedItems.set(items);
          if (items.length > 0) {
            this.selectedCategory.set('Recommended');
            this.applyFilters();
          }
        },
        error: () => console.warn('AI recommendations not available.'),
      });
    }
  }

  filterByCategory(cat: string) {
    this.selectedCategory.set(cat);
    this.applyFilters();
  }

  applyFilters() {
    let items: MenuItem[] = [];
    if (this.selectedCategory() === 'Recommended') {
      items = this.recommendedItems();
    } else if (this.selectedCategory() === 'All') {
      items = this.fullMenuList();
    } else {
      items = this.fullMenuList().filter((i) => i.category === this.selectedCategory());
    }

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
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}
