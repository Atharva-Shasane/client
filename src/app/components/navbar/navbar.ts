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
    <nav class="navbar">
      <div class="nav-container">
        <!-- Logo -->
        <div class="logo">
          <a routerLink="/home" (click)="closeMenu()"
            >KILLA <span class="highlight">Restaurant</span></a
          >
        </div>

        <!-- Mobile Toggle Button -->
        <button class="menu-toggle" (click)="toggleMenu()" aria-label="Toggle Menu">
          <div class="bar" [class.open]="isMenuOpen()"></div>
          <div class="bar" [class.open]="isMenuOpen()"></div>
          <div class="bar" [class.open]="isMenuOpen()"></div>
        </button>

        <!-- Nav Links (Desktop + Mobile Drawer) -->
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
              <a routerLink="/register" class="btn btn-primary" (click)="closeMenu()">Join</a>
            </ng-container>

            <div *ngIf="authService.isLoggedIn()" class="user-pill">
              <a routerLink="/profile" (click)="closeMenu()">
                Hi, {{ (authService.currentUser()?.name || '').split(' ')[0] }}
              </a>
              <button (click)="authService.logout()" class="logout-icon" title="Logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <!-- Overlay for mobile -->
    <div class="nav-overlay" *ngIf="isMenuOpen()" (click)="closeMenu()"></div>
  `,
  styles: [
    `
      .navbar {
        background: #1a1a1a;
        height: 80px;
        display: flex;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 2000;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      }
      .nav-container {
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .logo a {
        font-size: 1.6rem;
        font-weight: 800;
        color: white;
        text-decoration: none;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6b00;
      }

      .nav-content {
        display: flex;
        align-items: center;
        gap: 40px;
      }
      .links {
        display: flex;
        gap: 25px;
      }
      .links a {
        color: #aaa;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        transition: 0.3s;
      }
      .links a:hover,
      .links a.active {
        color: #ff6b00;
      }
      .owner-link {
        color: #f39c12 !important;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .cart-btn {
        position: relative;
        font-size: 1.4rem;
        text-decoration: none;
      }
      .badge {
        position: absolute;
        top: -5px;
        right: -10px;
        background: #ff6b00;
        color: white;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: bold;
      }

      .btn-login {
        color: white;
        text-decoration: none;
        font-weight: 600;
      }
      .user-pill {
        background: #333;
        padding: 5px 15px;
        border-radius: 30px;
        display: flex;
        align-items: center;
        gap: 15px;
        color: white;
      }
      .user-pill a {
        color: white;
        text-decoration: none;
        font-weight: bold;
      }
      .logout-icon {
        background: none;
        border: none;
        color: #ff4444;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: bold;
      }

      /* Mobile Styles */
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
        height: 3px;
        background: white;
        transition: 0.3s;
        border-radius: 2px;
      }

      @media (max-width: 1024px) {
        .menu-toggle {
          display: flex;
        }
        .nav-content {
          position: fixed;
          top: 0;
          right: -100%;
          height: 100vh;
          width: 280px;
          background: #111;
          flex-direction: column;
          padding: 100px 30px;
          transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          align-items: flex-start;
          gap: 50px;
        }
        .nav-content.mobile-open {
          right: 0;
        }
        .links {
          flex-direction: column;
          width: 100%;
        }
        .links a {
          font-size: 1.2rem;
          width: 100%;
          padding-bottom: 10px;
          border-bottom: 1px solid #222;
        }
        .actions {
          flex-direction: column;
          width: 100%;
          align-items: flex-start;
        }
        .nav-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1500;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  isMenuOpen = signal(false);

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
