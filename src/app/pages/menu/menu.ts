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
              <span class="search-icon">🔍</span>
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
        <!-- Skeleton Loading State -->
        <div *ngIf="loading()" class="grid">
          <div class="skeleton-card" *ngFor="let i of [1, 2, 3, 4, 5, 6]">
            <div class="s-img"></div>
            <div class="s-line long"></div>
            <div class="s-line short"></div>
          </div>
        </div>

        <!-- Loaded Content -->
        <div *ngIf="!loading()" class="grid">
          <div
            class="food-item"
            *ngFor="let item of filteredItems()"
            [class.recommended-border]="isRecommended(item)"
          >
            <!-- NEW: AI PICK Badge for Recommended Items -->
            <div class="ai-pick-badge" *ngIf="isRecommended(item)">
              <span class="sparkle">✨</span> CHEF'S PICK
            </div>

            <div class="media">
              <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" />
              <div class="category-pill" [ngClass]="item.category">
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
                <div class="menu-rating">
                  <span
                    class="star-icon"
                    [class.active-star]="item.averageRating && item.averageRating > 0"
                    >★</span
                  >
                  <ng-container *ngIf="item.averageRating && item.averageRating > 0; else noRating">
                    <span class="rating-val">{{ item.averageRating | number: '1.1-1' }}</span>
                    <span class="review-count">({{ item.totalReviews || 0 }})</span>
                  </ng-container>
                  <ng-template #noRating>
                    <span class="new-tag">New</span>
                  </ng-template>
                </div>
                <p class="subtitle capitalize">{{ item.subCategory }}</p>
              </div>

              <div class="pricing-actions">
                <!-- Single Price Template -->
                <div *ngIf="item.pricing.type === 'SINGLE'" class="single-price">
                  <span class="price">₹{{ item.pricing.price }}</span>
                  <button
                    (click)="addToCart(item, 'SINGLE')"
                    class="add-main"
                    [class.added]="addedItems().has(item._id + '-SINGLE')"
                  >
                    {{ addedItems().has(item._id + '-SINGLE') ? '✓ Added' : 'Add to Cart' }}
                  </button>
                </div>

                <!-- Variant Price Template -->
                <div *ngIf="item.pricing.type === 'HALF_FULL'" class="multi-price">
                  <button
                    (click)="addToCart(item, 'HALF')"
                    class="variant-btn"
                    [class.added]="addedItems().has(item._id + '-HALF')"
                  >
                    <span class="v-name">{{
                      addedItems().has(item._id + '-HALF') ? '✓' : 'Half'
                    }}</span>
                    <span class="v-price">₹{{ item.pricing.priceHalf }}</span>
                  </button>
                  <button
                    (click)="addToCart(item, 'FULL')"
                    class="variant-btn"
                    [class.added]="addedItems().has(item._id + '-FULL')"
                  >
                    <span class="v-name">{{
                      addedItems().has(item._id + '-FULL') ? '✓' : 'Full'
                    }}</span>
                    <span class="v-price">₹{{ item.pricing.priceFull }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && filteredItems().length === 0" class="empty-results">
          <div class="empty-icon">🍳</div>
          <h2>Nothing found</h2>
          <p>We couldn't find anything matching your search. Try different filters.</p>
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

      /* Header Section */
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
        letter-spacing: -2px;
      }
      .title-group p {
        color: #666;
        margin-top: 10px;
        font-size: 1.1rem;
      }

      .search-bar {
        position: relative;
        flex-grow: 1;
        max-width: 450px;
      }
      .search-icon {
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.4;
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
        box-shadow: 0 0 20px rgba(255, 102, 0, 0.1);
      }

      /* Category Sticky Nav */
      .category-sticky {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(10, 10, 10, 0.85);
        backdrop-filter: blur(20px);
        padding: 15px 0;
        border-bottom: 1px solid #222;
      }
      .chips-container {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 5px;
        scrollbar-width: none;
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
        box-shadow: 0 0 10px #ff6600;
      }

      /* Grid and Cards */
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
        transition: 0.4s;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      .food-item:hover {
        transform: translateY(-10px);
        border-color: #444;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      }
      .recommended-border {
        border: 2px solid #ff6600 !important;
      }

      /* AI Badge */
      .ai-pick-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        background: #ff6600;
        color: #fff;
        font-size: 0.65rem;
        font-weight: 900;
        padding: 5px 12px;
        border-radius: 10px;
        z-index: 10;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4);
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
        transition: 0.8s;
      }
      .food-item:hover .media img {
        transform: scale(1.1);
      }
      .category-pill {
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        color: white;
        padding: 6px 14px;
        border-radius: 12px;
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .info {
        padding: 25px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .meta h3 {
        font-size: 1.5rem;
        margin: 0;
        font-weight: 800;
        line-height: 1.2;
      }

      .menu-rating {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .star-icon {
        color: #333;
        font-size: 1.1rem;
      }
      .active-star {
        color: #ffcc00 !important;
      }
      .rating-val {
        color: #fff;
        font-weight: 800;
        font-size: 0.9rem;
      }
      .review-count {
        color: #555;
        font-size: 0.75rem;
      }
      .new-tag {
        color: #ff6600;
        font-size: 0.7rem;
        font-weight: 900;
        background: rgba(255, 102, 0, 0.1);
        padding: 2px 8px;
        border-radius: 6px;
      }
      .subtitle {
        color: #666;
        font-size: 0.9rem;
        margin: 8px 0 25px;
        font-weight: 500;
        text-transform: capitalize;
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
        padding: 12px 28px;
        border-radius: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.3s;
      }
      .add-main.added {
        background: #00ff88;
        color: #000;
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
        border-radius: 18px;
        cursor: pointer;
        text-align: left;
        transition: 0.3s;
      }
      .variant-btn .v-name {
        display: block;
        font-size: 0.75rem;
        color: #666;
        font-weight: 800;
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
        transform: translateY(-2px);
      }
      .variant-btn.added {
        border-color: #00ff88;
        background: rgba(0, 255, 136, 0.05);
      }
      .variant-btn.added .v-name {
        color: #00ff88;
      }

      /* Skeleton Loading State */
      .skeleton-card {
        background: #161616;
        height: 400px;
        border-radius: 28px;
        padding: 20px;
        position: relative;
        overflow: hidden;
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

  // Track recently added items for UI feedback
  addedItems = signal<Set<string>>(new Set());

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
      next: (items: MenuItem[]) => {
        this.fullMenuList.set(items);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Menu load error:', err);
        this.loading.set(false);
      },
    });

    if (this.authService.isLoggedIn()) {
      this.menuService.getAiRecommendations().subscribe({
        next: (items: MenuItem[]) => {
          this.recommendedItems.set(items);
          if (items.length > 0) {
            this.selectedCategory.set('Recommended');
            this.applyFilters();
          }
        },
        error: () => console.warn('AI recommendations unavailable.'),
      });
    }
  }

  isRecommended(item: MenuItem): boolean {
    return this.recommendedItems().some((rec) => rec._id === item._id);
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
        (i) => i.name.toLowerCase().includes(q) || i.subCategory.toLowerCase().includes(q),
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

    // UI Feedback logic
    const key = `${item._id}-${variant}`;
    this.addedItems.update((prev) => new Set(prev).add(key));
    setTimeout(() => {
      this.addedItems.update((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}
