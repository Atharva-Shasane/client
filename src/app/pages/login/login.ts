import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-box">
        <h2>Welcome Back</h2>
        <p class="subtitle">Login to access your orders</p>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email Address</label>
            <input
              [(ngModel)]="email"
              name="email"
              type="email"
              placeholder="user@killa.com"
              required
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" [disabled]="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="footer">
          <p>New to Killa? <a (click)="router.navigate(['/register'])">Create Account</a></p>
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
        min-height: 80vh;
        background: #f5f5f5;
      }

      .auth-box {
        width: 100%;
        max-width: 400px;
        padding: 2.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        text-align: center;
      }

      h2 {
        margin: 0;
        color: #333;
        font-size: 2rem;
      }
      .subtitle {
        color: #666;
        margin-bottom: 2rem;
      }

      .form-group {
        text-align: left;
        margin-bottom: 1.2rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        color: #444;
        font-weight: 500;
        font-size: 0.9rem;
      }
      input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-sizing: border-box;
        font-size: 1rem;
        transition: 0.3s;
      }
      input:focus {
        border-color: #ff6b00;
        outline: none;
      }

      button {
        width: 100%;
        background: #ff6b00;
        color: white;
        padding: 14px;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 1rem;
        font-size: 1rem;
        transition: 0.3s;
      }
      button:hover:not(:disabled) {
        background: #e65100;
      }
      button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .footer {
        margin-top: 2rem;
        font-size: 0.9rem;
        color: #666;
        border-top: 1px solid #eee;
        padding-top: 1rem;
      }
      a {
        color: #ff6b00;
        text-decoration: none;
        cursor: pointer;
        font-weight: bold;
      }
      a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  authService = inject(AuthService);
  router = inject(Router);

  onSubmit() {
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert('Invalid Credentials. Please try again.');
      },
    });
  }
}
