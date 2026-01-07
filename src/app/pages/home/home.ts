import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="hero-section">
      <div class="overlay"></div>
      <div class="content">
        <h1>Taste the <span class="highlight">Legend</span></h1>
        <p>Authentic flavors, premium ingredients, and a vibe that kills.</p>
        <a routerLink="/menu" class="cta-button">Order Now</a>
      </div>
    </div>

    <div class="features-container">
      <div class="feature-card">
        <div class="icon">🔥</div>
        <h3>Fresh & Hot</h3>
        <p>Served straight from the kitchen to your soul.</p>
      </div>
      <div class="feature-card">
        <div class="icon">🚀</div>
        <h3>Fast Delivery</h3>
        <p>We respect your hunger. No delays.</p>
      </div>
      <div class="feature-card">
        <div class="icon">💎</div>
        <h3>Premium Quality</h3>
        <p>Only the best ingredients make the cut.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .hero-section {
        position: relative;
        height: 70vh;
        background: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')
          center/cover;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
      }
      .overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
      }
      .content {
        position: relative;
        z-index: 1;
        max-width: 800px;
        padding: 0 20px;
      }

      h1 {
        font-size: 4rem;
        margin-bottom: 1rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .highlight {
        color: #ff6b00;
      }

      p {
        font-size: 1.5rem;
        margin-bottom: 2.5rem;
        color: #ddd;
      }

      .cta-button {
        padding: 15px 45px;
        background: #ff6b00;
        color: white;
        text-decoration: none;
        font-size: 1.2rem;
        font-weight: bold;
        border-radius: 50px;
        transition: all 0.2s;
        display: inline-block;
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
      }

      .cta-button:hover {
        transform: translateY(-2px);
        background: #e65100;
        box-shadow: 0 6px 20px rgba(255, 107, 0, 0.6);
      }

      .features-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
        padding: 4rem 2rem;
        background: #f9f9f9;
      }

      .feature-card {
        background: white;
        padding: 2.5rem;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        transition: 0.3s;
      }

      .feature-card:hover {
        transform: translateY(-5px);
      }

      .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h3 {
        margin-bottom: 0.5rem;
        color: #333;
      }

      @media (max-width: 768px) {
        h1 {
          font-size: 2.5rem;
        }
        p {
          font-size: 1.1rem;
        }
      }
    `,
  ],
})
export class HomeComponent {}
