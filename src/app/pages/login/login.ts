import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
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
    <div class="auth-wrapper fade-in">
      <div class="auth-card glass-card">
        <div class="brand-header">
          <span class="k-logo">KILLA ACCESS</span>
          <h2>{{ requiresOtp ? 'Identity Check' : 'Sign In' }}</h2>
          <p class="subtitle">
            {{
              requiresOtp
                ? 'A security code was sent to your owner email.'
                : 'Access your legendary account to manage orders.'
            }}
          </p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Standard Credentials -->
          <div *ngIf="!requiresOtp" class="form-step">
            <div class="field">
              <label>Email Address</label>
              <div class="input-group">
                <span class="icon">✉️</span>
                <input
                  formControlName="email"
                  type="email"
                  placeholder="name@domain.com"
                  [class.error]="isInvalid('email')"
                />
              </div>
            </div>

            <div class="field">
              <label>Password</label>
              <div class="input-group">
                <span class="icon">🔒</span>
                <input
                  formControlName="password"
                  type="password"
                  placeholder="••••••••"
                  [class.error]="isInvalid('password')"
                />
              </div>
            </div>
          </div>

          <!-- Owner OTP Verification -->
          <div *ngIf="requiresOtp" class="form-step fade-in">
            <div class="field centered">
              <label>Verification Code</label>
              <input
                formControlName="otp"
                type="text"
                maxlength="6"
                class="otp-input"
                placeholder="000000"
              />
              <p class="otp-hint">Please enter the 6-digit code to continue as owner.</p>
            </div>
          </div>

          <button
            type="submit"
            class="btn-auth-main"
            [disabled]="loading || (loginForm.invalid && !requiresOtp)"
          >
            <span *ngIf="!loading">{{
              requiresOtp ? 'Confirm Identity' : 'Log Into Account'
            }}</span>
            <span *ngIf="loading" class="spinner"></span>
          </button>
        </form>

        <div class="auth-footer" *ngIf="!requiresOtp">
          <p>New here? <a (click)="router.navigate(['/register'])">Create an Account</a></p>
        </div>

        <div class="auth-footer" *ngIf="requiresOtp">
          <button class="btn-back-step" (click)="resetLoginState()">← Change Credentials</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a0a0a;
        padding: 24px;
        font-family: 'Poppins', sans-serif;
      }
      .auth-card {
        width: 100%;
        max-width: 440px;
        padding: 50px;
        border-radius: 32px;
        border: 1px solid #222;
        text-align: center;
        background: rgba(22, 22, 22, 0.8);
        backdrop-filter: blur(20px);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .brand-header {
        margin-bottom: 40px;
      }
      .k-logo {
        display: inline-block;
        font-weight: 900;
        color: #ff6600;
        letter-spacing: 2px;
        font-size: 0.75rem;
        border: 1px solid rgba(255, 102, 0, 0.4);
        padding: 5px 15px;
        border-radius: 50px;
        margin-bottom: 20px;
        text-transform: uppercase;
      }
      h2 {
        font-size: 2.2rem;
        font-weight: 900;
        margin: 0;
        color: white;
        letter-spacing: -1.5px;
      }
      .subtitle {
        color: #666;
        font-size: 0.95rem;
        margin-top: 10px;
        line-height: 1.5;
      }

      .field {
        text-align: left;
        margin-bottom: 25px;
      }
      .field.centered {
        text-align: center;
      }
      .field label {
        display: block;
        font-size: 0.7rem;
        font-weight: 800;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 10px;
      }

      .input-group {
        position: relative;
      }
      .input-group .icon {
        position: absolute;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.1rem;
        opacity: 0.4;
      }

      input {
        width: 100%;
        padding: 16px 20px 16px 52px;
        background: #111;
        border: 1px solid #222;
        border-radius: 14px;
        color: white;
        font-size: 1rem;
        font-family: inherit;
        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      input:focus {
        outline: none;
        border-color: #ff6600;
        box-shadow: 0 0 15px rgba(255, 102, 0, 0.1);
        background: #161616;
      }
      input.error {
        border-color: #ff4444;
      }

      .otp-input {
        padding: 15px;
        text-align: center;
        font-size: 2.2rem;
        letter-spacing: 12px;
        font-weight: 900;
        color: #ff6600;
        border-color: #ff6600;
        background: #000;
      }
      .otp-hint {
        font-size: 0.8rem;
        color: #555;
        margin-top: 12px;
        font-weight: 500;
      }

      .btn-auth-main {
        width: 100%;
        padding: 18px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 16px;
        font-weight: 900;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 10px;
        box-shadow: 0 10px 25px rgba(255, 102, 0, 0.3);
        letter-spacing: 0.5px;
      }
      .btn-auth-main:hover:not(:disabled) {
        transform: translateY(-3px);
        filter: brightness(1.1);
        box-shadow: 0 15px 35px rgba(255, 102, 0, 0.4);
      }
      .btn-auth-main:disabled {
        background: #222;
        color: #555;
        cursor: not-allowed;
        box-shadow: none;
      }

      .auth-footer {
        margin-top: 40px;
        padding-top: 25px;
        border-top: 1px solid #222;
        font-size: 0.95rem;
        color: #666;
      }
      .auth-footer a {
        color: #ff6600;
        font-weight: 800;
        cursor: pointer;
        margin-left: 5px;
        text-decoration: none;
      }
      .auth-footer a:hover {
        text-decoration: underline;
      }

      .btn-back-step {
        background: none;
        border: none;
        color: #555;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.9rem;
        transition: 0.2s;
      }
      .btn-back-step:hover {
        color: #888;
      }

      .spinner {
        display: inline-block;
        width: 22px;
        height: 22px;
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 480px) {
        .auth-card {
          padding: 40px 25px;
        }
        h2 {
          font-size: 1.8rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  authService = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);

  requiresOtp = false;
  loading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    otp: [''],
  });

  isInvalid(field: string) {
    const control = this.loginForm.get(field);
    return control?.invalid && (control.dirty || control.touched);
  }

  resetLoginState() {
    this.requiresOtp = false;
    this.loginForm.get('otp')?.reset();
    this.cdr.detectChanges();
  }

  onSubmit() {
    if (this.loginForm.invalid && !this.requiresOtp) return;

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        if (res.requiresOtp) {
          // Wrap in setTimeout to defer state change to next turn, preventing NG0100
          setTimeout(() => {
            this.requiresOtp = true;
            this.loading = false;
            this.toast.info('Owner verification code sent.');
            this.cdr.detectChanges();
          });
        } else {
          this.toast.success('Access granted. Welcome back.');
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.msg || 'Invalid credentials');
        this.cdr.detectChanges();
      },
    });
  }
}
