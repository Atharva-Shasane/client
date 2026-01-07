import { Component, inject } from '@angular/core';
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
      <div class="logo">
        <a routerLink="/home">KILLA <span class="highlight">RESTO</span></a>
      </div>

      <!-- Desktop Navigation -->
      <div class="nav-links">
        <a routerLink="/home" routerLinkActive="active">Home</a>
        <a routerLink="/menu" routerLinkActive="active">Menu</a>

        <!-- User Links -->
        <a *ngIf="authService.isLoggedIn()" routerLink="/my-orders" routerLinkActive="active"
          >My Orders</a
        >

        <!-- ✅ OWNER LINKS (Only visible to Owner) -->
        <ng-container *ngIf="isOwner()">
          <a routerLink="/owner" routerLinkActive="active" class="owner-link">Dashboard</a>
          <a routerLink="/owner/menu" routerLinkActive="active" class="owner-link">Manage Menu</a>
        </ng-container>

        <a routerLink="/cart" routerLinkActive="active" class="cart-link">
          Cart
          <span class="badge" *ngIf="cartService.totalItems() > 0">
            {{ cartService.totalItems() }}
          </span>
        </a>
      </div>

      <!-- Auth Buttons -->
      <div class="auth-buttons">
        <ng-container *ngIf="!authService.isLoggedIn()">
          <a routerLink="/login" class="btn btn-outline">Login</a>
          <a routerLink="/register" class="btn btn-primary">Register</a>
        </ng-container>

        <div *ngIf="authService.isLoggedIn()" class="user-info">
          <!-- Name is a link to Profile -->
          <a routerLink="/profile" class="profile-link">
            Hi, {{ authService.currentUser()?.name }}
            <span *ngIf="isOwner()" class="role-tag">(Owner)</span>
          </a>
          <button (click)="authService.logout()" class="btn btn-sm">Logout</button>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: #1a1a1a;
        color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .logo a {
        font-size: 1.5rem;
        font-weight: 800;
        text-decoration: none;
        color: white;
        letter-spacing: 1px;
      }
      .highlight {
        color: #ff6b00;
      }

      .nav-links {
        display: flex;
        gap: 2rem;
        align-items: center;
      }
      .nav-links a {
        text-decoration: none;
        color: #ccc;
        font-weight: 500;
        transition: 0.3s;
        position: relative;
        cursor: pointer;
      }
      .nav-links a:hover,
      .nav-links a.active {
        color: #ff6b00;
      }

      .owner-link {
        color: #f39c12 !important;
      } /* distinct color for owner links */
      .owner-link:hover {
        color: #e67e22 !important;
      }

      .cart-link {
        position: relative;
      }
      .badge {
        background: #ff6b00;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.7rem;
        position: absolute;
        top: -8px;
        right: -12px;
      }

      .auth-buttons {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .btn {
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: 0.3s;
        font-size: 0.9rem;
      }

      .btn-primary {
        background: #ff6b00;
        color: white;
      }
      .btn-primary:hover {
        background: #e65100;
      }

      .btn-outline {
        border: 1px solid #666;
        color: white;
      }
      .btn-outline:hover {
        border-color: #ff6b00;
        color: #ff6b00;
      }

      .btn-sm {
        padding: 4px 10px;
        font-size: 0.8rem;
        margin-left: 10px;
        background: #333;
        color: #fff;
      }
      .btn-sm:hover {
        background: #ff4444;
      }

      .user-info {
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        color: #aaa;
        gap: 10px;
      }

      /* Profile Link Style */
      .profile-link {
        color: white;
        text-decoration: none;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .profile-link:hover {
        color: #ff6b00;
        text-decoration: underline;
      }
      .role-tag {
        font-size: 0.7rem;
        background: #f39c12;
        color: #000;
        padding: 1px 4px;
        border-radius: 4px;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
        }
        .nav-links {
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);

  // Helper to check role
  isOwner() {
    const user = this.authService.currentUser();
    return user && user.role === 'OWNER';
  }
}
