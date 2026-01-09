import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
    <div class="auth-container">
      <div class="auth-box glass-card">
        <h2>{{ showOtpInput ? 'Verify Your Email' : 'Join Killa Resto' }}</h2>
        <p class="subtitle">
          {{
            showOtpInput
              ? 'We sent a 6-digit code to ' + registerForm.get('email')?.value
              : 'Create an account to start ordering'
          }}
        </p>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- STEP 1: Registration Details -->
          <div *ngIf="!showOtpInput">
            <div class="form-group">
              <label>Full Name</label>
              <input
                formControlName="name"
                placeholder="John Doe"
                [class.invalid]="isInvalid('name')"
              />
              <div class="error-msg" *ngIf="isInvalid('name')">Name is required.</div>
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input
                formControlName="email"
                type="email"
                placeholder="john@example.com"
                [class.invalid]="isInvalid('email')"
              />
              <div class="error-msg" *ngIf="isInvalid('email')">
                <span *ngIf="registerForm.get('email')?.errors?.['email']"
                  >Please enter a valid email.</span
                >
                <span *ngIf="registerForm.get('email')?.errors?.['required']"
                  >Email is required.</span
                >
              </div>
            </div>

            <div class="form-group">
              <label>Mobile Number</label>
              <input
                formControlName="mobile"
                placeholder="10-digit mobile number"
                [class.invalid]="isInvalid('mobile')"
              />
              <div class="error-msg" *ngIf="isInvalid('mobile')">
                10-digit mobile number is required.
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <input
                formControlName="password"
                type="password"
                placeholder="Min 6 characters"
                [class.invalid]="isInvalid('password')"
              />
              <div class="error-msg" *ngIf="isInvalid('password')">
                Password must be at least 6 characters.
              </div>
            </div>
          </div>

          <!-- STEP 2: OTP Verification -->
          <div *ngIf="showOtpInput" class="otp-section">
            <div class="form-group">
              <label>Verification Code</label>
              <input
                formControlName="otp"
                type="text"
                placeholder="000000"
                maxlength="6"
                class="otp-input"
                [class.invalid]="isInvalid('otp')"
              />
              <p class="resend-hint">Check your email or server console for the code.</p>
              <div class="error-msg" *ngIf="isInvalid('otp')">Valid 6-digit code is required.</div>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="
              loading ||
              (registerForm.invalid && !showOtpInput) ||
              (showOtpInput && registerForm.get('otp')?.invalid)
            "
            class="main-btn"
          >
            <span *ngIf="loading">Processing...</span>
            <span *ngIf="!loading">{{
              showOtpInput ? 'Complete Registration' : 'Send Verification Code'
            }}</span>
          </button>

          <button
            *ngIf="showOtpInput"
            type="button"
            (click)="showOtpInput = false"
            class="btn-link"
          >
            Edit Details
          </button>
        </form>

        <div class="footer" *ngIf="!showOtpInput">
          <p>Already have an account? <a (click)="router.navigate(['/login'])">Login here</a></p>
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
        max-width: 420px;
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
        margin-bottom: 1.2rem;
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
        padding: 12px;
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
      }
      .resend-hint {
        font-size: 0.75rem;
        color: #ff6b00;
        margin-top: 10px;
        font-weight: 600;
      }
      .main-btn {
        width: 100%;
        background: #333;
        color: white;
        padding: 16px;
        border: none;
        border-radius: 12px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 1rem;
        font-size: 1rem;
        transition: 0.3s;
      }
      .main-btn:not(:disabled) {
        background: #ff6b00;
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
      }
      .main-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      .btn-link {
        background: none;
        color: #666;
        font-size: 0.85rem;
        margin-top: 15px;
        border: none;
        text-decoration: underline;
        cursor: pointer;
      }
      .footer {
        margin-top: 2rem;
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  showOtpInput = false;
  loading = false;

  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    otp: [''],
  });

  isInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (!this.showOtpInput) {
      this.handleStepOne();
    } else {
      this.handleStepTwo();
    }
  }

  handleStepOne() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toast.error('Please check all registration details.');
      return;
    }

    this.loading = true;
    this.authService.requestOtp(this.registerForm.get('email')?.value).subscribe({
      next: () => {
        this.loading = false;
        this.showOtpInput = true;
        this.registerForm
          .get('otp')
          ?.setValidators([Validators.required, Validators.pattern('^[0-9]{6}$')]);
        this.registerForm.get('otp')?.updateValueAndValidity();
        this.cdr.detectChanges();
        this.toast.success('Verification code sent! Please check your email.');
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.msg || 'Could not send OTP.');
      },
    });
  }

  handleStepTwo() {
    if (this.registerForm.get('otp')?.invalid) {
      this.registerForm.get('otp')?.markAsTouched();
      this.toast.error('Invalid verification code.');
      return;
    }

    this.loading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Registration complete! Welcome to Killa Resto.');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.msg || 'Verification failed.');
      },
    });
  }
}
