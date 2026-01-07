import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../services/menu';
import { CartService } from '../../services/cart';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-container">
      <div class="header">
        <h2>Our Menu</h2>
        <div class="filters">
          <button (click)="filterCategory('All')" [class.active]="selectedCategory() === 'All'">
            All
          </button>
          <button
            (click)="filterCategory('veg-indian')"
            [class.active]="selectedCategory() === 'veg-indian'"
          >
            Veg Indian
          </button>
          <button
            (click)="filterCategory('non-veg-indian')"
            [class.active]="selectedCategory() === 'non-veg-indian'"
          >
            Non-Veg Indian
          </button>
          <button
            (click)="filterCategory('beverages')"
            [class.active]="selectedCategory() === 'beverages'"
          >
            Beverages
          </button>
        </div>
      </div>

      <div *ngIf="loading()" class="loading">Loading delicious items...</div>

      <div *ngIf="!loading()" class="grid">
        <div *ngFor="let item of filteredItems()" class="food-card">
          <div class="image-box">
            <!-- Fallback to placeholder if image fails -->
            <img [src]="item.imageUrl" (error)="handleImageError($event)" alt="{{ item.name }}" />
          </div>
          <div class="details">
            <h3>{{ item.name }}</h3>
            <p class="category">{{ item.subCategory }}</p>

            <div class="actions">
              <!-- Single Price Item -->
              <div *ngIf="item.pricing.type === 'SINGLE'" class="single-price">
                <span class="price">₹{{ item.pricing.price }}</span>
                <button (click)="addToCart(item, 'SINGLE')">Add to Cart</button>
              </div>

              <!-- Half/Full Price Item -->
              <div *ngIf="item.pricing.type === 'HALF_FULL'" class="multi-price">
                <button (click)="addToCart(item, 'HALF')">
                  Half ₹{{ item.pricing.priceHalf }}
                </button>
                <button (click)="addToCart(item, 'FULL')">
                  Full ₹{{ item.pricing.priceFull }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .menu-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .header {
        text-align: center;
        margin-bottom: 3rem;
      }
      h2 {
        font-size: 2.5rem;
        margin-bottom: 1.5rem;
        color: #333;
      }

      .filters {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
      }

      .filters button {
        padding: 8px 20px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 25px;
        cursor: pointer;
        transition: 0.3s;
        font-weight: 500;
      }

      .filters button.active,
      .filters button:hover {
        background: #ff6b00;
        color: white;
        border-color: #ff6b00;
      }

      .loading {
        text-align: center;
        font-size: 1.5rem;
        color: #666;
        margin-top: 2rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 2rem;
      }

      .food-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transition: 0.3s;
        display: flex;
        flex-direction: column;
      }

      .food-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      }

      .image-box {
        height: 180px;
        overflow: hidden;
        background: #eee;
      }
      .image-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: 0.5s;
      }
      .food-card:hover .image-box img {
        transform: scale(1.05);
      }

      .details {
        padding: 1.5rem;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .details h3 {
        margin: 0 0 0.2rem 0;
        font-size: 1.2rem;
      }
      .category {
        color: #888;
        font-size: 0.85rem;
        margin-bottom: 1rem;
        text-transform: capitalize;
      }

      .actions {
        margin-top: auto;
      }

      .single-price {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .price {
        font-weight: bold;
        font-size: 1.2rem;
        color: #ff6b00;
      }
      .single-price button {
        background: #1a1a1a;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
      }
      .single-price button:hover {
        background: #ff6b00;
      }

      .multi-price {
        display: flex;
        gap: 0.5rem;
      }
      .multi-price button {
        flex: 1;
        background: #f4f4f4;
        border: 1px solid #ddd;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: 0.2s;
      }
      .multi-price button:hover {
        background: #ff6b00;
        color: white;
        border-color: #ff6b00;
      }
    `,
  ],
})
export class MenuComponent implements OnInit {
  menuService = inject(MenuService);
  cartService = inject(CartService);

  menuItems = signal<MenuItem[]>([]);
  filteredItems = signal<MenuItem[]>([]);
  selectedCategory = signal<string>('All');
  loading = signal<boolean>(true);

  ngOnInit() {
    this.menuService.getMenu().subscribe({
      next: (items) => {
        this.menuItems.set(items);
        this.filterCategory('All');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load menu', err);
        this.loading.set(false);
      },
    });
  }

  filterCategory(cat: string) {
    this.selectedCategory.set(cat);
    if (cat === 'All') {
      this.filteredItems.set(this.menuItems());
    } else {
      this.filteredItems.set(this.menuItems().filter((i) => i.category === cat));
    }
  }

  addToCart(item: MenuItem, variant: any) {
    this.cartService.addToCart(item, variant);
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400?text=No+Image';
  }
}
