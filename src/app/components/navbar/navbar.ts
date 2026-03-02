import { Component, inject, signal, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Main Navigation Bar -->
    <nav class="killa-navbar" [class.scrolled]="isScrolled()">
      <div class="nav-container">
        <!-- Brand Logo -->
        <div class="logo-area">
          <a routerLink="/home" class="brand-logo" (click)="closeMenu()">
            <span class="highlight-k">K</span>ILLA <span class="dim">RESTO</span>
          </a>
        </div>

        <!-- Desktop & Mobile Link Container -->
        <div class="nav-content" [class.mobile-active]="isMenuOpen()">
          <ul class="nav-links">
            <!-- Standard Menu Links -->
            <li><a routerLink="/home" routerLinkActive="active" (click)="closeMenu()">Home</a></li>
            <li><a routerLink="/menu" routerLinkActive="active" (click)="closeMenu()">Menu</a></li>

            <!-- Customer Specific -->
            <ng-container *ngIf="authService.isLoggedIn()">
              <li>
                <a routerLink="/my-orders" routerLinkActive="active" (click)="closeMenu()"
                  >Orders</a
                >
              </li>
              <li>
                <a routerLink="/profile" routerLinkActive="active" (click)="closeMenu()">Profile</a>
              </li>
            </ng-container>

            <!-- Owner Specific: Restricted access visibility -->
            <ng-container *ngIf="isOwner()">
              <li class="nav-separator"></li>
              <li>
                <a
                  routerLink="/owner"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="admin-link"
                  (click)="closeMenu()"
                  >Kitchen</a
                >
              </li>
              <li>
                <a
                  routerLink="/owner/analytics"
                  routerLinkActive="active"
                  class="admin-link"
                  (click)="closeMenu()"
                  >Analytics</a
                >
              </li>
              <li>
                <a
                  routerLink="/owner/feedback"
                  routerLinkActive="active"
                  class="admin-link"
                  (click)="closeMenu()"
                  >Feedback</a
                >
              </li>
              <li>
                <a
                  routerLink="/owner/menu"
                  routerLinkActive="active"
                  class="admin-link"
                  (click)="closeMenu()"
                  >Manage Menu</a
                >
              </li>
            </ng-container>
          </ul>

          <div class="nav-actions">
            <!-- Cart Button -->
            <a routerLink="/cart" class="cart-anchor" (click)="closeMenu()">
              <div class="cart-pill">
                <span class="cart-ico">🛒</span>
                <span class="cart-count" *ngIf="cartService.totalItems() > 0">{{
                  cartService.totalItems()
                }}</span>
              </div>
            </a>

            <!-- Auth Controls -->
            <div class="auth-section">
              <ng-container *ngIf="!authService.isLoggedIn()">
                <button routerLink="/login" class="btn-auth btn-login" (click)="closeMenu()">
                  Login
                </button>
                <button routerLink="/register" class="btn-auth btn-join" (click)="closeMenu()">
                  Join Now
                </button>
              </ng-container>

              <div *ngIf="authService.isLoggedIn()" class="user-control">
                <span class="user-greeting"
                  >Hi, {{ (authService.currentUser()?.name || '').split(' ')[0] }}</span
                >
                <button (click)="handleLogout()" class="btn-logout">Logout</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Toggle Trigger -->
        <button class="menu-toggle" (click)="toggleMenu()" [attr.aria-expanded]="isMenuOpen()">
          <div class="burger-lines" [class.is-open]="isMenuOpen()">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
    </nav>

    <!-- Visual Backdrop for Mobile Drawer -->
    <div class="nav-backdrop" [class.visible]="isMenuOpen()" (click)="closeMenu()"></div>
  `,
  styles: [
    `
      :host {
        --primary: #ff6600;
        --bg-dark: #0a0a0a;
        --glass-bg: rgba(10, 10, 10, 0.85);
        --border-white: rgba(255, 255, 255, 0.08);
        --nav-height: 90px;
        --nav-compact: 75px;
      }

      /* Fixed Navbar Base */
      .killa-navbar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: var(--nav-height);
        display: flex;
        align-items: center;
        z-index: 3000;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border-bottom: 1px solid transparent;
        padding: 0 40px;
      }

      .killa-navbar.scrolled {
        height: var(--nav-compact);
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--border-white);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      }

      .nav-container {
        width: 100%;
        max-width: 1500px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      /* Logo Branding */
      .brand-logo {
        font-size: 1.8rem;
        font-weight: 900;
        color: #fff;
        text-decoration: none;
        letter-spacing: -1px;
        display: flex;
        align-items: center;
        z-index: 3002;
      }
      .highlight-k {
        color: var(--primary);
      }
      .dim {
        color: #fff;
        opacity: 0.9;
      }

      /* Main Content Wrapper */
      .nav-content {
        display: flex;
        align-items: center;
        gap: 50px;
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 30px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .nav-links li a {
        color: #aaa;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: 0.3s;
        padding: 10px 0;
        position: relative;
      }

      .nav-links li a:hover,
      .nav-links li a.active {
        color: var(--primary);
      }

      .admin-link {
        color: #f39c12 !important;
        font-weight: 800 !important;
      }

      .nav-separator {
        width: 1px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 10px;
      }

      /* Action Zone */
      .nav-actions {
        display: flex;
        align-items: center;
        gap: 30px;
      }

      .cart-pill {
        position: relative;
        background: rgba(255, 255, 255, 0.05);
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        transition: 0.3s;
        border: 1px solid var(--border-white);
      }
      .cart-pill:hover {
        background: var(--primary);
        transform: translateY(-2px);
        border-color: var(--primary);
      }
      .cart-ico {
        font-size: 1.4rem;
      }

      .cart-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--primary);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 900;
        min-width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--bg-dark);
        box-shadow: 0 4px 10px rgba(255, 102, 0, 0.4);
      }

      /* Auth Styling */
      .auth-section {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .btn-auth {
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 0.85rem;
        cursor: pointer;
        transition: 0.3s;
        border: none;
      }
      .btn-login {
        background: transparent;
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .btn-join {
        background: var(--primary);
        color: #fff;
        box-shadow: 0 4px 15px rgba(255, 102, 0, 0.2);
      }
      .btn-login:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: #fff;
      }
      .btn-join:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(255, 102, 0, 0.4);
      }

      .user-control {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .user-greeting {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }
      .btn-logout {
        background: none;
        border: none;
        color: #ff4444;
        font-weight: 800;
        cursor: pointer;
        text-transform: uppercase;
        font-size: 0.75rem;
        padding: 5px 10px;
        border-radius: 50px;
        transition: 0.2s;
      }
      .btn-logout:hover {
        background: rgba(255, 68, 68, 0.1);
      }

      /* Mobile Interaction Elements */
      .menu-toggle {
        display: none;
        background: none;
        border: none;
        padding: 15px;
        cursor: pointer;
        z-index: 3005;
      }

      .burger-lines {
        width: 28px;
        height: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .burger-lines span {
        display: block;
        width: 100%;
        height: 3px;
        background: #fff;
        border-radius: 10px;
        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .burger-lines.is-open span:nth-child(1) {
        transform: translateY(8.5px) rotate(45deg);
      }
      .burger-lines.is-open span:nth-child(2) {
        opacity: 0;
        transform: translateX(-20px);
      }
      .burger-lines.is-open span:nth-child(3) {
        transform: translateY(-8.5px) rotate(-45deg);
      }

      .nav-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(12px);
        z-index: 2900;
        opacity: 0;
        visibility: hidden;
        transition: 0.4s;
      }
      .nav-backdrop.visible {
        opacity: 1;
        visibility: visible;
      }

      /* RESPONSIVE BREAKPOINTS */
      @media (max-width: 1200px) {
        .killa-navbar {
          padding: 0 20px;
        }
        .nav-content {
          gap: 30px;
        }
        .nav-links {
          gap: 15px;
        }
        .nav-links li a {
          font-size: 0.8rem;
        }
      }

      @media (max-width: 1000px) {
        .menu-toggle {
          display: block;
        }

        .nav-content {
          position: fixed;
          top: 0;
          right: -100%;
          width: 85%;
          max-width: 380px;
          height: 100vh;
          background: #080808;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 120px 40px 60px;
          gap: 40px;
          transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3001;
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.8);
          border-left: 1px solid var(--border-white);
          overflow-y: auto;
        }

        .nav-content.mobile-active {
          right: 0;
        }

        .nav-links {
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          gap: 10px;
        }
        .nav-links li {
          width: 100%;
        }
        .nav-links li a {
          font-size: 1.4rem;
          padding: 15px 0;
          display: block;
        }
        .nav-separator {
          display: none;
        }

        .admin-link {
          background: rgba(255, 165, 0, 0.05);
          padding-left: 20px !important;
          border-radius: 12px;
          border: 1px solid rgba(255, 165, 0, 0.1);
        }

        .nav-actions {
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          gap: 30px;
          padding-top: 30px;
          border-top: 1px solid var(--border-white);
        }
        .auth-section {
          flex-direction: column;
          width: 100%;
          gap: 12px;
        }
        .btn-auth,
        .user-control {
          width: 100%;
        }
        .btn-auth {
          padding: 18px;
          font-size: 1rem;
        }
        .user-control {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);

  isScrolled = signal(false);
  isMenuOpen = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  // Effect to lock scrolling when menu is open
  constructor() {
    effect(() => {
      if (this.isMenuOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }
  closeMenu() {
    this.isMenuOpen.set(false);
  }

  isOwner() {
    return this.authService.currentUser()?.role === 'OWNER';
  }

  handleLogout() {
    this.authService.logout();
    this.closeMenu();
  }
}
