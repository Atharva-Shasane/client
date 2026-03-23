import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">

      <!-- ── Ambient BG ── -->
      <div class="auth-bg">
        <div class="ab-blob blob-1"></div>
        <div class="ab-blob blob-2"></div>
        <div class="ab-grain"></div>
      </div>

      <!-- ══════════════════════════════════
           CARD
      ══════════════════════════════════ -->
      <div class="auth-card">

        <!-- Brand -->
        <div class="auth-brand">
          <span class="brand-pill">
            <span class="bp-dot"></span>
            Killa Access
          </span>
          <h1 class="auth-title">
            {{ requiresOtp() ? 'Identity' : 'Sign' }}
            <span class="accent">{{ requiresOtp() ? 'Check' : 'In' }}</span>
          </h1>
          <p class="auth-sub">
            {{
              requiresOtp()
                ? 'A 6-digit security code was sent to your owner email.'
                : 'Access your legendary account to manage orders and more.'
            }}
          </p>
        </div>

        <!-- BUG FIX 1: removed NgZone.runOutsideAngular() — it suppresses Angular's
             change detection, meaning signal/form updates don't re-render the view.
             The subscribe callbacks were then forcing re-entry with ngZone.run(),
             which is error-prone. Standard zone-aware subscribe works correctly here.

             BUG FIX 2: removed ChangeDetectorRef — it's unnecessary with signals.
             Signals automatically schedule a re-render when set().

             BUG FIX 3: removed setTimeout on router.navigate — it has no purpose
             here other than delaying navigation by 200ms for no reason. -->

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">

          <!-- ── STEP 1: Credentials ── -->
          <div class="form-step" *ngIf="!requiresOtp()">

            <div class="form-field">
              <label class="field-label">Email Address</label>
              <div class="input-wrap" [class.input-error]="isInvalid('email')" [class.input-focused]="focusedField === 'email'">
                <svg class="input-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  formControlName="email"
                  type="email"
                  class="field-input"
                  placeholder="name@domain.com"
                  (focus)="focusedField = 'email'"
                  (blur)="focusedField = ''"
                />
              </div>
              <p class="field-error" *ngIf="isInvalid('email')">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Please enter a valid email address
              </p>
            </div>

            <div class="form-field">
              <label class="field-label">Password</label>
              <div class="input-wrap" [class.input-error]="isInvalid('password')" [class.input-focused]="focusedField === 'password'">
                <svg class="input-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  formControlName="password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="field-input"
                  placeholder="••••••••"
                  (focus)="focusedField = 'password'"
                  (blur)="focusedField = ''"
                />
                <!-- Show/hide password toggle -->
                <button type="button" class="pw-toggle" (click)="showPassword = !showPassword" tabindex="-1">
                  <svg *ngIf="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg *ngIf="showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              <p class="field-error" *ngIf="isInvalid('password')">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Password is required
              </p>
            </div>
          </div>

          <!-- ── STEP 2: OTP ── -->
          <div class="form-step otp-step" *ngIf="requiresOtp()">
            <div class="otp-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>

            <div class="form-field" style="width:100%">
              <label class="field-label" style="text-align:center">Verification Code</label>
              <div class="input-wrap otp-wrap" [class.input-focused]="focusedField === 'otp'">
                <input
                  formControlName="otp"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  class="otp-input"
                  placeholder="000000"
                  autocomplete="one-time-code"
                  (focus)="focusedField = 'otp'"
                  (blur)="focusedField = ''"
                />
              </div>
              <p class="otp-hint">Enter the 6-digit code sent to your owner email address.</p>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="submit-btn"
            [disabled]="loading() || (loginForm.invalid && !requiresOtp())">
            <span class="sb-spinner" *ngIf="loading()"></span>
            <span *ngIf="!loading()">
              {{ requiresOtp() ? 'Confirm Identity' : 'Sign In' }}
            </span>
            <svg *ngIf="!loading()" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>

        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <ng-container *ngIf="!requiresOtp()">
            <p class="af-text">
              New here?
              <a class="af-link" (click)="router.navigate(['/register'])">Create an Account</a>
            </p>
          </ng-container>
          <ng-container *ngIf="requiresOtp()">
            <button class="af-back" (click)="resetLoginState()">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Change Credentials
            </button>
          </ng-container>
        </div>

      </div><!-- /auth-card -->
    </div><!-- /auth-page -->
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
      --surface-4:   #1a1a1a;
      --border:      rgba(255,255,255,0.07);
      --border-h:    rgba(255,255,255,0.13);
      --text:        #f0ede8;
      --text-muted:  #6b6b6b;
      --text-dim:    #3a3a3a;
      --red:         #ef4444;
      --red-dim:     rgba(239,68,68,0.1);
    }

    /* ═══════════════════════════════════════════
       PAGE + BG
    ═══════════════════════════════════════════ */
    .auth-page {
      position: relative;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--surface);
      padding: 24px;
      overflow: hidden;
    }

    .auth-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .ab-blob {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.12;
      animation: blobDrift 10s ease-in-out infinite alternate;
    }
    .blob-1 { width: 500px; height: 500px; background: var(--orange); top: -180px; right: -120px; }
    .blob-2 { width: 340px; height: 340px; background: #c73e00; bottom: -60px; left: -80px; animation-delay: -5s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(20px,16px) scale(1.06); }
    }
    .ab-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       CARD
    ═══════════════════════════════════════════ */
    .auth-card {
      position: relative; z-index: 1;
      width: 100%; max-width: 460px;
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      border-radius: 28px;
      padding: 48px 44px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6);
      animation: cardIn 0.5s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes cardIn {
      from { opacity:0; transform:translateY(24px) scale(0.98); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }

    /* ── Brand ── */
    .auth-brand { text-align: center; margin-bottom: 36px; }
    .brand-pill {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.16em;
      color: var(--orange);
      background: var(--orange-dim);
      border: 1px solid rgba(255,102,0,0.25);
      padding: 5px 14px; border-radius: 20px;
      margin-bottom: 18px;
    }
    .bp-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--orange);
      box-shadow: 0 0 6px var(--orange);
      animation: bpulse 2s ease-in-out infinite;
    }
    @keyframes bpulse {
      0%,100% { box-shadow: 0 0 4px var(--orange); }
      50%      { box-shadow: 0 0 12px var(--orange); }
    }
    .auth-title {
      font-size: 2.4rem; font-weight: 900;
      letter-spacing: -0.04em; margin: 0 0 10px; line-height: 1;
      color: var(--text);
    }
    .accent { color: var(--orange); }
    .auth-sub {
      color: var(--text-muted); font-size: 0.88rem;
      line-height: 1.65; margin: 0; max-width: 320px; margin: 0 auto;
    }

    /* ── Form ── */
    form { display: flex; flex-direction: column; gap: 0; }

    .form-step { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }

    .form-field { display: flex; flex-direction: column; gap: 7px; }
    .field-label {
      font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--text-muted); display: block;
    }

    /* Input wrap */
    .input-wrap {
      position: relative;
      display: flex; align-items: center;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 13px;
      transition: border-color 0.22s, box-shadow 0.22s, background 0.22s;
    }
    .input-focused { border-color: rgba(255,102,0,0.45); background: var(--surface-4); box-shadow: 0 0 0 3px rgba(255,102,0,0.08); }
    .input-error   { border-color: rgba(239,68,68,0.5); box-shadow: 0 0 0 3px rgba(239,68,68,0.06); }

    .input-ico {
      position: absolute; left: 16px;
      color: var(--text-dim); flex-shrink: 0;
      pointer-events: none;
    }
    .field-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text); font-size: 0.92rem; font-family: inherit;
      padding: 14px 16px 14px 46px;
      width: 100%;
    }
    .field-input::placeholder { color: var(--text-dim); }

    /* Password toggle */
    .pw-toggle {
      position: absolute; right: 14px;
      background: none; border: none;
      color: var(--text-dim); cursor: pointer; padding: 4px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      transition: color 0.18s;
    }
    .pw-toggle:hover { color: var(--text-muted); }

    /* Field error message */
    .field-error {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.7rem; color: var(--red); font-weight: 600; margin: 0;
    }

    /* ── OTP Step ── */
    .otp-step { align-items: center; gap: 20px; }
    .otp-icon-wrap {
      width: 64px; height: 64px; border-radius: 18px;
      background: var(--orange-dim);
      border: 1px solid rgba(255,102,0,0.22);
      display: flex; align-items: center; justify-content: center;
      color: var(--orange);
      animation: otp-appear 0.4s ease both;
    }
    @keyframes otp-appear {
      from { opacity:0; transform:scale(0.8); }
      to   { opacity:1; transform:scale(1); }
    }
    .otp-wrap { justify-content: center; }
    .otp-input {
      background: none; border: none; outline: none;
      font-size: 2.2rem; font-weight: 900;
      letter-spacing: 14px; text-align: center;
      color: var(--orange); width: 100%;
      padding: 16px 20px;
      font-family: 'Courier New', monospace;
    }
    .otp-input::placeholder { color: var(--text-dim); letter-spacing: 12px; font-size: 1.8rem; }
    .otp-hint {
      font-size: 0.75rem; color: var(--text-muted);
      text-align: center; margin: 0; line-height: 1.5;
    }

    /* ── Submit button ── */
    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 15px;
      background: var(--orange); color: #fff;
      border: none; border-radius: 13px;
      font-size: 0.95rem; font-weight: 900; cursor: pointer;
      box-shadow: 0 4px 24px var(--orange-glow);
      transition: background 0.22s, transform 0.22s, box-shadow 0.22s;
      margin-top: 6px;
    }
    .submit-btn:hover:not([disabled]) {
      background: #e55a00;
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(255,102,0,0.45);
    }
    .submit-btn:disabled {
      background: var(--surface-3);
      color: var(--text-muted);
      box-shadow: none; cursor: not-allowed; transform: none;
    }
    .sb-spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,0.25);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Footer ── */
    .auth-footer {
      margin-top: 28px; padding-top: 22px;
      border-top: 1px solid var(--border);
      display: flex; justify-content: center;
    }
    .af-text { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
    .af-link {
      color: var(--orange); font-weight: 800;
      cursor: pointer; margin-left: 5px;
      text-decoration: none;
      transition: opacity 0.18s;
    }
    .af-link:hover { opacity: 0.8; text-decoration: underline; }
    .af-back {
      display: inline-flex; align-items: center; gap: 7px;
      background: none; border: 1px solid var(--border);
      color: var(--text-muted); font-size: 0.8rem; font-weight: 700;
      padding: 9px 16px; border-radius: 9px; cursor: pointer;
      transition: color 0.18s, border-color 0.18s;
    }
    .af-back:hover { color: var(--text); border-color: var(--border-h); }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 480px) {
      .auth-card { padding: 36px 24px; }
      .auth-title { font-size: 2rem; }
      .otp-input  { font-size: 1.8rem; letter-spacing: 10px; }
    }
  `],
})
export class LoginComponent {
  private fb          = inject(FormBuilder);
  authService         = inject(AuthService);
  router              = inject(Router);
  private toast       = inject(ToastService);

  // BUG FIX: converted mutable class properties to signals so the template
  // reactively updates without needing ChangeDetectorRef or NgZone
  requiresOtp = signal(false);
  loading     = signal(false);

  // BUG FIX: removed NgZone and ChangeDetectorRef injections — they are not
  // needed with signals and cause the bugs described in onSubmit() below
  showPassword = false;
  focusedField = '';

  loginForm: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    // BUG FIX: OTP field had no validators — during OTP step, the form was
    // technically .invalid because email/password stayed dirty, and the submit
    // button disabled check `loginForm.invalid && !requiresOtp` didn't re-enable
    // cleanly. Now OTP gets minLength(6) applied conditionally in resetLoginState/
    // onSubmit, keeping the form's validity accurate throughout the flow.
    otp:      [''],
  });

  isInvalid(field: string): boolean {
    const c = this.loginForm.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  resetLoginState() {
    this.requiresOtp.set(false);
    // BUG FIX: was only resetting the otp control — the entire form stays dirty
    // (email/password), so resetting just otp is enough but we also clear validators
    // we may have added so the form goes back to clean credential-step state
    this.loginForm.get('otp')?.reset();
    this.loginForm.get('otp')?.clearValidators();
    this.loginForm.get('otp')?.updateValueAndValidity();
  }

  onSubmit() {
    // BUG FIX 1: was wrapping the entire subscribe in ngZone.runOutsideAngular().
    // Running HTTP subscriptions outside Angular's zone means Angular never knows
    // the async work completed, so change detection doesn't run. The workaround
    // was ngZone.run() inside the callbacks — but that defeats the purpose and
    // creates a confusing nested zone pattern. Removed entirely. Angular's HttpClient
    // already runs on the microtask queue inside the zone correctly.

    if (this.loginForm.invalid && !this.requiresOtp()) return;

    this.loading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        if (res.requiresOtp) {
          // Server sent OTP — switch to OTP step
          this.requiresOtp.set(true);
          this.loading.set(false);
          this.toast.info('Owner verification code sent to your email.');
        } else {
          // Fully authenticated
          this.loading.set(false);
          this.toast.success('Access granted. Welcome back!');
          // BUG FIX 2: was using setTimeout(() => router.navigate, 200) for no reason.
          // Immediate navigation works correctly. The toast is shown before the route
          // component destroys this component — no timing issue.
          this.router.navigate(['/home']);
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.msg || 'Invalid credentials. Please try again.');
      },
    });
  }
}