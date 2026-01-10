import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.scrolled]="isScrolled()">
      <div class="nav-container">
        <!-- Logo -->
        <div class="logo">
          <a routerLink="/home" (click)="closeMenu()">
            KILLA <span class="highlight">RESTO</span>
          </a>
        </div>

        <!-- Mobile Toggle Button -->
        <button class="menu-toggle" (click)="toggleMenu()" aria-label="Toggle Menu">
          <div class="bar" [class.open]="isMenuOpen()"></div>
          <div class="bar" [class.open]="isMenuOpen()"></div>
          <div class="bar" [class.open]="isMenuOpen()"></div>
        </button>

        <!-- Nav Links -->
        <div class="nav-content" [class.mobile-open]="isMenuOpen()">
          <div class="links">
            <a routerLink="/home" routerLinkActive="active" (click)="closeMenu()">Home</a>
            <a routerLink="/menu" routerLinkActive="active" (click)="closeMenu()">Menu</a>
            <a
              *ngIf="authService.isLoggedIn()"
              routerLink="/my-orders"
              routerLinkActive="active"
              (click)="closeMenu()"
              >My Orders</a
            >

            <ng-container *ngIf="isOwner()">
              <div class="divider"></div>
              <a
                routerLink="/owner"
                routerLinkActive="active"
                (click)="closeMenu()"
                class="owner-link"
                >Dashboard</a
              >
              <a
                routerLink="/owner/menu"
                routerLinkActive="active"
                (click)="closeMenu()"
                class="owner-link"
                >Manage Menu</a
              >
            </ng-container>
          </div>

          <div class="actions">
            <a routerLink="/cart" routerLinkActive="active" class="cart-btn" (click)="closeMenu()">
              <span class="icon">🛒</span>
              <span class="badge" *ngIf="cartService.totalItems() > 0">{{
                cartService.totalItems()
              }}</span>
            </a>

            <ng-container *ngIf="!authService.isLoggedIn()">
              <a routerLink="/login" class="btn-login" (click)="closeMenu()">Login</a>
              <a routerLink="/register" class="join-btn" (click)="closeMenu()">Join Now</a>
            </ng-container>

            <div *ngIf="authService.isLoggedIn()" class="user-pill">
              <a routerLink="/profile" (click)="closeMenu()" class="user-name">
                {{ (authService.currentUser()?.name || '').split(' ')[0] }}
              </a>
              <button (click)="authService.logout()" class="logout-icon" title="Logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Overlay for mobile drawer -->
    <div class="nav-overlay" *ngIf="isMenuOpen()" (click)="closeMenu()"></div>
  `,
  styles: [
    `
      .navbar {
        height: 80px;
        display: flex;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 2000;
        background: rgba(10, 10, 10, 0.8);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: 0.3s;
      }
      .nav-container {
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .logo a {
        font-size: 1.5rem;
        font-weight: 900;
        color: white;
        text-decoration: none;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6600;
      }

      .nav-content {
        display: flex;
        align-items: center;
        gap: 40px;
      }
      .links {
        display: flex;
        gap: 28px;
        align-items: center;
      }
      .links a {
        color: #aaa;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .links a:hover,
      .links a.active {
        color: #ff6600;
      }

      .owner-link {
        color: #f39c12 !important;
        font-weight: 800 !important;
      }
      .divider {
        width: 1px;
        height: 20px;
        background: #333;
        margin: 0 10px;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .cart-btn {
        position: relative;
        font-size: 1.3rem;
        text-decoration: none;
        background: rgba(255, 255, 255, 0.05);
        width: 45px;
        height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        transition: 0.2s;
      }
      .cart-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff6600;
        color: white;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 800;
        border: 2px solid #111;
      }

      .btn-login {
        color: white;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .join-btn {
        background: #ff6600;
        color: white;
        text-decoration: none;
        padding: 10px 24px;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.9rem;
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.2);
      }

      .user-pill {
        background: #222;
        padding: 6px 16px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #333;
      }
      .user-name {
        color: white;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.9rem;
      }
      .logout-icon {
        background: none;
        border: none;
        color: #ff4444;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      /* Mobile Toggle */
      .menu-toggle {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        flex-direction: column;
        gap: 6px;
        padding: 10px;
      }
      .bar {
        width: 25px;
        height: 2px;
        background: white;
        transition: 0.3s;
      }
      .bar.open:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
      }
      .bar.open:nth-child(2) {
        opacity: 0;
      }
      .bar.open:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
      }

      @media (max-width: 1100px) {
        .menu-toggle {
          display: flex;
        }
        .nav-content {
          position: fixed;
          top: 0;
          right: -100%;
          height: 100vh;
          width: 300px;
          background: #0a0a0a;
          flex-direction: column;
          padding: 100px 30px;
          transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          align-items: flex-start;
          gap: 40px;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
        }
        .nav-content.mobile-open {
          right: 0;
        }
        .links {
          flex-direction: column;
          width: 100%;
          align-items: flex-start;
        }
        .links a {
          font-size: 1.2rem;
          width: 100%;
          padding-bottom: 15px;
          border-bottom: 1px solid #222;
        }
        .actions {
          flex-direction: column;
          width: 100%;
          align-items: flex-start;
          gap: 25px;
        }
        .nav-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          z-index: 1500;
        }
        .divider {
          display: none;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  isMenuOpen = signal(false);
  isScrolled = signal(false);

  toggleMenu() {
    this.isMenuOpen.set(!this.isMenuOpen());
  }
  closeMenu() {
    this.isMenuOpen.set(false);
  }
  isOwner() {
    return this.authService.currentUser()?.role === 'OWNER';
  }
}
