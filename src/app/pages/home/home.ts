import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../services/menu';
import { AuthService } from '../../services/auth';
import { MenuItem } from '../../models/menu-item.model';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <header class="hero">
        <div class="hero-content">
          <span class="badge">New in Town</span>
          <h1>
            Experience the <br />
            <span class="highlight">Taste of Legend</span>
          </h1>
          <p>
            From our kitchen to your table. Authentic flavors, crafted with passion. Order now and
            get 20% off your first meal.
          </p>
          <div class="cta-group">
            <a routerLink="/menu" class="btn-primary">Order Now</a>
            <a routerLink="/menu" class="btn-secondary">View Menu</a>
          </div>
        </div>
        <div class="hero-image">
          <div class="image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070"
              alt="Delicious Food"
            />
            <div class="floating-card c1">
              <span>🔥 Hot & Spicy</span>
            </div>
            <div class="floating-card c2">
              <span>⭐ Top Rated</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Stats Section -->
      <section class="stats">
        <div class="stat-item">
          <h2>15k+</h2>
          <p>Happy Customers</p>
        </div>
        <div class="stat-item">
          <h2>50+</h2>
          <p>Menu Items</p>
        </div>
        <div class="stat-item">
          <h2>4.8</h2>
          <p>Average Rating</p>
        </div>
      </section>

      <!-- Recommendations Section -->
      <section class="recommendations" *ngIf="recommendedItems().length > 0">
        <div class="section-header">
          <h2>Curated For <span class="highlight">You</span></h2>
          <p>Based on your taste preferences</p>
        </div>

        <div class="rec-grid">
          <div class="rec-card" *ngFor="let item of recommendedItems()">
            <div class="card-img">
              <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" />
              <span class="tag">Recommended</span>
            </div>
            <div class="card-info">
              <h3>{{ item.name }}</h3>
              <p>{{ item.subCategory }}</p>
              <div class="bottom">
                <span class="price">₹{{ item.pricing.price }}</span>
                <button (click)="addToCart(item)" class="add-btn">+</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="feature-card">
          <div class="icon">🚀</div>
          <h3>Fast Delivery</h3>
          <p>Hot and fresh food delivered to your doorstep in under 30 minutes.</p>
        </div>
        <div class="feature-card">
          <div class="icon">🥗</div>
          <h3>Fresh Ingredients</h3>
          <p>We use only the finest and freshest ingredients for our dishes.</p>
        </div>
        <div class="feature-card">
          <div class="icon">👨‍🍳</div>
          <h3>Expert Chefs</h3>
          <p>Our culinary team brings years of experience to every plate.</p>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home-container {
        color: white;
        overflow-x: hidden;
      }

      .highlight {
        color: #ff6600;
      }

      /* Hero */
      .hero {
        min-height: 90vh;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 5%;
        background: radial-gradient(circle at top right, #1a1a1a, #0a0a0a);
        position: relative;
      }

      .hero-content {
        max-width: 600px;
        z-index: 2;
      }

      .badge {
        background: rgba(255, 102, 0, 0.1);
        color: #ff6600;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
        display: inline-block;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 102, 0, 0.2);
      }

      h1 {
        font-size: 4.5rem;
        line-height: 1.1;
        font-weight: 800;
        margin-bottom: 20px;
        letter-spacing: -2px;
      }

      p {
        color: #888;
        font-size: 1.2rem;
        margin-bottom: 40px;
        line-height: 1.6;
        max-width: 90%;
      }

      .cta-group {
        display: flex;
        gap: 20px;
      }

      .btn-primary {
        background: #ff6600;
        color: white;
        padding: 16px 32px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        transition: 0.3s;
        box-shadow: 0 10px 20px rgba(255, 102, 0, 0.2);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 30px rgba(255, 102, 0, 0.3);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        color: white;
        padding: 16px 32px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        transition: 0.3s;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      /* Hero Image */
      .hero-image {
        position: relative;
        width: 500px;
        height: 600px;
      }

      .image-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .image-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 30px;
        transform: rotate(3deg);
        box-shadow: 20px 20px 60px rgba(0, 0, 0, 0.5);
      }

      .floating-card {
        position: absolute;
        background: rgba(20, 20, 20, 0.8);
        backdrop-filter: blur(10px);
        padding: 12px 20px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: 600;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        animation: float 3s ease-in-out infinite;
      }

      .c1 {
        top: 10%;
        left: -40px;
        animation-delay: 0s;
      }
      .c2 {
        bottom: 10%;
        right: -20px;
        animation-delay: 1.5s;
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      /* Stats */
      .stats {
        display: flex;
        justify-content: space-around;
        padding: 40px 10%;
        background: #0f0f0f;
        border-bottom: 1px solid #222;
      }

      .stat-item {
        text-align: center;
      }

      .stat-item h2 {
        font-size: 2.5rem;
        color: #ff6600;
        margin: 0;
        font-weight: 800;
      }

      .stat-item p {
        margin: 5px 0 0;
        font-size: 0.9rem;
        color: #666;
      }

      /* Recommendations */
      .recommendations {
        padding: 80px 5%;
        background: #0a0a0a;
      }

      .section-header {
        text-align: center;
        margin-bottom: 50px;
      }

      .section-header h2 {
        font-size: 2.5rem;
        margin-bottom: 10px;
      }

      .rec-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 30px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .rec-card {
        background: #111;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid #222;
        transition: 0.3s;
      }

      .rec-card:hover {
        transform: translateY(-5px);
        border-color: #333;
      }

      .card-img {
        height: 200px;
        position: relative;
      }

      .card-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .tag {
        position: absolute;
        top: 15px;
        right: 15px;
        background: #ff6600;
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 700;
      }

      .card-info {
        padding: 20px;
      }

      .card-info h3 {
        margin: 0;
        font-size: 1.2rem;
      }

      .card-info p {
        font-size: 0.9rem;
        margin: 5px 0 20px;
      }

      .bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .price {
        font-size: 1.3rem;
        font-weight: 700;
        color: #ff6600;
      }

      .add-btn {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        background: white;
        color: black;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        transition: 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .add-btn:hover {
        background: #ff6600;
        color: white;
      }

      /* Features */
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 40px;
        padding: 100px 5%;
        background: #0f0f0f;
      }

      .feature-card {
        text-align: center;
        padding: 30px;
        background: #161616;
        border-radius: 20px;
        border: 1px solid #222;
      }

      .feature-card .icon {
        font-size: 3rem;
        margin-bottom: 20px;
      }

      .feature-card h3 {
        margin-bottom: 10px;
        font-size: 1.3rem;
      }

      @media (max-width: 768px) {
        .hero {
          flex-direction: column;
          padding-top: 120px;
          text-align: center;
        }

        .hero-image {
          width: 100%;
          height: 350px;
          margin-top: 50px;
        }

        .cta-group {
          justify-content: center;
        }

        h1 {
          font-size: 3rem;
        }

        .stats {
          flex-direction: column;
          gap: 30px;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  menuService = inject(MenuService);
  cartService = inject(CartService);

  recommendedItems = signal<MenuItem[]>([]);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadRecommendations();
    }
  }

  loadRecommendations() {
    // FIX: Using correct method name 'getAiRecommendations' instead of 'getRecommendations'
    this.menuService.getAiRecommendations().subscribe({
      next: (items) => this.recommendedItems.set(items),
      error: () => console.warn('Could not load AI recommendations.'),
    });
  }

  addToCart(item: MenuItem) {
    this.cartService.addToCart(item, 'SINGLE');
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}
