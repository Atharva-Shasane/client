import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-box">
        <h2>Join Killa Resto</h2>
        <p class="subtitle">Create an account to order food</p>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Full Name</label>
            <input [(ngModel)]="name" name="name" placeholder="John Doe" required />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input
              [(ngModel)]="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label>Mobile Number</label>
            <input [(ngModel)]="mobile" name="mobile" placeholder="9876543210" required />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              placeholder="Min 6 chars"
              required
            />
          </div>

          <button type="submit" [disabled]="loading">
            {{ loading ? 'Creating Account...' : 'Register' }}
          </button>
        </form>

        <div class="footer">
          <p>Already have an account? <a (click)="router.navigate(['/login'])">Login</a></p>
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
        background: #333;
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
        background: #000;
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
export class RegisterComponent {
  name = '';
  email = '';
  mobile = '';
  password = '';
  loading = false;

  authService = inject(AuthService);
  router = inject(Router);

  onSubmit() {
    this.loading = true;
    this.authService
      .register({
        name: this.name,
        email: this.email,
        mobile: this.mobile,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          alert('Registration Successful! Please Login.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          alert('Registration Failed. Email might be in use.');
        },
      });
  }
}
