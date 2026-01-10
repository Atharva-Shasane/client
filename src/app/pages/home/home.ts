import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../services/menu';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-wrapper">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="overlay"></div>
        <div class="hero-content">
          <span class="badge-top">Est. 2024</span>
          <h1>Experience <br /><span class="highlight">Killa</span> Flavors</h1>
          <p>Where every bite tells a legendary story. Crafted by masters, served for you.</p>
          <div class="cta-group">
            <a routerLink="/menu" class="cta-button">View Menu</a>
            <a *ngIf="!authService.isLoggedIn()" routerLink="/register" class="cta-link"
              >Become a Member</a
            >
          </div>
        </div>
        <div class="scroll-indicator">
          <div class="mouse"></div>
        </div>
      </section>

      <!-- AI Recommendations Section -->
      <section
        class="recommendations"
        *ngIf="authService.isLoggedIn() && recommendedItems().length > 0"
      >
        <div class="container">
          <div class="section-header">
            <span class="sub-title">Personalized</span>
            <h2>Legendary <span class="highlight">Picks</span></h2>
            <div class="line"></div>
          </div>

          <div class="recommendation-grid">
            <div class="food-card" *ngFor="let item of recommendedItems()">
              <div class="card-media">
                <img [src]="item.imageUrl" alt="Food" />
                <div class="tag">{{ item.category.includes('veg') ? 'Veg' : 'Non-Veg' }}</div>
              </div>
              <div class="card-info">
                <h3>{{ item.name }}</h3>
                <p class="desc">{{ item.subCategory }}</p>
                <div class="card-footer">
                  <span class="price">₹{{ item.pricing.price || item.pricing.priceFull }}</span>
                  <button (click)="quickAdd(item)" class="quick-add-btn">
                    <span class="icon">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <div class="features-grid">
            <div class="feature-card">
              <div class="icon-box">🔥</div>
              <h3>Freshly Prepared</h3>
              <p>We don't do pre-cooked. Every order is a fresh masterpiece made just for you.</p>
            </div>
            <div class="feature-card">
              <div class="icon-box">🚀</div>
              <h3>Lightning Fast</h3>
              <p>Hot food shouldn't wait. Our kitchen is optimized for speed without compromise.</p>
            </div>
            <div class="feature-card">
              <div class="icon-box">💎</div>
              <h3>Elite Ingredients</h3>
              <p>From organic spices to premium proteins, quality is our only baseline.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home-wrapper {
        background: #0a0a0a;
        color: white;
        overflow-x: hidden;
        font-family: 'Poppins', sans-serif;
      }
      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
      }

      /* Hero Section */
      .hero-section {
        position: relative;
        height: 100vh;
        min-height: 700px;
        background: url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070')
          center/cover;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 80px;
      }
      .overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(10, 10, 10, 1));
      }
      .hero-content {
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 900px;
      }
      .badge-top {
        display: inline-block;
        padding: 6px 20px;
        border: 1px solid #ff6600;
        border-radius: 50px;
        font-size: 0.8rem;
        font-weight: 700;
        color: #ff6600;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      h1 {
        font-size: clamp(3rem, 10vw, 6rem);
        font-weight: 900;
        line-height: 0.9;
        margin-bottom: 24px;
        text-transform: uppercase;
        letter-spacing: -2px;
      }
      .highlight {
        color: #ff6600;
      }
      .hero-content p {
        font-size: clamp(1rem, 4vw, 1.4rem);
        color: #ccc;
        margin-bottom: 40px;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }

      .cta-group {
        display: flex;
        gap: 20px;
        justify-content: center;
        align-items: center;
      }
      .cta-button {
        padding: 18px 45px;
        background: #ff6600;
        color: white;
        text-decoration: none;
        font-weight: 800;
        border-radius: 12px;
        transition: 0.3s;
        box-shadow: 0 10px 30px rgba(255, 107, 0, 0.3);
      }
      .cta-button:hover {
        transform: translateY(-5px);
        filter: brightness(1.1);
        box-shadow: 0 15px 40px rgba(255, 107, 0, 0.5);
      }
      .cta-link {
        color: white;
        text-decoration: none;
        font-weight: 600;
        border-bottom: 2px solid #ff6600;
        padding-bottom: 2px;
      }

      .scroll-indicator {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
      }
      .mouse {
        width: 30px;
        height: 50px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        position: relative;
      }
      .mouse::before {
        content: '';
        width: 6px;
        height: 6px;
        background: #ff6600;
        border-radius: 50%;
        position: absolute;
        left: 50%;
        top: 10px;
        transform: translateX(-50%);
        animation: scroll 2s infinite;
      }
      @keyframes scroll {
        0% {
          opacity: 1;
          top: 10px;
        }
        100% {
          opacity: 0;
          top: 30px;
        }
      }

      /* Recommendations */
      .recommendations {
        padding: 120px 0;
      }
      .section-header {
        text-align: center;
        margin-bottom: 60px;
      }
      .sub-title {
        color: #ff6600;
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 2px;
        font-size: 0.8rem;
      }
      .section-header h2 {
        font-size: 3rem;
        font-weight: 800;
        margin: 10px 0;
      }
      .line {
        width: 60px;
        height: 4px;
        background: #ff6600;
        margin: 0 auto;
        border-radius: 2px;
      }

      .recommendation-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 32px;
      }
      .food-card {
        background: #1a1a1a;
        border-radius: 24px;
        overflow: hidden;
        transition: 0.4s;
        border: 1px solid #2a2a2a;
      }
      .food-card:hover {
        transform: translateY(-12px);
        border-color: #444;
      }
      .card-media {
        height: 240px;
        position: relative;
      }
      .card-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .tag {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        color: white;
        padding: 5px 15px;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 700;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .card-info {
        padding: 24px;
      }
      .card-info h3 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .desc {
        color: #888;
        font-size: 0.9rem;
        margin: 8px 0 20px;
      }
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .price {
        font-size: 1.6rem;
        font-weight: 900;
        color: #ff6600;
      }
      .quick-add-btn {
        width: 45px;
        height: 45px;
        border-radius: 12px;
        background: #333;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        transition: 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .quick-add-btn:hover {
        background: #ff6600;
        transform: rotate(90deg);
      }

      /* Features */
      .features {
        padding: 100px 0;
        background: #111;
      }
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 40px;
      }
      .feature-card {
        padding: 40px;
        border-radius: 30px;
        background: #1a1a1a;
        transition: 0.3s;
      }
      .feature-card:hover {
        background: #222;
      }
      .icon-box {
        font-size: 3rem;
        margin-bottom: 24px;
      }
      .feature-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 16px;
      }
      .feature-card p {
        color: #888;
        line-height: 1.6;
      }

      @media (max-width: 768px) {
        .hero-section {
          padding-top: 100px;
        }
        .cta-group {
          flex-direction: column;
          width: 100%;
          padding: 0 40px;
        }
        .cta-button {
          width: 100%;
        }
        .section-header h2 {
          font-size: 2.2rem;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  menuService = inject(MenuService);
  authService = inject(AuthService);
  cartService = inject(CartService);

  recommendedItems = signal<MenuItem[]>([]);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadRecommendations();
    }
  }

  loadRecommendations() {
    this.menuService.getAiRecommendations().subscribe({
      next: (items) => this.recommendedItems.set(items),
      error: () => console.warn('Could not load AI recommendations.'),
    });
  }

  quickAdd(item: MenuItem) {
    const variant = item.pricing.type === 'SINGLE' ? 'SINGLE' : 'FULL';
    this.cartService.addToCart(item, variant);
  }
}
