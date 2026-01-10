import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="profile-wrapper container">
      <div class="profile-card glass-card fade-in">
        <!-- Profile Header -->
        <div class="header">
          <div class="avatar-box">
            <div class="avatar">{{ user()?.name?.charAt(0) }}</div>
            <div class="online-indicator"></div>
          </div>
          <h2>{{ user()?.name }}</h2>
          <span class="role-badge">{{ user()?.role }}</span>
        </div>

        <!-- Details Grid -->
        <div class="details-grid">
          <div class="info-row">
            <span class="label">Email Address</span>
            <span class="value text-truncate">{{ user()?.email }}</span>
          </div>
          <div class="info-row">
            <span class="label">Mobile Number</span>
            <span class="value">{{ user()?.mobile || 'Not set' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Member Since</span>
            <span class="value">{{ user()?.createdAt | date : 'longDate' }}</span>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="actions">
          <button (click)="authService.logout()" class="logout-btn">Sign Out Account</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-wrapper {
        min-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }
      .profile-card {
        width: 100%;
        max-width: 500px;
        padding: 50px 40px;
        text-align: center;
        position: relative;
      }

      /* Avatar Section */
      .avatar-box {
        position: relative;
        width: 110px;
        height: 110px;
        margin: 0 auto 20px;
      }
      .avatar {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #ff6600, #e65100);
        color: white;
        font-size: 3.5rem;
        font-weight: 900;
        border-radius: 35% 65% 65% 35% / 30% 30% 70% 70%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-transform: uppercase;
        box-shadow: 0 10px 30px rgba(255, 107, 0, 0.4);
      }
      .online-indicator {
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 20px;
        height: 20px;
        background: #2ecc71;
        border: 4px solid #161616;
        border-radius: 50%;
      }

      h2 {
        font-size: 2rem;
        font-weight: 800;
        margin: 15px 0 5px;
      }
      .role-badge {
        display: inline-block;
        padding: 5px 15px;
        background: rgba(255, 102, 0, 0.1);
        color: #ff6600;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Details */
      .details-grid {
        margin: 40px 0;
        text-align: left;
      }
      .info-row {
        padding: 15px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .label {
        display: block;
        font-size: 0.7rem;
        color: #666;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .value {
        display: block;
        font-size: 1rem;
        color: #eee;
        font-weight: 600;
      }

      /* Action */
      .logout-btn {
        width: 100%;
        padding: 18px;
        background: #222;
        color: #ff4444;
        border: 1px solid rgba(255, 68, 68, 0.1);
        border-radius: 16px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.3s;
      }
      .logout-btn:hover {
        background: rgba(255, 68, 68, 0.1);
        transform: translateY(-2px);
      }

      .text-truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @media (max-width: 500px) {
        .profile-card {
          padding: 40px 24px;
          border-radius: 0;
          height: 100vh;
          max-width: 100%;
        }
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
      error: () => this.loading.set(false),
    });
  }
}
