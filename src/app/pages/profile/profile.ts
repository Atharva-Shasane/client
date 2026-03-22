import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <div class="profile-page">

      <!-- ── Background atmosphere ── -->
      <div class="pg-bg">
        <div class="pg-blob blob-1"></div>
        <div class="pg-blob blob-2"></div>
        <div class="pg-grain"></div>
      </div>

      <!-- ══════════════════════════════════
           LOADING STATE
      ══════════════════════════════════ -->
      <div class="loader-wrap" *ngIf="loading()">
        <div class="loader-ring"></div>
        <p class="loader-text">Retrieving identity…</p>
      </div>

      <!-- ══════════════════════════════════
           PROFILE CONTENT
      ══════════════════════════════════ -->
      <div class="profile-shell" *ngIf="!loading()">

        <!-- ── LEFT: Identity card ── -->
        <aside class="identity-card">
          <!-- Avatar -->
          <div class="avatar-wrap">
            <div class="avatar-ring">
              <div class="avatar-inner">{{ getInitial() }}</div>
            </div>
            <span class="online-dot" title="Active session"></span>
          </div>

          <!-- Name + role -->
          <h1 class="id-name">{{ user()?.name }}</h1>
          <span class="id-role" [class.role-owner]="isOwner()">
            <span class="role-dot"></span>
            {{ isOwner() ? '★ Owner' : 'Member' }}
          </span>

          <!-- Quick stats row -->
          <div class="id-stats">
            <div class="id-stat">
              <span class="is-num">{{ isOwner() ? '∞' : '—' }}</span>
              <span class="is-label">Access Level</span>
            </div>
            <div class="is-divider"></div>
            <div class="id-stat">
              <span class="is-num">Active</span>
              <span class="is-label">Status</span>
            </div>
          </div>

          <!-- Logout button -->
          <button class="logout-btn" (click)="onLogout()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Terminate Session
          </button>
        </aside>

        <!-- ── RIGHT: Details panel ── -->
        <main class="details-panel">

          <!-- Section: Account Info -->
          <div class="panel-section">
            <div class="panel-section-header">
              <span class="psh-dot"></span>
              <h2 class="psh-title">Account Information</h2>
            </div>

            <div class="info-grid">
              <div class="info-tile">
                <div class="tile-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div class="tile-body">
                  <span class="tile-label">Email Address</span>
                  <span class="tile-value tile-truncate">{{ user()?.email }}</span>
                </div>
              </div>

              <div class="info-tile">
                <div class="tile-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.58 2.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.82-1.82a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div class="tile-body">
                  <span class="tile-label">Mobile Number</span>
                  <span class="tile-value">{{ user()?.mobile || 'Not provided' }}</span>
                </div>
              </div>

              <div class="info-tile">
                <div class="tile-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="tile-body">
                  <span class="tile-label">Member Since</span>
                  <span class="tile-value">{{ user()?.createdAt | date: 'longDate' }}</span>
                </div>
              </div>

              <div class="info-tile">
                <div class="tile-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="tile-body">
                  <span class="tile-label">Last Login</span>
                  <span class="tile-value">{{ user()?.lastLogin | date: 'medium' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section: Quick Actions -->
          <div class="panel-section" style="margin-top: 32px;">
            <div class="panel-section-header">
              <span class="psh-dot orange-dot"></span>
              <h2 class="psh-title">Quick Actions</h2>
            </div>

            <div class="actions-grid">
              <a routerLink="/my-orders" class="action-card">
                <div class="ac-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                </div>
                <div class="ac-text">
                  <p class="ac-title">My Orders</p>
                  <p class="ac-sub">View order history &amp; status</p>
                </div>
                <svg class="ac-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>

              <a routerLink="/menu" class="action-card">
                <div class="ac-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                </div>
                <div class="ac-text">
                  <p class="ac-title">Explore Menu</p>
                  <p class="ac-sub">Browse today's offerings</p>
                </div>
                <svg class="ac-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>

              <a routerLink="/cart" class="action-card">
                <div class="ac-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </div>
                <div class="ac-text">
                  <p class="ac-title">Your Cart</p>
                  <p class="ac-sub">Review &amp; checkout items</p>
                </div>
                <svg class="ac-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>

              <!-- Owner-only action -->
              <a *ngIf="isOwner()" routerLink="/owner/dashboard" class="action-card action-card-owner">
                <div class="ac-icon ac-icon-owner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                <div class="ac-text">
                  <p class="ac-title">Owner Dashboard</p>
                  <p class="ac-sub">Manage kitchen &amp; analytics</p>
                </div>
                <svg class="ac-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
            </div>
          </div>

        </main>
      </div><!-- /profile-shell -->

    </div><!-- /profile-page -->
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       TOKENS — identical to homepage/navbar
    ═══════════════════════════════════════════ */
    :host {
      --orange:       #ff6600;
      --orange-dim:   rgba(255,102,0,0.12);
      --orange-glow:  rgba(255,102,0,0.28);
      --owner-amber:  #f5a623;
      --surface:      #0d0d0d;
      --surface-2:    #111111;
      --surface-3:    #161616;
      --border:       rgba(255,255,255,0.07);
      --border-h:     rgba(255,255,255,0.13);
      --text:         #f0ede8;
      --text-muted:   #6b6b6b;
      --text-dim:     #3a3a3a;
    }

    /* ═══════════════════════════════════════════
       PAGE WRAP + BG
    ═══════════════════════════════════════════ */
    .profile-page {
      position: relative;
      min-height: 100vh;
      background: var(--surface);
      color: var(--text);
      padding: 96px 28px 80px;
      overflow: hidden;
    }

    .pg-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .pg-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(110px);
      opacity: 0.13;
      animation: blobDrift 9s ease-in-out infinite alternate;
    }
    .blob-1 { width: 480px; height: 480px; background: var(--orange); top: -140px; right: -80px; animation-delay: 0s; }
    .blob-2 { width: 320px; height: 320px; background: #c73e00; bottom: 0; left: -60px; animation-delay: -5s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(24px, 18px) scale(1.06); }
    }
    .pg-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       LOADER
    ═══════════════════════════════════════════ */
    .loader-wrap {
      position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 60vh; gap: 20px;
    }
    .loader-ring {
      width: 44px; height: 44px;
      border: 2.5px solid var(--surface-3);
      border-top-color: var(--orange);
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loader-text {
      font-size: 0.8rem; font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--text-muted);
    }

    /* ═══════════════════════════════════════════
       PROFILE SHELL — two-column layout
    ═══════════════════════════════════════════ */
    .profile-shell {
      position: relative; z-index: 1;
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 24px;
      align-items: start;
      animation: fadeUp 0.55s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(22px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ═══════════════════════════════════════════
       IDENTITY CARD (left column)
    ═══════════════════════════════════════════ */
    .identity-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 40px 28px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0;
      position: sticky;
      top: 88px;
      transition: border-color 0.3s;
    }
    .identity-card:hover { border-color: var(--border-h); }

    /* Avatar */
    .avatar-wrap {
      position: relative;
      width: 96px; height: 96px;
      margin-bottom: 20px;
    }
    .avatar-ring {
      width: 96px; height: 96px;
      border-radius: 50%;
      background: conic-gradient(var(--orange) 0deg 270deg, transparent 270deg 360deg);
      padding: 2.5px;
      animation: ringRotate 6s linear infinite;
    }
    @keyframes ringRotate { to { transform: rotate(360deg); } }
    .avatar-inner {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: var(--surface-3);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.4rem; font-weight: 900;
      color: var(--orange);
      text-transform: uppercase;
      border: 2px solid var(--surface-2);
    }
    .online-dot {
      position: absolute;
      bottom: 4px; right: 4px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #22c55e;
      border: 3px solid var(--surface-2);
      box-shadow: 0 0 8px rgba(34,197,94,0.5);
      animation: onlinePulse 2.5s ease-in-out infinite;
    }
    @keyframes onlinePulse {
      0%,100% { box-shadow: 0 0 5px rgba(34,197,94,0.4); }
      50%      { box-shadow: 0 0 14px rgba(34,197,94,0.8); }
    }

    /* Name & role */
    .id-name {
      font-size: 1.35rem; font-weight: 900;
      color: var(--text);
      margin: 0 0 10px;
      line-height: 1.2;
    }
    .id-role {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem; font-weight: 800;
      letter-spacing: 0.14em; text-transform: uppercase;
      padding: 5px 13px;
      border-radius: 20px;
      background: var(--orange-dim);
      color: var(--orange);
      border: 1px solid rgba(255,102,0,0.2);
      margin-bottom: 28px;
    }
    .role-owner {
      background: rgba(245,166,35,0.1);
      color: var(--owner-amber);
      border-color: rgba(245,166,35,0.22);
    }
    .role-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 6px currentColor;
      animation: rolePulse 2s ease-in-out infinite;
    }
    @keyframes rolePulse {
      0%,100% { opacity:1; }
      50%      { opacity:0.5; }
    }

    /* Stats mini-row */
    .id-stats {
      display: flex;
      align-items: center;
      gap: 20px;
      width: 100%;
      padding: 20px 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
      justify-content: center;
    }
    .id-stat { text-align: center; }
    .is-num {
      display: block;
      font-size: 1.05rem; font-weight: 900;
      color: var(--text);
    }
    .is-label {
      display: block;
      font-size: 0.62rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--text-muted);
    }
    .is-divider {
      width: 1px; height: 30px;
      background: var(--border);
    }

    /* Logout */
    .logout-btn {
      display: flex; align-items: center; justify-content: center; gap: 9px;
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      font-weight: 800; font-size: 0.8rem;
      letter-spacing: 0.05em; text-transform: uppercase;
      color: rgba(255,80,80,0.75);
      background: rgba(255,80,80,0.06);
      border: 1px solid rgba(255,80,80,0.14);
      cursor: pointer;
      transition: background 0.22s, color 0.22s, border-color 0.22s, transform 0.22s;
    }
    .logout-btn:hover {
      background: rgba(255,80,80,0.13);
      color: #ff5050;
      border-color: rgba(255,80,80,0.3);
      transform: translateY(-1px);
    }

    /* ═══════════════════════════════════════════
       DETAILS PANEL (right column)
    ═══════════════════════════════════════════ */
    .details-panel {
      display: flex;
      flex-direction: column;
    }

    .panel-section {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 32px;
      transition: border-color 0.3s;
    }
    .panel-section:hover { border-color: var(--border-h); }

    .panel-section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
    }
    .psh-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--text-dim);
    }
    .orange-dot { background: var(--orange); box-shadow: 0 0 8px var(--orange-glow); }
    .psh-title {
      font-size: 0.78rem; font-weight: 800;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--text-muted);
      margin: 0;
    }

    /* Info tiles grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-tile {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 18px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 16px;
      transition: border-color 0.2s, background 0.2s;
    }
    .info-tile:hover {
      border-color: var(--border-h);
      background: rgba(255,255,255,0.015);
    }
    .tile-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text-muted);
    }
    .tile-body { flex: 1; min-width: 0; }
    .tile-label {
      display: block;
      font-size: 0.65rem; font-weight: 800;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 5px;
    }
    .tile-value {
      display: block;
      font-size: 0.9rem; font-weight: 600;
      color: var(--text);
      line-height: 1.4;
    }
    .tile-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Actions grid */
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .action-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 18px 18px 16px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 16px;
      text-decoration: none;
      transition: border-color 0.22s, background 0.22s, transform 0.22s;
    }
    .action-card:hover {
      border-color: var(--border-h);
      background: rgba(255,255,255,0.02);
      transform: translateY(-2px);
    }
    .ac-icon {
      width: 40px; height: 40px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--orange-dim);
      border: 1px solid rgba(255,102,0,0.18);
      border-radius: 12px;
      color: var(--orange);
    }
    .ac-icon-owner {
      background: rgba(245,166,35,0.1);
      border-color: rgba(245,166,35,0.2);
      color: var(--owner-amber);
    }
    .ac-text { flex: 1; min-width: 0; }
    .ac-title {
      font-size: 0.85rem; font-weight: 800;
      color: var(--text);
      margin: 0 0 2px;
    }
    .ac-sub {
      font-size: 0.72rem; color: var(--text-muted);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ac-arrow { color: var(--text-dim); flex-shrink: 0; transition: transform 0.2s, color 0.2s; }
    .action-card:hover .ac-arrow { transform: translateX(3px); color: var(--text-muted); }

    .action-card-owner {
      border-color: rgba(245,166,35,0.12);
      grid-column: 1 / -1;
    }
    .action-card-owner:hover { border-color: rgba(245,166,35,0.28); }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 860px) {
      .profile-shell {
        grid-template-columns: 1fr;
      }
      .identity-card {
        position: static;
      }
      .info-grid { grid-template-columns: 1fr; }
      .actions-grid { grid-template-columns: 1fr; }
      .action-card-owner { grid-column: auto; }
    }
    @media (max-width: 480px) {
      .profile-page { padding: 88px 16px 60px; }
      .panel-section { padding: 22px 18px; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user    = this.authService.currentUser;
  loading = signal(true);

  ngOnInit() {
    this.fetchProfile();
  }

  fetchProfile() {
    this.authService.getProfile().subscribe({
      next: (data: User) => {
        this.authService.currentUser.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getInitial(): string {
    return (this.user()?.name || 'U')[0].toUpperCase();
  }

  isOwner(): boolean {
    return this.user()?.role === 'OWNER';
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => this.router.navigate(['/home']),
    });
  }
}