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
    <!-- ═══════════════════════════════════════════
         NAVBAR
    ═══════════════════════════════════════════ -->
    <nav class="killa-nav" [class.nav-scrolled]="isScrolled()" [class.nav-hidden]="isHidden()">
      <div class="nav-shell">

        <!-- ── LOGO ── -->
        <a routerLink="/home" class="nav-logo" (click)="closeMenu()">
          <span class="logo-k">K</span><span class="logo-rest">ILLA</span>
          <span class="logo-divider"></span>
          <span class="logo-sub">RESTO</span>
        </a>

        <!-- ── DESKTOP LINKS ── -->
        <div class="nav-links-wrap">
          <!-- Public links -->
          <a routerLink="/home"
             routerLinkActive="link-active"
             [routerLinkActiveOptions]="{exact: true}"
             class="nav-link">Home</a>
          <a routerLink="/menu"
             routerLinkActive="link-active"
             class="nav-link">Menu</a>

          <!-- Logged-in user links -->
          <ng-container *ngIf="authService.isLoggedIn() && !isOwner()">
            <a routerLink="/my-orders"
               routerLinkActive="link-active"
               class="nav-link">Orders</a>
            <a routerLink="/profile"
               routerLinkActive="link-active"
               class="nav-link">Profile</a>
          </ng-container>

          <!-- Owner divider + links -->
          <ng-container *ngIf="isOwner()">
            <span class="nav-sep"></span>
            <a routerLink="/owner/dashboard"
               routerLinkActive="link-active"
               [routerLinkActiveOptions]="{exact: true}"
               class="nav-link owner-link">
              <span class="owner-dot"></span>Kitchen
            </a>
            <a routerLink="/owner/analytics"
               routerLinkActive="link-active"
               class="nav-link owner-link">Analytics</a>
            <a routerLink="/owner/feedback"
               routerLinkActive="link-active"
               class="nav-link owner-link">Feedback</a>
            <a routerLink="/owner/menu"
               routerLinkActive="link-active"
               class="nav-link owner-link">Manage Menu</a>
          </ng-container>
        </div>

        <!-- ── RIGHT ACTIONS ── -->
        <div class="nav-actions">

          <!-- Cart -->
          <a routerLink="/cart" class="cart-btn" (click)="closeMenu()" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span class="cart-badge" *ngIf="cartService.totalItems() > 0">
              {{ cartService.totalItems() > 9 ? '9+' : cartService.totalItems() }}
            </span>
          </a>

          <!-- Guest auth buttons -->
          <ng-container *ngIf="!authService.isLoggedIn()">
            <a routerLink="/login" class="btn-login">Login</a>
            <a routerLink="/register" class="btn-join">
              Join Now
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </ng-container>

          <!-- Logged-in user pill -->
          <div *ngIf="authService.isLoggedIn()" class="user-pill" (click)="toggleUserMenu()" [class.pill-open]="isUserMenuOpen()">
            <div class="user-avatar">
              {{ getFirstLetter() }}
            </div>
            <span class="user-name">{{ getFirstName() }}</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>

            <!-- Dropdown -->
            <div class="user-dropdown" [class.dropdown-open]="isUserMenuOpen()">
              <div class="dropdown-header">
                <p class="dh-name">{{ authService.currentUser()?.name || 'User' }}</p>
                <p class="dh-email">{{ authService.currentUser()?.email || '' }}</p>
                <span class="dh-role" [class.role-owner]="isOwner()">
                  {{ isOwner() ? '★ Owner' : 'Guest' }}
                </span>
              </div>
              <div class="dropdown-items">
                <a routerLink="/my-orders" class="dd-item" (click)="closeAll()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                  My Orders
                </a>
                <a routerLink="/profile" class="dd-item" (click)="closeAll()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </a>
                <div class="dd-divider"></div>
                <button class="dd-item dd-logout" (click)="handleLogout()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile burger -->
          <button class="burger" (click)="toggleMenu()" [attr.aria-expanded]="isMenuOpen()" aria-label="Toggle menu">
            <div class="burger-icon" [class.burger-open]="isMenuOpen()">
              <span></span><span></span><span></span>
            </div>
          </button>
        </div>

      </div><!-- /nav-shell -->
    </nav>

    <!-- ═══════════════════════════════════════════
         MOBILE DRAWER
    ═══════════════════════════════════════════ -->
    <div class="mobile-backdrop" [class.backdrop-show]="isMenuOpen()" (click)="closeMenu()"></div>

    <div class="mobile-drawer" [class.drawer-open]="isMenuOpen()">
      <!-- Drawer header -->
      <div class="drawer-head">
        <span class="drawer-logo">
          <span class="logo-k">K</span>ILLA <span style="opacity:0.4">RESTO</span>
        </span>
        <button class="drawer-close" (click)="closeMenu()" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- Drawer user bar -->
      <div class="drawer-user" *ngIf="authService.isLoggedIn()">
        <div class="du-avatar">{{ getFirstLetter() }}</div>
        <div>
          <p class="du-name">{{ getFirstName() }}</p>
          <span class="du-role" [class.du-owner]="isOwner()">{{ isOwner() ? '★ Owner' : 'Member' }}</span>
        </div>
      </div>

      <!-- Drawer nav links -->
      <nav class="drawer-nav">
        <p class="drawer-section-label">Navigation</p>

        <a routerLink="/home" routerLinkActive="drawer-active" [routerLinkActiveOptions]="{exact:true}" class="drawer-link" (click)="closeMenu()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </a>
        <a routerLink="/menu" routerLinkActive="drawer-active" class="drawer-link" (click)="closeMenu()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
          Menu
        </a>

        <ng-container *ngIf="authService.isLoggedIn() && !isOwner()">
          <a routerLink="/my-orders" routerLinkActive="drawer-active" class="drawer-link" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            My Orders
          </a>
          <a routerLink="/profile" routerLinkActive="drawer-active" class="drawer-link" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </a>
        </ng-container>

        <!-- Owner section -->
        <ng-container *ngIf="isOwner()">
          <p class="drawer-section-label" style="margin-top: 20px;">Owner Panel</p>
          <a routerLink="/owner/dashboard" routerLinkActive="drawer-active" [routerLinkActiveOptions]="{exact:true}" class="drawer-link drawer-owner-link" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Kitchen
          </a>
          <a routerLink="/owner/analytics" routerLinkActive="drawer-active" class="drawer-link drawer-owner-link" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Analytics
          </a>
          <a routerLink="/owner/feedback" routerLinkActive="drawer-active" class="drawer-link drawer-owner-link" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Feedback
          </a>
          <a routerLink="/owner/menu" routerLinkActive="drawer-active" class="drawer-link drawer-owner-link" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
            Manage Menu
          </a>
        </ng-container>
      </nav>

      <!-- Drawer footer auth -->
      <div class="drawer-footer">
        <ng-container *ngIf="!authService.isLoggedIn()">
          <a routerLink="/login" class="drawer-btn-login" (click)="closeMenu()">Login</a>
          <a routerLink="/register" class="drawer-btn-join" (click)="closeMenu()">Join Now</a>
        </ng-container>
        <button *ngIf="authService.isLoggedIn()" class="drawer-btn-logout" (click)="handleLogout()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       DESIGN TOKENS — matches homepage palette
    ═══════════════════════════════════════════ */
    :host {
      --orange:       #ff6600;
      --orange-dim:   rgba(255,102,0,0.12);
      --orange-glow:  rgba(255,102,0,0.3);
      --surface:      #0d0d0d;
      --surface-2:    #111111;
      --surface-3:    #161616;
      --border:       rgba(255,255,255,0.07);
      --border-h:     rgba(255,255,255,0.13);
      --text:         #f0ede8;
      --text-muted:   #6b6b6b;
      --text-dim:     #3a3a3a;
      --owner-amber:  #f5a623;
      --h: 72px;
    }

    /* ═══════════════════════════════════════════
       BASE NAVBAR
    ═══════════════════════════════════════════ */
    .killa-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--h);
      z-index: 3000;
      transition: height 0.35s cubic-bezier(.4,0,.2,1),
                  background 0.35s,
                  box-shadow 0.35s,
                  transform 0.35s cubic-bezier(.4,0,.2,1);
      background: transparent;
    }

    /* Scrolled: glass pill effect */
    .nav-scrolled {
      height: 62px;
      background: rgba(10,10,10,0.88);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 8px 40px rgba(0,0,0,0.55);
    }

    /* Hide on scroll down */
    .nav-hidden {
      transform: translateY(-100%);
    }

    /* ── Shell ── */
    .nav-shell {
      height: 100%;
      max-width: 1360px;
      margin: 0 auto;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
    }

    /* ═══════════════════════════════════════════
       LOGO
    ═══════════════════════════════════════════ */
    .nav-logo {
      display: flex;
      align-items: center;
      gap: 0;
      text-decoration: none;
      font-weight: 900;
      font-size: 1.35rem;
      letter-spacing: -0.02em;
      color: var(--text);
      flex-shrink: 0;
      animation: logoSlideIn 0.6s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes logoSlideIn {
      from { opacity:0; transform:translateX(-16px); }
      to   { opacity:1; transform:translateX(0); }
    }
    .logo-k {
      color: var(--orange);
      font-size: 1.55rem;
      line-height: 1;
      transition: transform 0.25s;
    }
    .nav-logo:hover .logo-k {
      transform: scale(1.15) rotate(-3deg);
    }
    .logo-rest {
      letter-spacing: -0.02em;
    }
    .logo-divider {
      display: inline-block;
      width: 1px;
      height: 16px;
      background: var(--border-h);
      margin: 0 10px;
      vertical-align: middle;
    }
    .logo-sub {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    /* ═══════════════════════════════════════════
       DESKTOP NAV LINKS
    ═══════════════════════════════════════════ */
    .nav-links-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
      animation: navLinksIn 0.6s 0.15s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes navLinksIn {
      from { opacity:0; transform:translateY(-8px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .nav-link {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 13px;
      border-radius: 9px;
      text-decoration: none;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
      transition: color 0.2s, background 0.2s;
    }
    .nav-link:hover {
      color: var(--text);
      background: rgba(255,255,255,0.04);
    }
    .nav-link.link-active {
      color: var(--text);
    }
    /* Underline indicator */
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: 2px; left: 13px; right: 13px;
      height: 1.5px;
      background: var(--orange);
      border-radius: 2px;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.25s cubic-bezier(.4,0,.2,1);
    }
    .nav-link.link-active::after,
    .nav-link:hover::after {
      transform: scaleX(1);
    }

    /* Owner links */
    .owner-link {
      color: rgba(245,166,35,0.7) !important;
    }
    .owner-link:hover {
      color: var(--owner-amber) !important;
      background: rgba(245,166,35,0.06) !important;
    }
    .owner-link.link-active {
      color: var(--owner-amber) !important;
    }
    .owner-link::after { background: var(--owner-amber) !important; }

    .owner-dot {
      display: inline-block;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--owner-amber);
      box-shadow: 0 0 6px rgba(245,166,35,0.6);
      animation: ownerPulse 2s ease-in-out infinite;
    }
    @keyframes ownerPulse {
      0%,100% { box-shadow: 0 0 4px rgba(245,166,35,0.5); }
      50%      { box-shadow: 0 0 12px rgba(245,166,35,0.9); }
    }

    .nav-sep {
      display: inline-block;
      width: 1px; height: 20px;
      background: var(--border);
      margin: 0 8px;
    }

    /* ═══════════════════════════════════════════
       RIGHT ACTIONS
    ═══════════════════════════════════════════ */
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      animation: actionsIn 0.6s 0.25s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes actionsIn {
      from { opacity:0; transform:translateX(16px); }
      to   { opacity:1; transform:translateX(0); }
    }

    /* Cart */
    .cart-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px; height: 40px;
      border-radius: 10px;
      color: var(--text-muted);
      text-decoration: none;
      border: 1px solid var(--border);
      background: transparent;
      transition: color 0.2s, background 0.2s, border-color 0.2s, transform 0.2s;
    }
    .cart-btn:hover {
      color: var(--text);
      background: rgba(255,255,255,0.05);
      border-color: var(--border-h);
      transform: translateY(-1px);
    }
    .cart-badge {
      position: absolute;
      top: -7px; right: -7px;
      background: var(--orange);
      color: #fff;
      font-size: 0.6rem;
      font-weight: 900;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      border: 2px solid var(--surface);
      box-shadow: 0 2px 8px var(--orange-glow);
      animation: badgePop 0.3s cubic-bezier(.36,.07,.19,.97);
    }
    @keyframes badgePop {
      0%   { transform: scale(0); }
      70%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Guest auth buttons */
    .btn-login {
      display: inline-flex;
      align-items: center;
      padding: 9px 16px;
      border-radius: 9px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-decoration: none;
      color: var(--text-muted);
      border: 1px solid var(--border);
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .btn-login:hover {
      color: var(--text);
      border-color: var(--border-h);
      background: rgba(255,255,255,0.03);
    }

    .btn-join {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 9px;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-decoration: none;
      color: #fff;
      background: var(--orange);
      border: 1px solid transparent;
      box-shadow: 0 3px 16px var(--orange-glow);
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .btn-join:hover {
      background: #e55a00;
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(255,102,0,0.45);
    }

    /* ═══════════════════════════════════════════
       USER PILL + DROPDOWN
    ═══════════════════════════════════════════ */
    .user-pill {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      border-radius: 40px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      user-select: none;
    }
    .user-pill:hover,
    .pill-open {
      border-color: var(--border-h);
      background: var(--surface-3);
    }

    .user-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: var(--orange-dim);
      border: 1.5px solid rgba(255,102,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem;
      font-weight: 900;
      color: var(--orange);
      flex-shrink: 0;
    }
    .user-name {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text);
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chevron {
      color: var(--text-muted);
      transition: transform 0.25s;
    }
    .pill-open .chevron { transform: rotate(180deg); }

    /* Dropdown */
    .user-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 230px;
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      opacity: 0;
      transform: translateY(-8px) scale(0.97);
      transform-origin: top right;
      pointer-events: none;
      transition: opacity 0.22s, transform 0.22s cubic-bezier(.4,0,.2,1);
      z-index: 10;
    }
    .dropdown-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .dropdown-header {
      padding: 18px 18px 14px;
      border-bottom: 1px solid var(--border);
    }
    .dh-name {
      font-weight: 800;
      font-size: 0.88rem;
      color: var(--text);
      margin: 0 0 2px;
    }
    .dh-email {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin: 0 0 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dh-role {
      display: inline-block;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 20px;
      background: rgba(255,255,255,0.05);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .role-owner {
      background: rgba(245,166,35,0.1);
      color: var(--owner-amber);
      border-color: rgba(245,166,35,0.2);
    }

    .dropdown-items { padding: 8px; }
    .dd-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.18s, color 0.18s;
    }
    .dd-item:hover {
      background: rgba(255,255,255,0.04);
      color: var(--text);
    }
    .dd-divider {
      height: 1px;
      background: var(--border);
      margin: 6px 0;
    }
    .dd-logout {
      color: rgba(255,80,80,0.7);
    }
    .dd-logout:hover {
      background: rgba(255,80,80,0.08);
      color: #ff5050;
    }

    /* ═══════════════════════════════════════════
       BURGER
    ═══════════════════════════════════════════ */
    .burger {
      display: none;
      background: none;
      border: 1px solid var(--border);
      width: 40px; height: 40px;
      border-radius: 10px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s, background 0.2s;
      flex-shrink: 0;
    }
    .burger:hover {
      background: rgba(255,255,255,0.04);
      border-color: var(--border-h);
    }
    .burger-icon {
      display: flex;
      flex-direction: column;
      gap: 4.5px;
      width: 18px;
    }
    .burger-icon span {
      display: block;
      height: 1.5px;
      background: var(--text-muted);
      border-radius: 2px;
      transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s, width 0.3s;
    }
    .burger-icon span:nth-child(2) { width: 70%; }
    .burger-icon.burger-open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
    .burger-icon.burger-open span:nth-child(2) { opacity:0; transform: translateX(-6px); }
    .burger-icon.burger-open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); width:100%; }

    /* ═══════════════════════════════════════════
       MOBILE BACKDROP
    ═══════════════════════════════════════════ */
    .mobile-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      z-index: 2800;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.35s, visibility 0.35s;
    }
    .backdrop-show {
      opacity: 1;
      visibility: visible;
    }

    /* ═══════════════════════════════════════════
       MOBILE DRAWER
    ═══════════════════════════════════════════ */
    .mobile-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: min(340px, 90vw);
      background: var(--surface-2);
      border-left: 1px solid var(--border);
      z-index: 2900;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(.4,0,.2,1);
      box-shadow: -24px 0 80px rgba(0,0,0,0.7);
      overflow-y: auto;
    }
    .drawer-open { transform: translateX(0); }

    /* Drawer head */
    .drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .drawer-logo {
      font-weight: 900;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    .drawer-close {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px;
      border-radius: 8px;
      background: none;
      border: 1px solid var(--border);
      color: var(--text-muted);
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .drawer-close:hover { background: rgba(255,255,255,0.05); color: var(--text); }

    /* Drawer user bar */
    .drawer-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-3);
    }
    .du-avatar {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: var(--orange-dim);
      border: 2px solid rgba(255,102,0,0.25);
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 0.9rem; color: var(--orange);
      flex-shrink: 0;
    }
    .du-name {
      font-weight: 800; font-size: 0.9rem; color: var(--text); margin: 0 0 3px;
    }
    .du-role {
      font-size: 0.62rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 2px 8px; border-radius: 20px;
      background: rgba(255,255,255,0.05);
      color: var(--text-muted);
    }
    .du-owner { background: rgba(245,166,35,0.1); color: var(--owner-amber); }

    /* Drawer nav */
    .drawer-nav {
      flex: 1;
      padding: 16px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .drawer-section-label {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-dim);
      margin: 0 8px 8px;
    }
    .drawer-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: background 0.2s, color 0.2s;
    }
    .drawer-link:hover { background: rgba(255,255,255,0.04); color: var(--text); }
    .drawer-link svg { flex-shrink: 0; opacity: 0.6; transition: opacity 0.2s; }
    .drawer-link:hover svg { opacity: 1; }

    .drawer-active {
      color: var(--text) !important;
      background: rgba(255,255,255,0.04) !important;
    }
    .drawer-active svg { opacity: 1 !important; }
    /* Orange accent bar on active */
    .drawer-active::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 60%;
      background: var(--orange);
      border-radius: 0 2px 2px 0;
    }
    .drawer-link { position: relative; }

    .drawer-owner-link { color: rgba(245,166,35,0.65); }
    .drawer-owner-link:hover { color: var(--owner-amber) !important; background: rgba(245,166,35,0.05) !important; }
    .drawer-owner-link.drawer-active { color: var(--owner-amber) !important; }
    .drawer-owner-link.drawer-active::before { background: var(--owner-amber); }

    /* Drawer footer */
    .drawer-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
    }
    .drawer-btn-login {
      display: flex; align-items: center; justify-content: center;
      padding: 13px;
      border-radius: 12px;
      font-weight: 700; font-size: 0.85rem; text-transform: uppercase;
      text-decoration: none;
      color: var(--text-muted);
      border: 1px solid var(--border);
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .drawer-btn-login:hover { color: var(--text); border-color: var(--border-h); background: rgba(255,255,255,0.03); }

    .drawer-btn-join {
      display: flex; align-items: center; justify-content: center;
      padding: 13px;
      border-radius: 12px;
      font-weight: 800; font-size: 0.85rem; text-transform: uppercase;
      text-decoration: none;
      color: #fff;
      background: var(--orange);
      border: 1px solid transparent;
      box-shadow: 0 4px 20px var(--orange-glow);
      transition: background 0.2s, box-shadow 0.2s;
    }
    .drawer-btn-join:hover { background: #e55a00; box-shadow: 0 6px 28px rgba(255,102,0,0.45); }

    .drawer-btn-logout {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 13px;
      border-radius: 12px;
      font-weight: 700; font-size: 0.85rem; text-transform: uppercase;
      color: rgba(255,80,80,0.75);
      background: rgba(255,80,80,0.06);
      border: 1px solid rgba(255,80,80,0.15);
      cursor: pointer;
      width: 100%;
      transition: background 0.2s, color 0.2s, border-color 0.2s;
    }
    .drawer-btn-logout:hover { background: rgba(255,80,80,0.14); color: #ff5050; border-color: rgba(255,80,80,0.3); }

    /* ═══════════════════════════════════════════
       RESPONSIVE: hide/show elements
    ═══════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .nav-links-wrap { display: none; }
      .btn-login, .btn-join { display: none; }
      .user-pill .user-name { display: none; }
      .user-pill .chevron { display: none; }
      .user-pill { padding: 6px; border-radius: 50%; }
      .burger { display: flex; }
    }

    @media (max-width: 480px) {
      .nav-shell { padding: 0 16px; }
      .user-pill { display: none; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  router      = inject(Router);

  isScrolled   = signal(false);
  isHidden     = signal(false);
  isMenuOpen   = signal(false);
  isUserMenuOpen = signal(false);

  private lastScrollY = 0;

  @HostListener('window:scroll', [])
  onScroll() {
    const y = window.scrollY;
    this.isScrolled.set(y > 40);
    // Hide navbar on scroll down (after 120px), reveal on scroll up
    this.isHidden.set(y > 120 && y > this.lastScrollY && !this.isMenuOpen());
    this.lastScrollY = y;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    // Close user dropdown if clicking outside
    const target = e.target as HTMLElement;
    if (!target.closest('.user-pill')) {
      this.isUserMenuOpen.set(false);
    }
  }

  constructor() {
    effect(() => {
      document.body.style.overflow = this.isMenuOpen() ? 'hidden' : '';
    });
  }

  toggleMenu()     { this.isMenuOpen.update(v => !v); }
  closeMenu()      { this.isMenuOpen.set(false); }
  toggleUserMenu() { this.isUserMenuOpen.update(v => !v); }
  closeAll()       { this.isMenuOpen.set(false); this.isUserMenuOpen.set(false); }

  isOwner() {
    return this.authService.currentUser()?.role === 'OWNER';
  }

  getFirstName(): string {
    const name = this.authService.currentUser()?.name || '';
    return name.split(' ')[0] || 'User';
  }

  getFirstLetter(): string {
    return (this.authService.currentUser()?.name || 'U')[0].toUpperCase();
  }

  handleLogout() {
    this.authService.logout().subscribe({
      next: () => { this.closeAll(); this.router.navigate(['/home']); },
      error: ()  => { this.closeAll(); this.router.navigate(['/home']); }
    });
  }
}