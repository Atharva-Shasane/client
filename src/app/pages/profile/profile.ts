import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="profile-container">
      <h2>My Profile</h2>

      <div *ngIf="loading()" class="loading">Loading details...</div>

      <div *ngIf="user()" class="profile-card">
        <div class="avatar-section">
          <div class="avatar">
            {{ user()?.name?.charAt(0) }}
          </div>
          <h3>{{ user()?.name }}</h3>
          <span class="role-badge">{{ user()?.role }}</span>
        </div>

        <div class="details-section">
          <div class="detail-row">
            <span class="label">Email</span>
            <span class="value">{{ user()?.email }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Mobile</span>
            <!-- ✅ Mobile is now in the interface -->
            <span class="value">{{ user()?.mobile || 'Not set' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Member Since</span>
            <!-- ✅ Fixed syntax error and removed 'as any' cast -->
            <span class="value">{{ user()?.createdAt | date : 'mediumDate' }}</span>
          </div>
        </div>

        <button (click)="authService.logout()" class="logout-btn">Logout</button>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-container {
        max-width: 500px;
        margin: 3rem auto;
        padding: 0 20px;
      }
      h2 {
        text-align: center;
        border-bottom: 3px solid #ff6b00;
        display: inline-block;
        padding-bottom: 5px;
        margin-bottom: 2rem;
        width: 100%;
      }

      .loading {
        text-align: center;
        color: #666;
      }

      .profile-card {
        background: white;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        padding: 2rem;
      }

      .avatar-section {
        text-align: center;
        margin-bottom: 2rem;
      }
      .avatar {
        width: 80px;
        height: 80px;
        background: #ff6b00;
        color: white;
        font-size: 2.5rem;
        font-weight: bold;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem auto;
        text-transform: uppercase;
      }
      h3 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
      }
      .role-badge {
        background: #eee;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.5rem;
        display: inline-block;
      }

      .details-section {
        margin-bottom: 2rem;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 1rem 0;
        border-bottom: 1px solid #eee;
      }
      .label {
        color: #888;
        font-weight: 500;
      }
      .value {
        color: #333;
        font-weight: 600;
      }

      .logout-btn {
        width: 100%;
        padding: 12px;
        background: #333;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.3s;
      }
      .logout-btn:hover {
        background: #ff4444;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);

  user = signal<User | null>(null);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.user.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }
}
