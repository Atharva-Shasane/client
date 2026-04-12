import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
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
    <div class="page-wrap">
      <!-- Feedback Modal -->
      <app-feedback-modal
        [isVisible]="showFeedback()"
        [orderId]="pendingOrder()?._id"
        [orderNumber]="pendingOrder()?.orderNumber"
        [items]="pendingOrder()?.items || []"
        (close)="showFeedback.set(false)"
      ></app-feedback-modal>

      <!-- ═══════════════════════════════════════════════
           HERO
      ═══════════════════════════════════════════════ -->
      <section class="hero">
        <!-- Ambient background layers -->
        <div class="hero-bg">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="grain"></div>
        </div>

        <div class="hero-inner">
          <div class="hero-text">
            <p class="eyebrow">
              <span class="eyebrow-dot"></span>
              Now Serving — Dine In &amp; Takeaway
            </p>
            <h1 class="hero-title">
              <span class="title-line line-1">Taste That</span>
              <span class="title-line line-2">Hits <em>Different.</em></span>
            </h1>
            <p class="hero-sub">
              Killa Restaurant — where every dish is crafted with fire, passion and decades of
              culinary mastery. Come hungry. Leave legendary.
            </p>
            <div class="hero-cta">
              <a routerLink="/menu" class="cta-primary">
                <span>Order Now</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </a>
              <a routerLink="/my-orders" class="cta-ghost">My Orders</a>
            </div>
            <div class="hero-stats">
              <div class="stat">
                <span class="stat-num">4.8★</span>
                <span class="stat-label">Avg Rating</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat">
                <span class="stat-num">2k+</span>
                <span class="stat-label">Happy Guests</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat">
                <span class="stat-num">8 min</span>
                <span class="stat-label">Avg Wait</span>
              </div>
            </div>
          </div>

          <div class="hero-visual">
            <div class="hero-card-glow"></div>
            <div class="hero-plate-ring">
              <div class="plate-inner">
                <div class="plate-icon">🍽️</div>
              </div>
            </div>
            <div class="floating-badge badge-top">
              <span class="fb-icon">🔥</span>
              <div>
                <p class="fb-title">Chef's Special</p>
                <p class="fb-sub">Today's Signature</p>
              </div>
            </div>
            <div class="floating-badge badge-bot">
              <span class="fb-icon">⚡</span>
              <div>
                <p class="fb-title">Fast Service</p>
                <p class="fb-sub">Ready in minutes</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll nudge -->
        <div class="scroll-nudge">
          <span>Scroll</span>
          <div class="scroll-line"></div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           MARQUEE STRIP
      ═══════════════════════════════════════════════ -->
      <div class="marquee-strip">
        <div class="marquee-track">
          <span *ngFor="let item of marqueeItems">{{ item }} <em>·</em></span>
          <span *ngFor="let item of marqueeItems">{{ item }} <em>·</em></span>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           AI RECOMMENDATIONS
      ═══════════════════════════════════════════════ -->
      <section class="reco-section" *ngIf="recommendations().length > 0">
        <div class="section-container">
          <div class="section-label">
            <span class="label-dot ai-dot"></span>
            AI-Powered Picks
          </div>
          <h2 class="section-title">Legendary <span class="accent">Recommendations</span></h2>
          <p class="section-sub">
            Curated by our discovery engine — based on ratings, reviews, and what people keep
            ordering.
          </p>

          <div class="reco-grid">
            <div
              class="reco-card"
              *ngFor="let item of recommendations(); let i = index"
              [style.animation-delay]="i * 0.1 + 's'"
            >
              <div class="reco-img-wrap">
                <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event)" />
                <div class="reco-overlay"></div>
                <span class="reco-badge">
                  <ng-container *ngIf="item.averageRating && item.averageRating > 0; else newBadge">
                    ★ {{ item.averageRating | number: '1.1-1' }}
                  </ng-container>
                  <ng-template #newBadge>NEW</ng-template>
                </span>
                <span class="reco-category">{{ item.category }}</span>
              </div>
              <div class="reco-body">
                <h3 class="reco-name">{{ item.name }}</h3>
                <div class="reco-meta" *ngIf="item.totalReviews && item.totalReviews > 0">
                  <span class="reco-reviews">{{ item.totalReviews }} reviews</span>
                </div>
                <div class="reco-footer">
                  <span class="reco-price">
                    ₹{{
                      item.pricing.type === 'SINGLE' ? item.pricing.price : item.pricing.priceHalf
                    }}
                    <small *ngIf="item.pricing.type === 'HALF_FULL'">/ half</small>
                  </span>
                  <button (click)="addToCart(item)" class="reco-add-btn">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1v12M1 7h12"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                      />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="reco-cta">
            <a routerLink="/menu" class="cta-outline">
              View Full Menu
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           WHY KILLA — FEATURES
      ═══════════════════════════════════════════════ -->
      <section class="features-section">
        <div class="section-container">
          <div class="features-layout">
            <div class="features-left">
              <div class="section-label">
                <span class="label-dot"></span>
                Why Choose Us
              </div>
              <h2 class="section-title">The Killa<br /><span class="accent">Difference</span></h2>
              <p class="section-sub" style="max-width: 360px;">
                We don't just serve food — we create moments. Every plate carries a promise of
                quality, soul, and craft.
              </p>
              <a
                routerLink="/menu"
                class="cta-primary"
                style="margin-top: 32px; display: inline-flex;"
              >
                <span>Explore Menu</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </a>
            </div>
            <div class="features-right">
              <div
                class="feature-item"
                *ngFor="let f of features; let i = index"
                [style.animation-delay]="i * 0.12 + 's'"
              >
                <div class="feature-icon-wrap">
                  <span class="feature-icon">{{ f.icon }}</span>
                </div>
                <div class="feature-text">
                  <h4>{{ f.title }}</h4>
                  <p>{{ f.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           POSITIVE REVIEWS
      ═══════════════════════════════════════════════ -->
      <section class="reviews-section">
        <div class="section-container">
          <div class="section-label">
            <span class="label-dot review-dot"></span>
            Real Guest Experiences
          </div>
          <h2 class="section-title">What People Are <span class="accent">Saying</span></h2>
          <p class="section-sub">Honest words from guests who've tasted the legend.</p>

          <div class="reviews-grid">
            <div
              class="review-card"
              *ngFor="let r of positiveReviews; let i = index"
              [style.animation-delay]="i * 0.1 + 's'"
            >
              <div class="review-top">
                <div class="review-stars">
                  <span *ngFor="let s of getStars(r.rating)">★</span>
                </div>
                <span class="review-date">{{ r.date }}</span>
              </div>
              <p class="review-text">"{{ r.comment }}"</p>
              <div class="review-author">
                <div class="author-avatar">{{ r.name[0] }}</div>
                <div>
                  <p class="author-name">{{ r.name }}</p>
                  <p class="author-tag">{{ r.tag }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           DINE MODES
      ═══════════════════════════════════════════════ -->
      <section class="modes-section">
        <div class="section-container">
          <div class="modes-grid">
            <div class="mode-card mode-dine">
              <div class="mode-icon">🪑</div>
              <h3>Dine In</h3>
              <p>
                Reserve your table and experience the full Killa ambiance. Great for families,
                dates, and gatherings.
              </p>
              <a routerLink="/menu" class="mode-btn">Book a Table</a>
            </div>
            <div class="mode-card mode-take">
              <div class="mode-icon">🛍️</div>
              <h3>Takeaway</h3>
              <p>
                Order ahead, skip the wait. Your legendary meal packed and ready to go when you
                arrive.
              </p>
              <a routerLink="/menu" class="mode-btn">Order Takeaway</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           FOOTER CTA STRIP
      ═══════════════════════════════════════════════ -->
      <section class="footer-cta">
        <div class="fc-grain"></div>
        <div class="section-container fc-inner">
          <h2>Ready to taste the<br /><span class="accent">legend?</span></h2>
          <div class="fc-actions">
            <a routerLink="/menu" class="cta-primary">
              <span>Start Your Order</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>
            <a routerLink="/my-orders" class="cta-ghost">Track My Orders</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

      /* ═══════════════════════════════════════════
       GLOBAL / TOKENS
    ═══════════════════════════════════════════ */
      :host {
        --orange: #ff6600;
        --orange-dim: rgba(255, 102, 0, 0.12);
        --orange-glow: rgba(255, 102, 0, 0.25);
        --surface: #0d0d0d;
        --surface-2: #111111;
        --surface-3: #161616;
        --border: rgba(255, 255, 255, 0.06);
        --border-hover: rgba(255, 255, 255, 0.12);
        --text: #f0ede8;
        --text-muted: #6b6b6b;
        --text-dim: #3a3a3a;
        --radius-card: 20px;
        --radius-btn: 12px;
        --font-display: 'Playfair Display', 'Georgia', serif;
      }


      .page-wrap {
        background: var(--surface);
        color: var(--text);
        min-height: 100vh;
        overflow-x: hidden;
        padding-top: 72px;
      }

      /* ═══════════════════════════════════════════
       SHARED SECTION TOKENS
    ═══════════════════════════════════════════ */
      .section-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 28px;
      }

      .section-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 16px;
      }
      .label-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--text-dim);
        display: inline-block;
      }
      .ai-dot {
        background: var(--orange);
        box-shadow: 0 0 8px var(--orange-glow);
      }
      .review-dot {
        background: #ffd700;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      }

      .section-title {
        font-family: var(--font-display);
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 900;
        line-height: 1.1;
        color: var(--text);
        margin: 0 0 14px;
      }
      .section-sub {
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.65;
        margin: 0 0 48px;
        max-width: 520px;
      }
      .accent {
        color: var(--orange);
      }

      /* ═══════════════════════════════════════════
       BUTTONS
    ═══════════════════════════════════════════ */
      .cta-primary {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: var(--orange);
        color: #fff;
        padding: 14px 28px;
        border-radius: var(--radius-btn);
        font-weight: 800;
        font-size: 0.92rem;
        text-decoration: none;
        transition:
          background 0.22s,
          transform 0.22s,
          box-shadow 0.22s;
        box-shadow: 0 4px 24px var(--orange-glow);
      }
      .cta-primary:hover {
        background: #e85a00;
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(255, 102, 0, 0.4);
      }

      .cta-ghost {
        display: inline-flex;
        align-items: center;
        color: var(--text-muted);
        padding: 14px 24px;
        border-radius: var(--radius-btn);
        font-weight: 700;
        font-size: 0.92rem;
        text-decoration: none;
        border: 1px solid var(--border);
        transition:
          border-color 0.2s,
          color 0.2s,
          background 0.2s;
      }
      .cta-ghost:hover {
        border-color: var(--border-hover);
        color: var(--text);
        background: rgba(255, 255, 255, 0.03);
      }

      .cta-outline {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--orange);
        padding: 13px 26px;
        border-radius: var(--radius-btn);
        font-weight: 800;
        font-size: 0.9rem;
        text-decoration: none;
        border: 1.5px solid var(--orange);
        transition:
          background 0.2s,
          transform 0.2s;
      }
      .cta-outline:hover {
        background: var(--orange-dim);
        transform: translateY(-1px);
      }

      /* ═══════════════════════════════════════════
       HERO
    ═══════════════════════════════════════════ */
      .hero {
        position: relative;
        min-height: 88vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
      }

      .hero-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }
      .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.18;
        animation: blobFloat 8s ease-in-out infinite alternate;
      }
      .blob-1 {
        width: 520px;
        height: 520px;
        background: var(--orange);
        top: -120px;
        right: -80px;
        animation-delay: 0s;
      }
      .blob-2 {
        width: 380px;
        height: 380px;
        background: #c73e00;
        bottom: 0;
        left: -60px;
        animation-delay: -4s;
      }
      @keyframes blobFloat {
        from {
          transform: translate(0, 0) scale(1);
        }
        to {
          transform: translate(30px, 20px) scale(1.05);
        }
      }

      .grain {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        opacity: 0.6;
      }

      .hero-inner {
        position: relative;
        z-index: 1;
        max-width: 1280px;
        margin: 0 auto;
        padding: 80px 28px 60px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 60px;
        align-items: center;
      }

      /* Eyebrow */
      .eyebrow {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--orange);
        margin-bottom: 20px;
        animation: fadeUp 0.7s ease both;
      }
      .eyebrow-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--orange);
        box-shadow: 0 0 10px var(--orange);
        animation: pulse 2s ease-in-out infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 0 6px var(--orange);
        }
        50% {
          box-shadow: 0 0 18px var(--orange);
        }
      }

      /* Title */
      .hero-title {
        font-family: var(--font-display);
        font-size: clamp(3rem, 5.5vw, 5rem);
        font-weight: 900;
        line-height: 1.05;
        margin: 0 0 22px;
      }
      .title-line {
        display: block;
      }
      .line-1 {
        animation: fadeUp 0.7s 0.1s ease both;
      }
      .line-2 {
        animation: fadeUp 0.7s 0.2s ease both;
      }
      .hero-title em {
        color: var(--orange);
        font-style: italic;
      }

      .hero-sub {
        color: var(--text-muted);
        font-size: 1.05rem;
        line-height: 1.7;
        max-width: 480px;
        margin: 0 0 36px;
        animation: fadeUp 0.7s 0.3s ease both;
      }

      .hero-cta {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        animation: fadeUp 0.7s 0.4s ease both;
        margin-bottom: 44px;
      }

      /* Stats */
      .hero-stats {
        display: flex;
        align-items: center;
        gap: 24px;
        animation: fadeUp 0.7s 0.5s ease both;
      }
      .stat-divider {
        width: 1px;
        height: 32px;
        background: var(--border);
      }
      .stat-num {
        display: block;
        font-size: 1.25rem;
        font-weight: 900;
        color: var(--text);
      }
      .stat-label {
        display: block;
        font-size: 0.72rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      /* Hero Visual */
      .hero-visual {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 420px;
        animation: fadeUp 0.7s 0.3s ease both;
      }
      .hero-card-glow {
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: var(--orange);
        opacity: 0.08;
        filter: blur(60px);
        animation: blobFloat 6s ease-in-out infinite alternate;
      }
      .hero-plate-ring {
        width: 260px;
        height: 260px;
        border-radius: 50%;
        border: 1.5px solid var(--border-hover);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: spin 20s linear infinite;
        position: relative;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .plate-inner {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: var(--surface-3);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: spin 20s linear infinite reverse;
      }
      .plate-icon {
        font-size: 5rem;
      }

      /* Floating badges */
      .floating-badge {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--surface-3);
        border: 1px solid var(--border);
        padding: 12px 16px;
        border-radius: 14px;
        backdrop-filter: blur(10px);
        min-width: 160px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }
      .badge-top {
        top: 40px;
        right: -10px;
        animation: floatY 4s ease-in-out infinite;
      }
      .badge-bot {
        bottom: 60px;
        left: -10px;
        animation: floatY 4s ease-in-out infinite 2s;
      }
      @keyframes floatY {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-8px);
        }
      }
      .fb-icon {
        font-size: 1.5rem;
      }
      .fb-title {
        font-weight: 800;
        font-size: 0.82rem;
        margin: 0;
      }
      .fb-sub {
        color: var(--text-muted);
        font-size: 0.7rem;
        margin: 0;
      }

      /* Scroll nudge */
      .scroll-nudge {
        position: absolute;
        bottom: 28px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        font-size: 0.65rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-dim);
        z-index: 2;
      }
      .scroll-line {
        width: 1px;
        height: 40px;
        background: linear-gradient(to bottom, var(--text-dim), transparent);
        animation: scrollDrop 1.5s ease-in-out infinite;
      }
      @keyframes scrollDrop {
        0% {
          transform: scaleY(0);
          transform-origin: top;
        }
        50% {
          transform: scaleY(1);
          transform-origin: top;
        }
        51% {
          transform: scaleY(1);
          transform-origin: bottom;
        }
        100% {
          transform: scaleY(0);
          transform-origin: bottom;
        }
      }

      /* Fade-up keyframe */
      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ═══════════════════════════════════════════
       MARQUEE
    ═══════════════════════════════════════════ */
      .marquee-strip {
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        background: var(--surface-2);
        padding: 14px 0;
        overflow: hidden;
        white-space: nowrap;
      }
      .marquee-track {
        display: inline-flex;
        gap: 0;
        animation: marquee 28s linear infinite;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .marquee-track span {
        padding: 0 20px;
      }
      .marquee-track em {
        color: var(--orange);
        font-style: normal;
      }
      @keyframes marquee {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }

      /* ═══════════════════════════════════════════
       RECOMMENDATIONS
    ═══════════════════════════════════════════ */
      .reco-section {
        padding: 100px 0 80px;
        background: var(--surface);
      }

      .reco-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }

      .reco-card {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        overflow: hidden;
        transition:
          transform 0.28s,
          border-color 0.28s,
          box-shadow 0.28s;
        animation: fadeUp 0.6s ease both;
      }
      .reco-card:hover {
        transform: translateY(-6px);
        border-color: var(--border-hover);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
      }

      .reco-img-wrap {
        position: relative;
        height: 190px;
        overflow: hidden;
      }
      .reco-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      .reco-card:hover .reco-img-wrap img {
        transform: scale(1.06);
      }
      .reco-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(13, 13, 13, 0.6) 0%, transparent 60%);
      }
      .reco-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: var(--orange);
        color: #fff;
        font-size: 0.65rem;
        font-weight: 900;
        padding: 4px 10px;
        border-radius: 6px;
      }
      .reco-category {
        position: absolute;
        bottom: 10px;
        left: 12px;
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.55);
      }

      .reco-body {
        padding: 18px 18px 20px;
      }
      .reco-name {
        font-weight: 800;
        font-size: 1rem;
        margin: 0 0 6px;
        color: var(--text);
      }
      .reco-reviews {
        font-size: 0.72rem;
        color: var(--text-muted);
      }
      .reco-meta {
        margin-bottom: 14px;
      }

      .reco-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .reco-price {
        font-size: 1.25rem;
        font-weight: 900;
        color: var(--orange);
      }
      .reco-price small {
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-muted);
      }

      .reco-add-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 102, 0, 0.1);
        color: var(--orange);
        border: 1px solid rgba(255, 102, 0, 0.25);
        padding: 8px 16px;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.82rem;
        cursor: pointer;
        transition:
          background 0.2s,
          transform 0.2s,
          box-shadow 0.2s;
      }
      .reco-add-btn:hover {
        background: var(--orange);
        color: #fff;
        border-color: var(--orange);
        transform: scale(1.04);
        box-shadow: 0 4px 16px var(--orange-glow);
      }

      .reco-cta {
        text-align: center;
      }

      /* ═══════════════════════════════════════════
       FEATURES
    ═══════════════════════════════════════════ */
      .features-section {
        padding: 100px 0;
        background: var(--surface-2);
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
      }
      .features-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: center;
      }
      .features-left .section-sub {
        margin-bottom: 0;
      }

      .features-right {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .feature-item {
        display: flex;
        gap: 18px;
        align-items: flex-start;
        padding: 22px;
        border-radius: 16px;
        border: 1px solid transparent;
        transition:
          border-color 0.25s,
          background 0.25s;
        animation: fadeUp 0.6s ease both;
      }
      .feature-item:hover {
        border-color: var(--border);
        background: rgba(255, 255, 255, 0.02);
      }
      .feature-icon-wrap {
        width: 46px;
        height: 46px;
        flex-shrink: 0;
        background: var(--orange-dim);
        border: 1px solid rgba(255, 102, 0, 0.15);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .feature-icon {
        font-size: 1.3rem;
      }
      .feature-text h4 {
        font-weight: 800;
        font-size: 0.95rem;
        margin: 0 0 4px;
        color: var(--text);
      }
      .feature-text p {
        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
        margin: 0;
      }

      /* ═══════════════════════════════════════════
       REVIEWS
    ═══════════════════════════════════════════ */
      .reviews-section {
        padding: 100px 0;
        background: var(--surface);
      }
      .reviews-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
      .review-card {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        padding: 28px;
        transition:
          transform 0.25s,
          border-color 0.25s;
        animation: fadeUp 0.6s ease both;
      }
      .review-card:hover {
        transform: translateY(-4px);
        border-color: var(--border-hover);
      }
      .review-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .review-stars {
        color: #ffd700;
        font-size: 0.9rem;
        letter-spacing: 1px;
      }
      .review-date {
        font-size: 0.7rem;
        color: var(--text-dim);
      }
      .review-text {
        font-size: 0.92rem;
        line-height: 1.7;
        color: rgba(240, 237, 232, 0.75);
        margin: 0 0 22px;
        font-style: italic;
      }
      .review-author {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .author-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--orange-dim);
        border: 1px solid rgba(255, 102, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 0.85rem;
        color: var(--orange);
      }
      .author-name {
        font-weight: 800;
        font-size: 0.85rem;
        margin: 0;
      }
      .author-tag {
        font-size: 0.7rem;
        color: var(--text-muted);
        margin: 0;
      }

      /* ═══════════════════════════════════════════
       DINE MODES
    ═══════════════════════════════════════════ */
      .modes-section {
        padding: 100px 0;
        background: var(--surface-2);
        border-top: 1px solid var(--border);
      }
      .modes-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      .mode-card {
        padding: 52px 44px;
        border-radius: 24px;
        border: 1px solid var(--border);
        transition:
          transform 0.28s,
          border-color 0.28s,
          box-shadow 0.28s;
      }
      .mode-card:hover {
        transform: translateY(-4px);
        border-color: var(--border-hover);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      }
      .mode-dine {
        background: linear-gradient(135deg, #111 0%, #161616 100%);
      }
      .mode-take {
        background: linear-gradient(135deg, #130800 0%, #1a0d00 100%);
        border-color: rgba(255, 102, 0, 0.15);
      }
      .mode-take:hover {
        border-color: rgba(255, 102, 0, 0.3);
      }
      .mode-icon {
        font-size: 2.8rem;
        margin-bottom: 18px;
      }
      .mode-card h3 {
        font-family: var(--font-display);
        font-size: 1.8rem;
        font-weight: 900;
        margin: 0 0 12px;
      }
      .mode-card p {
        color: var(--text-muted);
        font-size: 0.92rem;
        line-height: 1.65;
        margin: 0 0 28px;
        max-width: 340px;
      }
      .mode-btn {
        display: inline-flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.06);
        color: var(--text);
        padding: 11px 22px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.85rem;
        text-decoration: none;
        border: 1px solid var(--border);
        transition:
          background 0.2s,
          border-color 0.2s;
      }
      .mode-btn:hover {
        background: var(--orange);
        border-color: var(--orange);
      }

      /* ═══════════════════════════════════════════
       FOOTER CTA
    ═══════════════════════════════════════════ */
      .footer-cta {
        position: relative;
        background: var(--orange);
        padding: 90px 0;
        overflow: hidden;
      }
      .fc-grain {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
        pointer-events: none;
      }
      .fc-inner {
        position: relative;
        z-index: 1;
        text-align: center;
      }
      .footer-cta h2 {
        font-family: var(--font-display);
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 900;
        color: #fff;
        line-height: 1.1;
        margin: 0 0 40px;
      }
      .footer-cta .accent {
        color: rgba(255, 255, 255, 0.5);
      }
      .fc-actions {
        display: flex;
        gap: 14px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .footer-cta .cta-primary {
        background: #fff;
        color: var(--orange);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
      }
      .footer-cta .cta-primary:hover {
        background: #f5f5f5;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      .footer-cta .cta-ghost {
        color: rgba(255, 255, 255, 0.75);
        border-color: rgba(255, 255, 255, 0.25);
      }
      .footer-cta .cta-ghost:hover {
        color: #fff;
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.08);
      }

      /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
      @media (max-width: 900px) {
        .hero-inner {
          grid-template-columns: 1fr;
          gap: 48px;
        }
        .hero-visual {
          height: 300px;
        }
        .features-layout {
          grid-template-columns: 1fr;
          gap: 48px;
        }
        .modes-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .hero-inner {
          padding: 60px 20px 40px;
        }
        .hero-cta {
          flex-direction: column;
        }
        .hero-stats {
          flex-wrap: wrap;
          gap: 16px;
        }
        .badge-top,
        .badge-bot {
          display: none;
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

  marqueeItems = [
    'Authentic Flavors',
    'Indian Cuisine',
    'Chinese Cuisine',
    'Fresh Ingredients',
    'Dine In',
    'Takeaway',
    'Chef Crafted',
    'Top Rated',
    'Legendary Service',
    'Daily Fresh',
  ];

  features = [
    {
      icon: '🔥',
      title: 'Crafted with Fire',
      desc: 'Every dish is cooked fresh to order with premium ingredients and real passion.',
    },
    {
      icon: '⚡',
      title: 'Lightning Fast Service',
      desc: 'From order to table in minutes. We respect your time as much as your taste.',
    },
    {
      icon: '🌿',
      title: 'Always Fresh',
      desc: 'Daily sourced ingredients. No shortcuts, no compromises, ever.',
    },
    {
      icon: '👨‍🍳',
      title: 'Expert Chefs',
      desc: 'Masters of Indian and Chinese culinary traditions with decades of experience.',
    },
    {
      icon: '📱',
      title: 'Easy Ordering',
      desc: 'Order online, choose your table or takeaway, and track everything in real time.',
    },
  ];

  positiveReviews = [
    {
      name: 'Rohit S.',
      rating: 5,
      comment:
        "Absolutely incredible food. The butter chicken was the best I've had in years — rich, creamy, perfectly spiced. Will definitely be back!",
      tag: 'Regular Guest',
      date: 'March 2025',
    },
    {
      name: 'Priya M.',
      rating: 5,
      comment:
        'Loved the ambiance and the service was super fast. The Manchurian gravy was spot on — better than any Chinese place nearby.',
      tag: 'Dine-in Guest',
      date: 'February 2025',
    },
    {
      name: 'Aakash T.',
      rating: 5,
      comment:
        'Ordered takeaway and the food was still piping hot when I got home. Packaging is great and portions are generous. Highly recommend!',
      tag: 'Takeaway Order',
      date: 'March 2025',
    },
    {
      name: 'Sneha R.',
      rating: 5,
      comment:
        'The starters platter is a must-try. Crispy, flavorful and the chutney was amazing. Great value for the price.',
      tag: 'First-time Guest',
      date: 'January 2025',
    },
    {
      name: 'Dev K.',
      rating: 4,
      comment:
        'Really enjoyed our family dinner here. Staff was warm and attentive. The paneer dishes were outstanding — soft and full of flavor.',
      tag: 'Family Dinner',
      date: 'March 2025',
    },
    {
      name: 'Meera J.',
      rating: 5,
      comment:
        'Killa lives up to its name! The biryani was fragrant and the chicken was tender. Every bite was a delight. 10/10 experience.',
      tag: 'Regular Guest',
      date: 'February 2025',
    },
  ];

  ngOnInit() {
    this.loadRecommendations();
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
    const variant = item.pricing.type === 'SINGLE' ? 'SINGLE' : 'HALF';
    this.cartService.addToCart(item, variant);
    this.toast.show(`${item.name} added to cart!`, 'success');
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
