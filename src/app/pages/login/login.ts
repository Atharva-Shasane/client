import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
    <div class="auth-container">
      <div class="auth-box glass-card">
        <h2>{{ showOtpInput ? 'Owner Verification' : 'Welcome Back' }}</h2>
        <p class="subtitle">
          {{
            showOtpInput
              ? 'Enter the security code sent to your email'
              : 'Access your Killa Resto account'
          }}
        </p>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Normal Login Fields -->
          <div *ngIf="!showOtpInput">
            <div class="form-group">
              <label>Email Address</label>
              <input
                formControlName="email"
                type="email"
                placeholder="owner@killa.com"
                [class.invalid]="isInvalid('email')"
              />
              <div class="error-msg" *ngIf="isInvalid('email')">
                <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="loginForm.get('email')?.errors?.['email']"
                  >Please enter a valid email address</span
                >
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <input
                formControlName="password"
                type="password"
                placeholder="********"
                [class.invalid]="isInvalid('password')"
              />
              <div class="error-msg" *ngIf="isInvalid('password')">
                Password must be at least 6 characters.
              </div>
            </div>
          </div>

          <!-- Owner OTP Field (Only shown if server identifies as Owner) -->
          <div *ngIf="showOtpInput" class="otp-section">
            <div class="form-group">
              <label>6-Digit Security Code</label>
              <input
                formControlName="otp"
                type="text"
                placeholder="000000"
                maxlength="6"
                class="otp-input"
                [class.invalid]="isInvalid('otp')"
              />
              <p class="hint">Check your email (or server console) for the code.</p>
              <div class="error-msg" *ngIf="isInvalid('otp')">
                Please enter the 6-digit verification code.
              </div>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="
              loading ||
              (loginForm.invalid && !showOtpInput) ||
              (showOtpInput && loginForm.get('otp')?.invalid)
            "
            class="main-btn"
          >
            <span *ngIf="loading">Verifying...</span>
            <span *ngIf="!loading">{{ showOtpInput ? 'Verify & Dashboard' : 'Login' }}</span>
          </button>

          <button *ngIf="showOtpInput" type="button" (click)="resetLoginFlow()" class="btn-link">
            Back to Password Login
          </button>
        </form>

        <div class="footer" *ngIf="!showOtpInput">
          <p>Don't have an account? <a (click)="router.navigate(['/register'])">Register Now</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 85vh;
        background: #f8f9fa;
        padding: 20px;
      }
      .auth-box {
        width: 100%;
        max-width: 400px;
        padding: 2.5rem;
        text-align: center;
        background: white;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      }
      h2 {
        margin: 0;
        color: #1a1a1a;
        font-size: 1.8rem;
        font-weight: 800;
      }
      .subtitle {
        color: #666;
        margin-bottom: 2rem;
        font-size: 0.9rem;
        margin-top: 10px;
      }
      .form-group {
        text-align: left;
        margin-bottom: 1.5rem;
        position: relative;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 600;
        font-size: 0.85rem;
      }
      input {
        width: 100%;
        padding: 14px;
        border: 2px solid #eee;
        border-radius: 10px;
        box-sizing: border-box;
        font-size: 1rem;
        transition: 0.3s;
      }
      input:focus {
        border-color: #ff6b00;
        outline: none;
        background: #fffcf9;
      }
      input.invalid {
        border-color: #ff4444;
        background: #fff8f8;
      }
      .error-msg {
        color: #ff4444;
        font-size: 0.75rem;
        margin-top: 5px;
        font-weight: 600;
        animation: fadeIn 0.3s;
      }
      .otp-input {
        text-align: center;
        font-size: 1.6rem;
        letter-spacing: 10px;
        font-weight: 800;
        border-color: #ff6b00;
        color: #333;
      }
      .hint {
        color: #ff6b00;
        font-size: 0.75rem;
        margin-top: 10px;
        font-weight: bold;
      }
      .main-btn {
        width: 100%;
        background: #ff6b00;
        color: white;
        padding: 16px;
        border: none;
        border-radius: 12px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 1rem;
        font-size: 1.05rem;
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
        transition: 0.3s;
      }
      .main-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
        box-shadow: none;
      }
      .btn-link {
        background: none;
        color: #666;
        font-size: 0.85rem;
        margin-top: 20px;
        border: none;
        text-decoration: underline;
        cursor: pointer;
      }
      .footer {
        margin-top: 2.5rem;
        font-size: 0.9rem;
        color: #666;
        border-top: 1px solid #eee;
        padding-top: 1.5rem;
      }
      a {
        color: #ff6b00;
        text-decoration: none;
        cursor: pointer;
        font-weight: bold;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  showOtpInput = false;
  loading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    otp: [''],
  });

  isInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  resetLoginFlow() {
    this.showOtpInput = false;
    this.loginForm.get('otp')?.clearValidators();
    this.loginForm.get('otp')?.setValue('');
    this.loginForm.get('otp')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.loginForm.invalid && !this.showOtpInput) {
      this.loginForm.markAllAsTouched();
      this.toast.error('Please fix the errors in the form.');
      return;
    }

    this.loading = true;
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.requiresOtp) {
          this.toast.info('Owner verification required. Checking security...');
          this.showOtpInput = true;
          this.loginForm
            .get('otp')
            ?.setValidators([Validators.required, Validators.pattern('^[0-9]{6}$')]);
          this.loginForm.get('otp')?.updateValueAndValidity();
          this.cdr.detectChanges();
        } else {
          this.authService.handleAuthSuccess(res);
          this.toast.success('Successfully logged in!');
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.msg || 'Invalid email or password.');
      },
    });
  }
}
