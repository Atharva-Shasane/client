import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MenuService } from '../../services/menu';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast';
import { RatingService } from '../../services/rating';
import { FeedbackModalComponent } from '../../components/feedback-modal/feedback';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FeedbackModalComponent],
  template: `
    <div class="home-container">
      <!-- Auto-Pop Feedback Modal for Recent Orders -->
      <app-feedback-modal
        [isVisible]="showFeedback()"
        [orderId]="pendingOrder()?._id"
        [orderNumber]="pendingOrder()?.orderNumber"
        [items]="pendingOrder()?.items || []"
        (close)="showFeedback.set(false)"
      ></app-feedback-modal>

      <section class="hero">
        <div class="hero-content fade-in">
          <span class="badge">Legendary Flavors</span>
          <h1>Experience the <span class="highlight">Killa</span> Taste</h1>
          <p>
            The most authentic restaurant experience in town. Fresh ingredients and legendary
            service.
          </p>
          <div class="hero-actions">
            <a routerLink="/menu" class="btn-primary">Explore Menu</a>
            <a routerLink="/my-orders" class="btn-secondary">My Orders</a>
          </div>
        </div>
        <div class="hero-image"></div>
      </section>

      <!-- AI-Powered Recommendations Section -->
      <section class="recommendations" *ngIf="recommendations().length > 0">
        <div class="container">
          <div class="section-header">
            <h2>Legendary <span class="highlight">Picks</span></h2>
            <p>AI-curated recommendations based on top ratings and order volume.</p>
          </div>
          <div class="recommendation-grid">
            <div
              class="recommendation-card glass-card fade-in"
              *ngFor="let item of recommendations()"
            >
              <div class="card-media">
                <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" />
                <div class="ai-tag">TOP RATED</div>
              </div>
              <div class="card-info">
                <h3>{{ item.name }}</h3>

                <!-- Rating logic for homepage recommendations -->
                <div class="rating-wrap">
                  <span
                    class="star-icon"
                    [class.active]="item.averageRating && item.averageRating > 0"
                    >★</span
                  >
                  <ng-container *ngIf="item.averageRating && item.averageRating > 0; else noRating">
                    <span class="rating-val">{{ item.averageRating | number: '1.1-1' }}</span>
                    <span class="review-count">({{ item.totalReviews }})</span>
                  </ng-container>
                  <ng-template #noRating>
                    <span class="new-pill">NEW</span>
                  </ng-template>
                </div>

                <div class="card-footer">
                  <span class="price">
                    ₹{{
                      item.pricing.type === 'SINGLE' ? item.pricing.price : item.pricing.priceHalf
                    }}
                  </span>
                  <button (click)="addToCart(item)" class="btn-add">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="container">
          <div class="feature-grid">
            <div class="feature-card glass-card">
              <div class="icon">🚀</div>
              <h3>Quick Delivery</h3>
              <p>Legendary speed for your cravings.</p>
            </div>
            <div class="feature-card glass-card">
              <div class="icon">👨‍Chef;</div>
              <h3>Expert Chefs</h3>
              <p>Masters of flavor and culinary precision.</p>
            </div>
            <div class="feature-card glass-card">
              <div class="icon">⭐</div>
              <h3>Quality Taste</h3>
              <p>Only the freshest ingredients.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home-container {
        background: #0a0a0a;
        min-height: 100vh;
        color: white;
        padding-top: 80px;
      }
      .container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 60px 24px;
        max-width: 1300px;
        margin: 0 auto;
        gap: 40px;
      }
      .hero-content h1 {
        font-size: clamp(2.5rem, 6vw, 3.5rem);
        font-weight: 900;
        line-height: 1.1;
      }
      .highlight {
        color: #ff6600;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .hero-content p {
        color: #777;
        font-size: 1.1rem;
        margin: 20px 0 35px;
        max-width: 500px;
      }
      .btn-primary {
        background: #ff6600;
        color: white;
        padding: 16px 35px;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 800;
        display: inline-block;
        transition: 0.3s;
      }
      .btn-primary:hover {
        background: #e65c00;
        transform: translateY(-2px);
      }
      .btn-secondary {
        background: #1a1a1a;
        color: white;
        padding: 16px 35px;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 800;
        border: 1px solid #333;
        margin-left: 15px;
        display: inline-block;
        transition: 0.3s;
      }
      .btn-secondary:hover {
        background: #222;
        border-color: #444;
      }

      .recommendations {
        padding: 60px 0;
        background: #080808;
      }
      .section-header {
        margin-bottom: 40px;
        text-align: center;
      }
      .section-header h2 {
        font-size: 2.5rem;
        font-weight: 900;
      }
      .section-header p {
        color: #555;
      }

      .recommendation-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
      }
      .recommendation-card {
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid #222;
        transition: 0.3s;
      }
      .recommendation-card:hover {
        transform: translateY(-5px);
        border-color: #333;
      }
      .card-media {
        height: 180px;
        position: relative;
      }
      .card-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ai-tag {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #ff6600;
        padding: 4px 10px;
        font-size: 0.6rem;
        font-weight: 900;
        border-radius: 6px;
      }
      .card-info {
        padding: 18px;
      }

      .rating-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        margin-bottom: 12px;
      }
      .star-icon {
        color: #222;
        font-size: 1rem;
      }
      .star-icon.active {
        color: #ffcc00;
      }
      .rating-val {
        color: #fff;
        font-weight: 800;
        font-size: 0.85rem;
      }
      .review-count {
        color: #444;
        font-size: 0.75rem;
      }
      .new-pill {
        font-size: 0.6rem;
        background: rgba(255, 102, 0, 0.1);
        color: #ff6600;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 800;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .price {
        font-size: 1.3rem;
        font-weight: 900;
        color: #ff6600;
      }
      .btn-add {
        background: white;
        color: black;
        border: none;
        padding: 8px 18px;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-add:hover {
        background: #eee;
        transform: scale(1.05);
      }

      .features {
        padding: 60px 0;
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
      .feature-card {
        padding: 35px;
        text-align: center;
        border: 1px solid #1a1a1a;
        border-radius: 28px;
      }
      .feature-card .icon {
        font-size: 2.5rem;
        margin-bottom: 15px;
      }
      .feature-card h3 {
        font-size: 1.2rem;
        font-weight: 800;
        margin-bottom: 10px;
      }
      .feature-card p {
        color: #555;
        font-size: 0.9rem;
      }

      .glass-card {
        background: rgba(26, 26, 26, 0.8);
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      @media (max-width: 768px) {
        .hero {
          flex-direction: column;
          text-align: center;
        }
        .hero-content p {
          margin: 20px auto 35px;
        }
        .feature-grid {
          grid-template-columns: 1fr;
        }
        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-secondary {
          margin-left: 0;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  menuService = inject(MenuService);
  cartService = inject(CartService);
  toast = inject(ToastService);
  ratingService = inject(RatingService);

  recommendations = signal<MenuItem[]>([]);
  showFeedback = signal(false);
  pendingOrder = signal<any>(null);

  ngOnInit() {
    this.loadRecommendations();
    // Use the signal call auth.isLoggedIn()
    if (this.auth.isLoggedIn()) {
      this.checkFeedback();
    }
  }

  loadRecommendations() {
    this.menuService.getAiRecommendations().subscribe({
      next: (items: any) => this.recommendations.set(items.slice(0, 4)),
      error: () => console.warn('AI microservice currently offline'),
    });
  }

  checkFeedback() {
    this.ratingService.checkPendingFeedback().subscribe({
      next: (res: any) => {
        if (res && res.pending) {
          this.pendingOrder.set(res.order);
          this.showFeedback.set(true);
        }
      },
    });
  }

  addToCart(item: MenuItem) {
    // Logic to choose the default variant based on pricing type
    const variant = item.pricing.type === 'SINGLE' ? 'SINGLE' : 'HALF';
    this.cartService.addToCart(item, variant);
    this.toast.show(`${item.name} added to cart!`, 'success');
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}
