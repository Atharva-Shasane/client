import { Component, inject, signal, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
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
            <!-- Standard Menu Links (Public) -->
            <li><a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a></li>
            <li><a routerLink="/menu" routerLinkActive="active" (click)="closeMenu()">Menu</a></li>

            <!-- General Authenticated Links (Visible to both USER and OWNER) -->
            <ng-container *ngIf="authService.isLoggedIn()">
              <li>
                <a routerLink="/my-orders" routerLinkActive="active" (click)="closeMenu()">Orders</a>
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
                  routerLink="/owner/dashboard"
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
                <!-- Fixed Greeting: Accessing currentUser as a Signal with () -->
                <span class="user-greeting">
                  Hi, {{ (authService.currentUser()?.name || '').split(' ')[0] || 'User' }}
                </span>
                <button (click)="handleLogout()" class="btn-logout">Logout</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Toggle Trigger -->
        <button class="menu-toggle" (click)="toggleMenu()" [attr.aria-expanded]="isMenuOpen()" aria-label="Toggle Menu">
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
        --primary-hover: #e65c00;
        --bg-dark: #0a0a0a;
        --glass-bg: rgba(10, 10, 10, 0.9);
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
        background: transparent;
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
        transition: transform 0.3s ease;
      }
      .brand-logo:hover {
        transform: scale(1.02);
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
        font-size: 0.85rem;
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

      .nav-links li a.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: var(--primary);
        border-radius: 2px;
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

      .cart-anchor {
        text-decoration: none;
      }

      .cart-pill {
        position: relative;
        background: rgba(255, 255, 255, 0.05);
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        transition: 0.3s;
        border: 1px solid var(--border-white);
      }
      .cart-pill:hover {
        background: var(--primary);
        transform: translateY(-2px);
        border-color: var(--primary);
      }
      .cart-ico {
        font-size: 1.2rem;
      }

      .cart-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--primary);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 900;
        min-width: 20px;
        height: 20px;
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
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.8rem;
        cursor: pointer;
        transition: 0.3s;
        border: none;
        text-transform: uppercase;
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
        background: var(--primary-hover);
        box-shadow: 0 10px 25px rgba(255, 102, 0, 0.4);
      }

      .user-control {
        display: flex;
        align-items: center;
        gap: 15px;
        padding-left: 15px;
        border-left: 1px solid var(--border-white);
      }
      .user-greeting {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }
      .btn-logout {
        background: rgba(255, 68, 68, 0.1);
        border: 1px solid rgba(255, 68, 68, 0.2);
        color: #ff4444;
        font-weight: 800;
        cursor: pointer;
        text-transform: uppercase;
        font-size: 0.7rem;
        padding: 6px 14px;
        border-radius: 50px;
        transition: 0.2s;
      }
      .btn-logout:hover {
        background: #ff4444;
        color: #fff;
        border-color: #ff4444;
      }

      /* Mobile Interaction Elements */
      .menu-toggle {
        display: none;
        background: none;
        border: none;
        padding: 10px;
        cursor: pointer;
        z-index: 3005;
      }

      .burger-lines {
        width: 26px;
        height: 18px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .burger-lines span {
        display: block;
        width: 100%;
        height: 2px;
        background: #fff;
        border-radius: 10px;
        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .burger-lines.is-open span:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
      }
      .burger-lines.is-open span:nth-child(2) {
        opacity: 0;
        transform: translateX(-10px);
      }
      .burger-lines.is-open span:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
      }

      .nav-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
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
        .killa-navbar { padding: 0 20px; }
        .nav-content { gap: 30px; }
        .nav-links { gap: 20px; }
      }

      @media (max-width: 1000px) {
        .menu-toggle { display: block; }

        .nav-content {
          position: fixed;
          top: 0;
          right: -100%;
          width: 80%;
          max-width: 350px;
          height: 100vh;
          background: #080808;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 100px 30px 60px;
          gap: 30px;
          transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3001;
          box-shadow: -15px 0 50px rgba(0, 0, 0, 0.9);
          overflow-y: auto;
        }

        .nav-content.mobile-active { right: 0; }

        .nav-links {
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          gap: 5px;
        }
        .nav-links li { width: 100%; }
        .nav-links li a {
          font-size: 1.2rem;
          padding: 15px 0;
          display: block;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nav-links li a.active::after { display: none; }

        .admin-link {
          background: rgba(243, 156, 18, 0.05);
          padding-left: 15px !important;
          border-radius: 8px;
          margin-top: 5px;
        }

        .nav-separator { display: none; }

        .nav-actions {
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          gap: 25px;
          padding-top: 25px;
          border-top: 1px solid var(--border-white);
        }
        .auth-section {
          flex-direction: column;
          width: 100%;
          gap: 15px;
        }
        .btn-auth, .user-control { width: 100%; }
        .user-control {
          flex-direction: column;
          align-items: flex-start;
          border-left: none;
          padding-left: 0;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  router = inject(Router);

  isScrolled = signal(false);
  isMenuOpen = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

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
    // Corrected: Access currentUser Signal with ()
    return this.authService.currentUser()?.role === 'OWNER';
  }

  handleLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.closeMenu();
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        console.error('Logout error:', err);
        this.closeMenu();
        this.router.navigate(['/home']);
      }
    });
  }
}