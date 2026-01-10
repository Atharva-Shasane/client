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
    <div class="auth-wrapper fade-in">
      <div class="auth-card glass-card">
        <div class="brand-header">
          <span class="k-tag">EST. 2024</span>
          <h2>{{ showOtpInput ? 'Verify Account' : 'Join the Legend' }}</h2>
          <p class="subtitle">
            {{
              showOtpInput
                ? 'We sent a secure code to ' + registerForm.get('email')?.value
                : 'Create an account to start your culinary journey'
            }}
          </p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- STEP 1: Personal Details -->
          <div *ngIf="!showOtpInput" class="form-step">
            <div class="field">
              <label>Full Name</label>
              <div class="input-container">
                <span class="prefix-icon">👤</span>
                <input
                  formControlName="name"
                  placeholder="John Doe"
                  [class.error]="isInvalid('name')"
                />
              </div>
            </div>

            <div class="form-grid">
              <div class="field">
                <label>Email Address</label>
                <div class="input-container">
                  <span class="prefix-icon">✉️</span>
                  <input
                    formControlName="email"
                    type="email"
                    placeholder="john@example.com"
                    [class.error]="isInvalid('email')"
                  />
                </div>
              </div>
              <div class="field">
                <label>Mobile Number</label>
                <div class="input-container">
                  <span class="prefix-icon">📱</span>
                  <input
                    formControlName="mobile"
                    placeholder="10-digit #"
                    [class.error]="isInvalid('mobile')"
                  />
                </div>
              </div>
            </div>

            <div class="field">
              <label>Secure Password</label>
              <div class="input-container">
                <span class="prefix-icon">🔒</span>
                <input
                  formControlName="password"
                  type="password"
                  placeholder="••••••••"
                  [class.error]="isInvalid('password')"
                />
              </div>
              <div class="password-check" [class.met]="isStrongPassword()">
                <span class="check-dot"></span>
                <span class="check-text">6+ chars, 1 uppercase, 1 special character</span>
              </div>
            </div>
          </div>

          <!-- STEP 2: Email OTP -->
          <div *ngIf="showOtpInput" class="form-step fade-in">
            <div class="field centered">
              <label>6-Digit Verification Code</label>
              <input
                formControlName="otp"
                type="text"
                maxlength="6"
                class="otp-field"
                placeholder="000000"
              />
              <div class="otp-actions">
                <p>Didn't receive the code?</p>
                <button type="button" class="resend-btn" (click)="handleRequestOtp()">
                  Resend Code
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary-auth"
            [disabled]="loading || (registerForm.invalid && !showOtpInput)"
          >
            <span *ngIf="!loading">{{
              showOtpInput ? 'Complete Registration' : 'Send Security Code'
            }}</span>
            <span *ngIf="loading" class="auth-spinner"></span>
          </button>
        </form>

        <div class="auth-footer" *ngIf="!showOtpInput">
          <p>Already have an account? <a (click)="router.navigate(['/login'])">Sign In</a></p>
        </div>

        <div class="auth-footer" *ngIf="showOtpInput">
          <button class="btn-back-auth" (click)="showOtpInput = false">← Edit My Details</button>
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
        max-width: 500px;
        padding: 50px 40px;
        border-radius: 32px;
        border: 1px solid #222;
        text-align: center;
      }

      .brand-header {
        margin-bottom: 40px;
      }
      .k-tag {
        display: inline-block;
        font-weight: 900;
        color: #ff6600;
        letter-spacing: 2px;
        font-size: 0.7rem;
        border: 1px solid rgba(255, 102, 0, 0.3);
        padding: 4px 12px;
        border-radius: 50px;
        margin-bottom: 15px;
        background: rgba(255, 102, 0, 0.05);
      }

      h2 {
        font-size: 2.4rem;
        font-weight: 900;
        margin: 0;
        color: white;
        letter-spacing: -1.5px;
      }
      .subtitle {
        color: #666;
        font-size: 0.95rem;
        margin-top: 10px;
        line-height: 1.6;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 15px;
      }
      .field {
        text-align: left;
        margin-bottom: 24px;
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

      .input-container {
        position: relative;
      }
      .prefix-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.1rem;
        opacity: 0.5;
      }

      input {
        width: 100%;
        padding: 16px 20px 16px 48px;
        background: #111;
        border: 1px solid #222;
        border-radius: 14px;
        color: white;
        font-size: 1rem;
        font-family: inherit;
        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .form-grid input {
        padding: 16px 20px 16px 48px;
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

      .password-check {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        color: #444;
        font-size: 0.7rem;
        font-weight: 700;
        transition: 0.3s;
      }
      .check-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #333;
      }
      .password-check.met {
        color: #2ecc71;
      }
      .password-check.met .check-dot {
        background: #2ecc71;
        box-shadow: 0 0 8px #2ecc71;
      }

      .otp-field {
        padding: 15px;
        text-align: center;
        font-size: 2.2rem;
        letter-spacing: 12px;
        font-weight: 900;
        color: #ff6600;
        border-color: #ff6600;
        background: #000;
        margin-top: 10px;
      }
      .otp-actions {
        margin-top: 20px;
        font-size: 0.85rem;
        color: #555;
      }
      .resend-btn {
        background: none;
        border: none;
        color: #ff6600;
        font-weight: 800;
        cursor: pointer;
        text-decoration: underline;
        margin-left: 5px;
      }

      .btn-primary-auth {
        width: 100%;
        padding: 20px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 18px;
        font-weight: 900;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 10px;
        box-shadow: 0 10px 25px rgba(255, 107, 0, 0.3);
        letter-spacing: 0.5px;
      }

      .btn-primary-auth:hover:not(:disabled) {
        transform: translateY(-3px);
        filter: brightness(1.1);
        box-shadow: 0 15px 35px rgba(255, 107, 0, 0.4);
      }
      .btn-primary-auth:disabled {
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
      }
      .btn-back-auth {
        background: none;
        border: none;
        color: #555;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-back-auth:hover {
        color: #888;
      }

      .auth-spinner {
        display: inline-block;
        width: 22px;
        height: 22px;
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: #fff;
        border-radius: 50%;
        animation: auth-spin 0.8s linear infinite;
      }
      @keyframes auth-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 600px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
        .auth-card {
          padding: 40px 24px;
        }
        h2 {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);

  showOtpInput = false;
  loading = false;

  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    otp: [''],
  });

  isInvalid(field: string) {
    const control = this.registerForm.get(field);
    return control?.invalid && (control.dirty || control.touched);
  }

  isStrongPassword(): boolean {
    const pwd = this.registerForm.get('password')?.value || '';
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{6,})/;
    return regex.test(pwd);
  }

  onSubmit() {
    if (!this.showOtpInput) {
      this.handleRequestOtp();
    } else {
      this.handleRegister();
    }
  }

  handleRequestOtp() {
    if (this.registerForm.invalid || !this.isStrongPassword()) {
      this.registerForm.markAllAsTouched();
      this.toast.error('Please fix form errors and ensure a strong password.');
      return;
    }

    this.loading = true;
    this.authService.requestOtp(this.registerForm.get('email')?.value).subscribe({
      next: () => {
        this.showOtpInput = true;
        this.loading = false;
        this.toast.success('Verification code sent! Check your inbox.');
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.msg || 'Failed to send verification code.');
      },
    });
  }

  handleRegister() {
    if (!this.registerForm.get('otp')?.value) {
      this.toast.error('Please enter the verification code.');
      return;
    }

    this.loading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.toast.success('Registration successful! Welcome to the club.');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.msg || 'Registration failed. Check your code.');
      },
    });
  }
}
