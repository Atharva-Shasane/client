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
      <!-- Global Standalone Feedback Component -->
      <app-feedback-modal
        [isVisible]="showFeedback()"
        [orderId]="pendingOrder()?._id"
        [orderNumber]="pendingOrder()?.orderNumber"
        [items]="pendingOrder()?.items || []"
        (close)="showFeedback.set(false)"
      ></app-feedback-modal>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content fade-in">
          <span class="badge">Legendary Flavors</span>
          <h1>Experience the <span class="highlight">Killa</span> Taste</h1>
          <p>
            The most authentic restaurant experience in town. Fresh ingredients, bold spices, and
            legendary service.
          </p>
          <div class="hero-actions">
            <a routerLink="/menu" class="btn-primary">Explore Menu</a>
            <a routerLink="/my-orders" class="btn-secondary">My Orders</a>
          </div>
        </div>
        <div class="hero-image"></div>
      </section>

      <!-- AI Recommendations -->
      <section class="recommendations" *ngIf="recommendations().length > 0">
        <div class="container">
          <div class="section-header">
            <h2>Legendary <span class="highlight">Picks</span></h2>
            <p>Based on top ratings and order volume.</p>
          </div>
          <div class="recommendation-grid">
            <div class="recommendation-card glass-card" *ngFor="let item of recommendations()">
              <div class="card-media">
                <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" />
                <div class="ai-tag">TOP RATED</div>
              </div>
              <div class="card-info">
                <h3>{{ item.name }}</h3>
                <div class="card-footer">
                  <span class="price"
                    >₹{{
                      item.pricing.type === 'SINGLE' ? item.pricing.price : item.pricing.priceHalf
                    }}</span
                  >
                  <button (click)="addToCart(item)" class="btn-add">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <div class="feature-grid">
            <div class="feature-card glass-card">
              <div class="icon">🚚</div>
              <h3>Quick Delivery</h3>
              <p>Legendary speed for your cravings.</p>
            </div>
            <div class="feature-card glass-card">
              <div class="icon">👨‍🍳</div>
              <h3>Expert Chefs</h3>
              <p>Masters of flavor and culinary precision.</p>
            </div>
            <div class="feature-card glass-card">
              <div class="icon">✨</div>
              <h3>Quality Taste</h3>
              <p>Only the freshest ingredients.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-item">
              <h2>15k+</h2>
              <p>Customers</p>
            </div>
            <div class="stat-item">
              <h2>50+</h2>
              <p>Awards</p>
            </div>
            <div class="stat-item">
              <h2>10+</h2>
              <p>Years</p>
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
      .hero-content {
        flex: 1;
      }
      h1 {
        font-size: clamp(2.5rem, 6vw, 3.5rem);
        font-weight: 900;
        line-height: 1.1;
        letter-spacing: -2px;
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
      }

      .recommendations {
        padding: 60px 0;
        background: #080808;
      }
      .section-header h2 {
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 10px;
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
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
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
      .stats {
        padding: 50px 0;
        background: #050505;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        text-align: center;
      }
      .stat-item h2 {
        font-size: 3rem;
        font-weight: 900;
        color: #ff6600;
        margin: 0;
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
    if (this.auth.isLoggedIn()) {
      this.checkFeedback();
    }
  }

  loadRecommendations() {
    this.menuService.getAiRecommendations().subscribe({
      next: (items) => this.recommendations.set(items.slice(0, 4)),
      error: () => console.warn('AI offline'),
    });
  }

  checkFeedback() {
    this.ratingService.checkPendingFeedback().subscribe({
      next: (res) => {
        if (res.pending) {
          this.pendingOrder.set(res.order);
          this.showFeedback.set(true);
        }
      },
    });
  }

  addToCart(item: MenuItem) {
    const variant = item.pricing.type === 'SINGLE' ? 'SINGLE' : 'HALF';
    this.cartService.addToCart(item, variant);
    this.toast.success(`${item.name} added to cart!`);
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}
