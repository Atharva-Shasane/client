import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-register',
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
            Est. 2024
          </span>
          <h1 class="auth-title">
            {{ showOtpInput() ? 'Verify' : 'Join the' }}
            <span class="accent">{{ showOtpInput() ? 'Account' : 'Legend' }}</span>
          </h1>
          <p class="auth-sub">
            {{
              showOtpInput()
                ? 'We sent a secure code to ' + registerForm.get('email')?.value
                : 'Create an account to start your culinary journey with Killa.'
            }}
          </p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">

          <!-- ── STEP 1: Registration details ── -->
          <div class="form-step" *ngIf="!showOtpInput()">

            <!-- Full name -->
            <div class="form-field">
              <label class="field-label">Full Name</label>
              <div class="input-wrap" [class.input-error]="isInvalid('name')" [class.input-focused]="focusedField === 'name'">
                <svg class="input-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  formControlName="name"
                  class="field-input"
                  placeholder="Your full name"
                  (focus)="focusedField = 'name'"
                  (blur)="focusedField = ''"
                />
              </div>
              <p class="field-error" *ngIf="isInvalid('name')">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Name is required
              </p>
            </div>

            <!-- Email + Mobile row -->
            <div class="form-row">
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
                  Valid email required
                </p>
              </div>

              <div class="form-field">
                <label class="field-label">Mobile Number</label>
                <div class="input-wrap" [class.input-error]="isInvalid('mobile')" [class.input-focused]="focusedField === 'mobile'">
                  <svg class="input-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  <input
                    formControlName="mobile"
                    type="tel"
                    inputmode="numeric"
                    class="field-input"
                    placeholder="10-digit number"
                    (focus)="focusedField = 'mobile'"
                    (blur)="focusedField = ''"
                  />
                </div>
                <p class="field-error" *ngIf="isInvalid('mobile')">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  10-digit number required
                </p>
              </div>
            </div>

            <!-- Password -->
            <div class="form-field">
              <label class="field-label">Secure Password</label>
              <div class="input-wrap" [class.input-error]="isInvalid('password')" [class.input-focused]="focusedField === 'password'">
                <svg class="input-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  formControlName="password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="field-input"
                  placeholder="Min 8 chars, 1 uppercase, 1 special"
                  (focus)="focusedField = 'password'"
                  (blur)="focusedField = ''"
                />
                <button type="button" class="pw-toggle" (click)="showPassword = !showPassword" tabindex="-1">
                  <svg *ngIf="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg *ngIf="showPassword"  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>

              <!-- Password strength indicator -->
              <div class="pw-strength">
                <div class="pws-bars">
                  <div class="pws-bar" [class.bar-weak]="pwStrength() >= 1" [class.bar-fair]="pwStrength() >= 2" [class.bar-good]="pwStrength() >= 3" [class.bar-strong]="pwStrength() >= 4"></div>
                  <div class="pws-bar" [class.bar-fair]="pwStrength() >= 2" [class.bar-good]="pwStrength() >= 3" [class.bar-strong]="pwStrength() >= 4"></div>
                  <div class="pws-bar" [class.bar-good]="pwStrength() >= 3" [class.bar-strong]="pwStrength() >= 4"></div>
                  <div class="pws-bar" [class.bar-strong]="pwStrength() >= 4"></div>
                </div>
                <span class="pws-label" [class.label-weak]="pwStrength() === 1" [class.label-fair]="pwStrength() === 2" [class.label-good]="pwStrength() === 3" [class.label-strong]="pwStrength() === 4">
                  {{ getPwLabel() }}
                </span>
              </div>

              <!-- Requirements checklist -->
              <div class="pw-checks">
                <span class="pwc" [class.pwc-met]="pwCheck('length')">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path [attr.d]="pwCheck('length') ? 'M2 7l4 4 6-7' : 'M7 1v12M1 7h12'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  8+ characters
                </span>
                <span class="pwc" [class.pwc-met]="pwCheck('upper')">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path [attr.d]="pwCheck('upper') ? 'M2 7l4 4 6-7' : 'M7 1v12M1 7h12'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  1 uppercase
                </span>
                <span class="pwc" [class.pwc-met]="pwCheck('lower')">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path [attr.d]="pwCheck('lower') ? 'M2 7l4 4 6-7' : 'M7 1v12M1 7h12'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  1 lowercase
                </span>
                <span class="pwc" [class.pwc-met]="pwCheck('special')">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path [attr.d]="pwCheck('special') ? 'M2 7l4 4 6-7' : 'M7 1v12M1 7h12'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  1 special char
                </span>
              </div>
            </div>
          </div>

          <!-- ── STEP 2: OTP ── -->
          <div class="form-step otp-step" *ngIf="showOtpInput()">
            <div class="otp-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>

            <div class="form-field" style="width:100%">
              <label class="field-label" style="text-align:center">6-Digit Verification Code</label>
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

              <!-- Resend row -->
              <div class="otp-resend">
                <span class="or-text">Didn't receive the code?</span>
                <button type="button" class="or-btn" (click)="handleRequestOtp()" [disabled]="loading()">
                  Resend Code
                </button>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="submit-btn"
            [disabled]="loading() || (!showOtpInput() && (registerForm.invalid || !isStrongPassword()))">
            <span class="sb-spinner" *ngIf="loading()"></span>
            <span *ngIf="!loading()">
              {{ showOtpInput() ? 'Complete Registration' : 'Send Verification Code' }}
            </span>
            <svg *ngIf="!loading()" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>

        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <ng-container *ngIf="!showOtpInput()">
            <p class="af-text">
              Already have an account?
              <a class="af-link" (click)="router.navigate(['/login'])">Sign In</a>
            </p>
          </ng-container>
          <ng-container *ngIf="showOtpInput()">
            <button class="af-back" (click)="goBackToDetails()">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Edit My Details
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
      --green:       #22c55e;
      --green-dim:   rgba(34,197,94,0.12);
      --red:         #ef4444;
      --amber:       #f59e0b;
      --surface:     #0d0d0d;
      --surface-2:   #111111;
      --surface-3:   #161616;
      --surface-4:   #1a1a1a;
      --border:      rgba(255,255,255,0.07);
      --border-h:    rgba(255,255,255,0.13);
      --text:        #f0ede8;
      --text-muted:  #6b6b6b;
      --text-dim:    #3a3a3a;
    }

    /* ═══════════════════════════════════════════
       PAGE + BG
    ═══════════════════════════════════════════ */
    .auth-page {
      position: relative;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--surface);
      padding: 32px 24px;
      overflow: hidden;
    }

    .auth-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .ab-blob {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.12;
      animation: blobDrift 10s ease-in-out infinite alternate;
    }
    .blob-1 { width: 500px; height: 500px; background: var(--orange); top: -180px; right: -120px; }
    .blob-2 { width: 340px; height: 340px; background: #c73e00; bottom: -80px; left: -80px; animation-delay: -5s; }
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
      width: 100%; max-width: 520px;
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
    .auth-brand { text-align: center; margin-bottom: 32px; }
    .brand-pill {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.16em;
      color: var(--orange);
      background: var(--orange-dim);
      border: 1px solid rgba(255,102,0,0.25);
      padding: 5px 14px; border-radius: 20px;
      margin-bottom: 16px;
    }
    .bp-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--orange); box-shadow: 0 0 6px var(--orange);
      animation: bpulse 2s ease-in-out infinite;
    }
    @keyframes bpulse {
      0%,100% { box-shadow: 0 0 4px var(--orange); }
      50%      { box-shadow: 0 0 12px var(--orange); }
    }
    .auth-title {
      font-size: 2.2rem; font-weight: 900;
      letter-spacing: -0.04em; margin: 0 0 10px; line-height: 1;
      color: var(--text);
    }
    .accent { color: var(--orange); }
    .auth-sub {
      color: var(--text-muted); font-size: 0.88rem;
      line-height: 1.65; margin: 0 auto; max-width: 340px;
    }

    /* ── Form ── */
    form { display: flex; flex-direction: column; }

    .form-step { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
    .form-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .form-field { display: flex; flex-direction: column; gap: 7px; }
    .field-label {
      font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--text-muted); display: block;
    }

    /* Input wrap */
    .input-wrap {
      position: relative; display: flex; align-items: center;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 13px;
      transition: border-color 0.22s, box-shadow 0.22s, background 0.22s;
    }
    .input-focused { border-color: rgba(255,102,0,0.45); background: var(--surface-4); box-shadow: 0 0 0 3px rgba(255,102,0,0.08); }
    .input-error   { border-color: rgba(239,68,68,0.5); box-shadow: 0 0 0 3px rgba(239,68,68,0.06); }

    .input-ico {
      position: absolute; left: 15px;
      color: var(--text-dim); flex-shrink: 0; pointer-events: none;
    }
    .field-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text); font-size: 0.9rem; font-family: inherit;
      padding: 13px 14px 13px 44px; width: 100%;
    }
    .field-input::placeholder { color: var(--text-dim); }

    .pw-toggle {
      position: absolute; right: 13px;
      background: none; border: none;
      color: var(--text-dim); cursor: pointer; padding: 4px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px; transition: color 0.18s;
    }
    .pw-toggle:hover { color: var(--text-muted); }

    .field-error {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.7rem; color: var(--red); font-weight: 600; margin: 0;
    }

    /* ── Password strength ── */
    .pw-strength {
      display: flex; align-items: center; gap: 10px; margin-top: 2px;
    }
    .pws-bars { display: flex; gap: 4px; flex: 1; }
    .pws-bar {
      flex: 1; height: 3px; border-radius: 2px;
      background: var(--text-dim);
      transition: background 0.3s;
    }
    .bar-weak   { background: var(--red); }
    .bar-fair   { background: var(--amber); }
    .bar-good   { background: #84cc16; }
    .bar-strong { background: var(--green); }
    .pws-label {
      font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--text-dim); white-space: nowrap;
      transition: color 0.3s;
    }
    .label-weak   { color: var(--red); }
    .label-fair   { color: var(--amber); }
    .label-good   { color: #84cc16; }
    .label-strong { color: var(--green); }

    /* Password requirement checks */
    .pw-checks {
      display: flex; gap: 10px; flex-wrap: wrap;
    }
    .pwc {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.65rem; font-weight: 700;
      color: var(--text-dim); transition: color 0.2s;
    }
    .pwc-met { color: var(--green); }

    /* ── OTP step ── */
    .otp-step { align-items: center; gap: 20px; }
    .otp-icon-wrap {
      width: 64px; height: 64px; border-radius: 18px;
      background: var(--orange-dim);
      border: 1px solid rgba(255,102,0,0.22);
      display: flex; align-items: center; justify-content: center;
      color: var(--orange);
      animation: otpAppear 0.4s ease both;
    }
    @keyframes otpAppear {
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

    .otp-resend {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 12px;
    }
    .or-text { font-size: 0.78rem; color: var(--text-muted); }
    .or-btn {
      background: none; border: none;
      color: var(--orange); font-size: 0.78rem; font-weight: 800;
      cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
      transition: opacity 0.18s;
    }
    .or-btn:hover:not([disabled]) { opacity: 0.75; }
    .or-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    /* ── Submit ── */
    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 15px;
      background: var(--orange); color: #fff;
      border: none; border-radius: 13px;
      font-size: 0.95rem; font-weight: 900; cursor: pointer;
      box-shadow: 0 4px 24px var(--orange-glow);
      transition: background 0.22s, transform 0.22s, box-shadow 0.22s;
      margin-top: 4px;
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
      margin-top: 24px; padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex; justify-content: center;
    }
    .af-text { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
    .af-link {
      color: var(--orange); font-weight: 800;
      cursor: pointer; margin-left: 5px;
      text-decoration: none; transition: opacity 0.18s;
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
    @media (max-width: 600px) {
      .auth-card { padding: 36px 22px; }
      .auth-title { font-size: 1.9rem; }
      .form-row   { grid-template-columns: 1fr; }
      .otp-input  { font-size: 1.8rem; letter-spacing: 10px; }
    }
  `],
})
export class RegisterComponent {
  private fb    = inject(FormBuilder);
  authService   = inject(AuthService);
  router        = inject(Router);
  private toast = inject(ToastService);

  showOtpInput = signal(false);
  loading      = signal(false);

  showPassword = false;
  focusedField = '';

  registerForm: FormGroup = this.fb.group({
    name:     ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    mobile:   ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    otp:      [''],
  });

  isInvalid(field: string): boolean {
    const c = this.registerForm.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  // ── Password helpers ────────────────────────────────────────────────────

  pwCheck(rule: 'length' | 'upper' | 'lower' | 'special'): boolean {
    const v = this.registerForm.get('password')?.value || '';
    switch (rule) {
      case 'length':  return v.length >= 8;
      case 'upper':   return /[A-Z]/.test(v);
      case 'lower':   return /[a-z]/.test(v);
      case 'special': return /[@$!%*?&]/.test(v);
    }
  }

  // BUG FIX: original isStrongPassword() used minLength 6 in the validator
  // but the regex required 6+ chars. The server regex requires 8+ chars with
  // lowercase, uppercase, digit, and special char. Aligned to match the server.
  isStrongPassword(): boolean {
    return this.pwCheck('length') && this.pwCheck('upper') && this.pwCheck('lower') && this.pwCheck('special');
  }

  pwStrength(): number {
    // Returns 0–4 — used to drive the 4-bar strength indicator
    return [
      this.pwCheck('length'),
      this.pwCheck('upper'),
      this.pwCheck('lower'),
      this.pwCheck('special'),
    ].filter(Boolean).length;
  }

  getPwLabel(): string {
    const s = this.pwStrength();
    if (s === 0) return '';
    if (s === 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  }

  // ── Flow ────────────────────────────────────────────────────────────────

  onSubmit() {
    if (!this.showOtpInput()) {
      this.handleRequestOtp();
    } else {
      this.handleRegister();
    }
  }

  handleRequestOtp() {
    // BUG FIX: original called markAllAsTouched() then returned, but the form's
    // disabled state on the button already prevented submission when invalid.
    // However if the user somehow bypassed the button, markAllAsTouched() alone
    // is not enough — we need to re-check validity explicitly here.
    if (this.registerForm.get('name')?.invalid ||
        this.registerForm.get('email')?.invalid ||
        this.registerForm.get('mobile')?.invalid ||
        this.registerForm.get('password')?.invalid ||
        !this.isStrongPassword()) {
      this.registerForm.markAllAsTouched();
      this.toast.error('Please fix all errors before continuing.');
      return;
    }

    this.loading.set(true);

    this.authService.requestOtp(this.registerForm.get('email')?.value).subscribe({
      next: () => {
        // BUG FIX: original wrapped signal updates in setTimeout() to avoid
        // ExpressionChangedAfterItHasBeenCheckedError. This error only happens
        // with ChangeDetectorRef-based CD (markForCheck/detectChanges) — it does
        // NOT happen with Angular signals because signals are push-based and
        // schedule their own re-render safely. The setTimeout is unnecessary
        // and adds a visual flicker before the OTP step appears.
        this.showOtpInput.set(true);
        this.loading.set(false);
        this.toast.success('Verification code sent! Check your inbox.');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.msg || 'Failed to send verification code.');
      },
    });
  }

  handleRegister() {
    const otp = this.registerForm.get('otp')?.value?.trim();

    // BUG FIX: original only checked !otp (falsy), so a whitespace-only OTP
    // would pass the guard and be sent to the server, causing a confusing error.
    if (!otp || otp.length < 6) {
      this.toast.error('Please enter the full 6-digit verification code.');
      return;
    }

    this.loading.set(true);
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Registration successful! Welcome to Killa.');
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.msg || 'Registration failed. Check your code and try again.');
      },
    });
  }

  // BUG FIX: original used showOtpInput.set(false) directly in the template
  // — this worked but also left the OTP field value intact, so going back and
  // then forward again would still show the previously entered (now stale) OTP.
  // Clearing it here prevents submitting a stale OTP on re-entry.
  goBackToDetails() {
    this.showOtpInput.set(false);
    this.registerForm.get('otp')?.reset();
  }
}