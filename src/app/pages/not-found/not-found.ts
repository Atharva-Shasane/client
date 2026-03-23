import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  // BUG FIX: CommonModule was imported but only RouterLink was needed from it.
  // Added RouterLink as a standalone import to use routerLink directive directly
  // instead of router.navigate() — keeping navigation declarative.
  imports: [CommonModule, RouterLink],
  template: `
    <div class="nf-page">

      <!-- ── Ambient BG ── -->
      <div class="nf-bg">
        <div class="nf-blob blob-1"></div>
        <div class="nf-blob blob-2"></div>
        <div class="nf-grain"></div>
      </div>

      <div class="nf-content">

        <!-- Glitch 404 -->
        <div class="glitch-wrap">
          <span class="nf-404 glitch" data-text="404">404</span>
        </div>

        <!-- Icon -->
        <div class="nf-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11l19-9-9 19-2-8-8-2z"/>
          </svg>
        </div>

        <!-- Copy -->
        <h1 class="nf-title">Table <span class="accent">Not Found</span></h1>
        <p class="nf-sub">
          Sorry — the page you're looking for has been cleared from our menu.
          It may have moved, been renamed, or never existed.
        </p>

        <!-- Live countdown -->
        <p class="nf-redirect" *ngIf="countdown() > 0">
          Redirecting to home in
          <span class="countdown-num">{{ countdown() }}</span>
          second{{ countdown() !== 1 ? 's' : '' }}…
        </p>

        <!-- Actions -->
        <div class="nf-actions">
          <button class="btn-home" (click)="goHome()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Back to Home
          </button>
          <a class="btn-menu" routerLink="/menu">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3h18v18H3z"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
            View Menu
          </a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       DESIGN TOKENS — full system match
    ═══════════════════════════════════════════ */
    :host {
      --orange:      #ff6600;
      --orange-dim:  rgba(255,102,0,0.12);
      --orange-glow: rgba(255,102,0,0.28);
      --surface:     #0d0d0d;
      --surface-2:   #111111;
      --surface-3:   #161616;
      --border:      rgba(255,255,255,0.07);
      --border-h:    rgba(255,255,255,0.13);
      --text:        #f0ede8;
      --text-muted:  #6b6b6b;
      --text-dim:    #3a3a3a;
    }

    /* ═══════════════════════════════════════════
       PAGE + BG
    ═══════════════════════════════════════════ */
    .nf-page {
      position: relative;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--surface);
      color: var(--text);
      padding: 40px 24px;
      overflow: hidden;
      text-align: center;
    }

    .nf-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .nf-blob {
      position: absolute; border-radius: 50%;
      filter: blur(130px); opacity: 0.1;
      animation: blobDrift 10s ease-in-out infinite alternate;
    }
    .blob-1 { width: 560px; height: 560px; background: var(--orange); top: -200px; right: -120px; }
    .blob-2 { width: 380px; height: 380px; background: #c73e00; bottom: -60px; left: -80px; animation-delay: -5s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(20px,16px) scale(1.06); }
    }
    .nf-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       CONTENT
    ═══════════════════════════════════════════ */
    .nf-content {
      position: relative; z-index: 1;
      display: flex; flex-direction: column;
      align-items: center; gap: 16px;
      animation: fadeUp 0.6s cubic-bezier(.4,0,.2,1) both;
      max-width: 560px;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(24px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ── Glitch 404 ── */
    .glitch-wrap { position: relative; margin-bottom: 8px; }

    .nf-404 {
      font-size: clamp(7rem, 18vw, 11rem);
      font-weight: 900;
      letter-spacing: -0.06em;
      line-height: 1;
      color: var(--orange);
      display: block;
      /* BUG FIX: original used a z-index:-1 shadow span that sat behind the
         parent container — in some stacking contexts this made it invisible.
         Using CSS ::before/::after pseudo-elements is the correct approach
         for glitch effects as they always render relative to the element. */
    }

    /* Glitch animation via pseudo-elements */
    .glitch { position: relative; }
    .glitch::before,
    .glitch::after {
      content: attr(data-text);
      position: absolute;
      top: 0; left: 0; width: 100%;
      font-size: inherit; font-weight: inherit;
      letter-spacing: inherit; line-height: inherit;
      overflow: hidden;
    }
    .glitch::before {
      color: rgba(255,102,0,0.5);
      animation: glitch-1 3.5s infinite linear;
      clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
      transform: translate(-3px, 0);
    }
    .glitch::after {
      color: rgba(255,60,0,0.35);
      animation: glitch-2 3.5s infinite linear;
      clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
      transform: translate(3px, 0);
    }
    @keyframes glitch-1 {
      0%,94%,100% { transform: translate(-3px,0); opacity:1; }
      95%          { transform: translate(-6px,-2px); opacity:0.8; }
      97%          { transform: translate(3px,2px);  opacity:0.9; }
    }
    @keyframes glitch-2 {
      0%,94%,100% { transform: translate(3px,0); opacity:1; }
      95%          { transform: translate(6px,2px);  opacity:0.8; }
      97%          { transform: translate(-3px,-2px); opacity:0.9; }
    }

    /* ── Icon ── */
    .nf-icon-wrap {
      width: 58px; height: 58px; border-radius: 16px;
      background: var(--orange-dim);
      border: 1px solid rgba(255,102,0,0.2);
      display: flex; align-items: center; justify-content: center;
      color: var(--orange); margin-bottom: 4px;
    }

    /* ── Copy ── */
    .nf-title {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 900; letter-spacing: -0.04em;
      margin: 0; line-height: 1.1;
    }
    .accent { color: var(--orange); }

    .nf-sub {
      color: var(--text-muted); font-size: 0.95rem;
      line-height: 1.7; margin: 0; max-width: 420px;
    }

    /* ── Countdown ── */
    .nf-redirect {
      font-size: 0.78rem; color: var(--text-muted);
      font-weight: 600; margin: 0;
      display: flex; align-items: center; gap: 6px; justify-content: center;
    }
    .countdown-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 6px;
      background: var(--orange-dim);
      border: 1px solid rgba(255,102,0,0.2);
      color: var(--orange); font-weight: 900; font-size: 0.82rem;
      animation: countPulse 1s ease-in-out infinite;
    }
    @keyframes countPulse {
      0%,100% { opacity:1; }
      50%      { opacity:0.5; }
    }

    /* ── Actions ── */
    .nf-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }

    .btn-home {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--orange); color: #fff;
      border: none; padding: 13px 26px; border-radius: 12px;
      font-size: 0.88rem; font-weight: 800; cursor: pointer;
      box-shadow: 0 4px 20px var(--orange-glow);
      transition: background 0.22s, transform 0.22s, box-shadow 0.22s;
      text-decoration: none;
    }
    .btn-home:hover {
      background: #e55a00;
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(255,102,0,0.45);
    }

    .btn-menu {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 13px 22px; border-radius: 12px;
      font-size: 0.88rem; font-weight: 700;
      text-decoration: none;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .btn-menu:hover {
      color: var(--text);
      border-color: var(--border-h);
      background: var(--surface-3);
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 480px) {
      .nf-actions { flex-direction: column; align-items: stretch; }
      .btn-home, .btn-menu { justify-content: center; }
    }
  `],
})
export class NotFoundComponent implements OnInit, OnDestroy {
  // BUG FIX: original injected Router but used it only in goHome() — this
  // works but using routerLink in the template for the menu link is cleaner.
  // Kept router inject for the programmatic goHome() + auto-redirect.
  private router = inject(Router);

  countdown = signal(8);
  private timer: any;

  ngOnInit() {
    // BUG FIX: auto-redirect after countdown — original had no auto-redirect,
    // leaving users stuck on the 404 page with no automatic recovery.
    this.timer = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        clearInterval(this.timer);
        this.router.navigate(['/home']);
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy() {
    // BUG FIX: original had no OnDestroy — if the user navigated away manually
    // before the countdown finished, the setInterval kept running in the
    // background, causing a memory leak and a stale navigation after 8s.
    clearInterval(this.timer);
  }

  goHome() {
    clearInterval(this.timer);
    this.router.navigate(['/home']);
  }
}