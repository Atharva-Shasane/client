import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuService } from '../../services/menu';
import { AuthService } from '../../services/auth';
import { MenuItem } from '../../models/menu-item.model';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container fade-in">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="badge">EST. 2024</span>
          <h1>Experience <span class="highlight">Killa</span> Flavors</h1>
          <p>The intersection of tradition and modern culinary art.</p>
          <div class="cta-group">
            <a routerLink="/menu" class="btn-primary">Explore Menu</a>
            <a *ngIf="!auth.currentUser()" routerLink="/register" class="btn-outline"
              >Join the Tribe</a
            >
          </div>
        </div>
      </section>

      <!-- Recommendation Model Section (FIXED DIV) -->
      <section class="recommendation-zone">
        <div class="container">
          <header class="section-header">
            <div class="header-text">
              <span class="label">{{
                auth.currentUser() ? 'TAILORED FOR YOU' : 'HALL OF FAME'
              }}</span>
              <h2>{{ auth.currentUser() ? 'Our Top Picks for You' : 'Most Loved Dishes' }}</h2>
            </div>
            <p class="desc">
              {{
                auth.currentUser()
                  ? 'Based on your culinary journey with us, we think you will love these.'
                  : 'The 5 legendary dishes that define the Killa experience.'
              }}
            </p>
          </header>

          <div class="recommendation-grid">
            <div *ngFor="let item of recommendations()" class="rec-card glass-card">
              <div class="card-img">
                <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" />
                <span class="price-tag">₹{{ item.pricing.price || item.pricing.priceFull }}</span>
              </div>
              <div class="card-info">
                <div class="top">
                  <span class="cat-pill" [ngClass]="item.category">{{ item.category }}</span>
                  <span class="sub-pill">{{ item.subCategory }}</span>
                </div>
                <h3>{{ item.name }}</h3>
                <button (click)="addToCart(item)" class="btn-mini-add">Add to Cart</button>
              </div>
            </div>

            <!-- Skeleton Loading State -->
            <div *ngIf="isLoading()" class="skeleton-wrap">
              <div *ngFor="let i of [1, 2, 3, 4, 5]" class="skeleton-card"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="feat-card">
          <div class="icon">🔥</div>
          <h4>Wood Fired</h4>
          <p>Authentic flavors locked in by ancient techniques.</p>
        </div>
        <div class="feat-card">
          <div class="icon">🌿</div>
          <h4>Fresh Only</h4>
          <p>Farm-to-table ingredients sourced daily.</p>
        </div>
        <div class="feat-card">
          <div class="icon">⚡</div>
          <h4>Swift Delivery</h4>
          <p>Hot food at your doorstep in under 30 minutes.</p>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home-container {
        background: #000;
        color: white;
        min-height: 100vh;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }

      /* Hero */
      .hero {
        height: 80vh;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2070')
          center/cover;
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), #000);
      }
      .hero-content {
        position: relative;
        z-index: 10;
        max-width: 800px;
        padding: 0 20px;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        letter-spacing: 4px;
        display: block;
        margin-bottom: 20px;
        font-size: 0.9rem;
      }
      .hero-content h1 {
        font-size: clamp(3rem, 10vw, 6rem);
        font-weight: 900;
        line-height: 0.9;
        letter-spacing: -4px;
        margin-bottom: 25px;
      }
      .highlight {
        color: #ff6600;
      }
      .hero-content p {
        font-size: 1.25rem;
        color: #ccc;
        margin-bottom: 40px;
      }
      .cta-group {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .btn-primary {
        background: #ff6600;
        color: white;
        padding: 18px 40px;
        border-radius: 50px;
        font-weight: 800;
        text-decoration: none;
        transition: 0.3s;
      }
      .btn-outline {
        border: 2px solid white;
        color: white;
        padding: 18px 40px;
        border-radius: 50px;
        font-weight: 800;
        text-decoration: none;
        transition: 0.3s;
      }
      .btn-primary:hover {
        transform: scale(1.05);
        filter: brightness(1.2);
      }
      .btn-outline:hover {
        background: white;
        color: black;
      }

      /* Recommendation Zone */
      .recommendation-zone {
        padding: 100px 0;
        background: #050505;
      }
      .section-header {
        margin-bottom: 60px;
        text-align: left;
      }
      .label {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.75rem;
        letter-spacing: 2px;
      }
      .section-header h2 {
        font-size: 2.5rem;
        font-weight: 900;
        margin: 10px 0;
      }
      .desc {
        color: #666;
        max-width: 600px;
        font-size: 1.1rem;
      }

      .recommendation-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 25px;
      }

      .rec-card {
        background: #111;
        border: 1px solid #222;
        border-radius: 24px;
        overflow: hidden;
        transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .rec-card:hover {
        transform: translateY(-10px);
        border-color: #ff6600;
      }

      .card-img {
        height: 180px;
        position: relative;
        overflow: hidden;
      }
      .card-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: 0.5s;
      }
      .rec-card:hover img {
        transform: scale(1.1);
      }
      .price-tag {
        position: absolute;
        bottom: 15px;
        right: 15px;
        background: #ff6600;
        color: white;
        padding: 5px 12px;
        border-radius: 10px;
        font-weight: 900;
        font-size: 0.9rem;
      }

      .card-info {
        padding: 20px;
      }
      .top {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .cat-pill {
        font-size: 0.6rem;
        font-weight: 900;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 5px;
      }
      .cat-pill.veg {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
      }
      .cat-pill.non-veg {
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
      }
      .sub-pill {
        font-size: 0.6rem;
        font-weight: 800;
        color: #555;
        background: #222;
        padding: 3px 8px;
        border-radius: 5px;
      }

      .card-info h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 20px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .btn-mini-add {
        width: 100%;
        background: #222;
        color: #fff;
        border: none;
        padding: 10px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-mini-add:hover {
        background: #ff6600;
      }

      /* Skeleton */
      .skeleton-wrap {
        display: contents;
      }
      .skeleton-card {
        height: 300px;
        background: #111;
        border-radius: 24px;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.5;
        }
      }

      /* Features */
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 40px;
        padding: 100px 20px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .feat-card {
        text-align: center;
      }
      .feat-card .icon {
        font-size: 3rem;
        margin-bottom: 20px;
      }
      .feat-card h4 {
        font-size: 1.4rem;
        font-weight: 800;
        margin-bottom: 10px;
      }
      .feat-card p {
        color: #666;
      }

      @media (max-width: 768px) {
        .recommendation-grid {
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  menuService = inject(MenuService);
  auth = inject(AuthService);
  cartService = inject(CartService);

  recommendations = signal<MenuItem[]>([]);
  isLoading = signal(true);

  constructor() {
    effect(() => {
      // Corrected: using currentUser() which is the signal name in your AuthService
      const user = this.auth.currentUser();
      this.fetchRecommendations(user?._id || null);
    });
  }

  ngOnInit() {}

  fetchRecommendations(userId: string | null) {
    this.isLoading.set(true);
    this.menuService.getRecommendations(userId).subscribe({
      next: (data: MenuItem[]) => {
        this.recommendations.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  addToCart(item: MenuItem) {
    this.cartService.addToCart(item);
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}
