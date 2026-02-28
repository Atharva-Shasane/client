import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RatingService } from '../../services/rating';

@Component({
  selector: 'app-owner-feedback',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="admin-feedback-wrapper">
      <header class="dash-header">
        <div class="title-area">
          <span class="badge">Customer Intelligence</span>
          <h1>User <span class="highlight">Feedback</span></h1>
          <p>Real-time insights into customer experience and dish quality.</p>
        </div>

        <!-- Inline Stats -->
        <div class="quick-stats">
          <div class="mini-stat glass-card">
            <span class="stat-val">{{ feedback().length }}</span>
            <span class="stat-lbl">Total Reviews</span>
          </div>
          <div class="mini-stat glass-card border-accent">
            <span class="stat-val highlight">{{ getAverageRating() }}</span>
            <span class="stat-lbl">Avg. Rating</span>
          </div>
        </div>
      </header>

      <!-- Feedback Feed Grid -->
      <div class="feedback-grid" *ngIf="feedback().length > 0; else empty">
        <div class="feedback-card glass-card animate-pop" *ngFor="let item of feedback()">
          <div class="card-inner">
            <div class="card-top">
              <div class="user-info">
                <div class="avatar" [ngClass]="getRatingClass(item.rating)">
                  {{ item.userId?.name?.charAt(0) }}
                </div>
                <div class="u-details">
                  <span class="u-name">{{ item.userId?.name }}</span>
                  <span class="u-email">{{ item.userId?.email }}</span>
                </div>
              </div>
              <div class="rating-badge" [ngClass]="getRatingClass(item.rating)">
                <span class="num">{{ item.rating }}.0</span>
                <span class="stars">{{ '★'.repeat(item.rating) }}</span>
              </div>
            </div>

            <div class="card-content">
              <div class="quote-mark">“</div>
              <p class="comment-text">
                {{
                  item.comment ||
                    'The customer provided a rating without a detailed written review.'
                }}
              </p>
            </div>

            <div class="card-footer">
              <div class="meta-item">
                <span class="m-lbl">Order Ref</span>
                <span class="m-val">#{{ item.orderId?.orderNumber }}</span>
              </div>
              <div class="meta-item">
                <span class="m-lbl">Bill Amount</span>
                <span class="m-val">₹{{ item.orderId?.totalAmount }}</span>
              </div>
              <div class="meta-item text-right">
                <span class="m-lbl">Review Date</span>
                <span class="m-val">{{ item.createdAt | date: 'mediumDate' }}</span>
              </div>
            </div>

            <div class="rating-tag" [ngClass]="getRatingClass(item.rating)">
              {{ getRatingText(item.rating) }}
            </div>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-state glass-card">
          <div class="empty-visual">📭</div>
          <h3>No Feedback Yet</h3>
          <p>Customer reviews will populate here as soon as orders are finalized.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .admin-feedback-wrapper {
        background: #050505;
        min-height: 100vh;
        color: white;
        padding: 120px 40px 80px;
        font-family: 'Inter', sans-serif;
      }

      .dash-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 60px;
        gap: 30px;
        flex-wrap: wrap;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      h1 {
        font-size: 3.8rem;
        font-weight: 900;
        margin: 10px 0;
        letter-spacing: -2px;
        line-height: 1;
      }
      .highlight {
        color: #ff6600;
      }
      .dash-header p {
        color: #888;
        font-size: 1.1rem;
        max-width: 500px;
      }

      /* Compact Quick Stats */
      .quick-stats {
        display: flex;
        gap: 20px;
      }
      .mini-stat {
        padding: 25px 35px;
        border-radius: 24px;
        min-width: 180px;
        text-align: center;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .border-accent {
        border-color: rgba(255, 102, 0, 0.3);
      }
      .stat-val {
        display: block;
        font-size: 2.5rem;
        font-weight: 900;
        line-height: 1;
      }
      .stat-lbl {
        font-size: 0.75rem;
        font-weight: 800;
        color: #666;
        text-transform: uppercase;
        margin-top: 10px;
        letter-spacing: 1px;
      }

      /* Grid Layout */
      .feedback-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
        gap: 30px;
      }

      .feedback-card {
        border-radius: 32px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        position: relative;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .feedback-card:hover {
        transform: translateY(-10px);
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.03);
      }

      .card-inner {
        padding: 35px;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .avatar {
        width: 54px;
        height: 54px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 1.4rem;
        background: #111;
        border: 1px solid #222;
      }
      .u-name {
        display: block;
        font-weight: 800;
        font-size: 1.3rem;
        color: #ffffff;
        letter-spacing: -0.5px;
      }
      .u-email {
        font-size: 0.9rem;
        color: #888;
        font-weight: 500;
      }

      .rating-badge {
        text-align: right;
      }
      .rating-badge .num {
        display: block;
        font-size: 1.8rem;
        font-weight: 900;
        line-height: 1;
      }
      .rating-badge .stars {
        font-size: 1rem;
        letter-spacing: 2px;
        opacity: 1;
      }

      .card-content {
        flex-grow: 1;
        position: relative;
        padding: 15px 0 40px 25px;
      }
      .quote-mark {
        position: absolute;
        left: -10px;
        top: 0;
        font-size: 4rem;
        color: rgba(255, 255, 255, 0.05);
        font-family: serif;
        line-height: 1;
      }
      .comment-text {
        color: #ffffff;
        font-style: italic;
        line-height: 1.6;
        font-size: 1.25rem;
        position: relative;
        z-index: 1;
        font-weight: 500;
      }

      .card-footer {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        padding-top: 25px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .m-lbl {
        font-size: 0.7rem;
        font-weight: 800;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      .m-val {
        font-size: 0.95rem;
        font-weight: 800;
        color: #ffffff;
      }
      .text-right {
        text-align: right;
      }

      /* COLOR THEMES - Lighter versions for readability */
      .rate-excellent {
        color: #00ff88;
      }
      .rate-excellent.avatar {
        border-color: #00ff88;
        color: #00ff88;
        background: rgba(0, 255, 136, 0.1);
      }

      .rate-good {
        color: #ffcc00;
      }
      .rate-good.avatar {
        border-color: #ffcc00;
        color: #ffcc00;
        background: rgba(255, 204, 0, 0.1);
      }

      .rate-poor {
        color: #ff4444;
      }
      .rate-poor.avatar {
        border-color: #ff4444;
        color: #ff4444;
        background: rgba(255, 68, 68, 0.1);
      }

      .empty-state {
        text-align: center;
        padding: 120px 40px;
        border-radius: 40px;
      }
      .empty-visual {
        font-size: 6rem;
        margin-bottom: 30px;
        opacity: 0.2;
      }

      .glass-card {
        background: rgba(18, 18, 18, 0.7);
        backdrop-filter: blur(30px);
      }

      .animate-pop {
        animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.92);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @media (max-width: 1400px) {
        .feedback-grid {
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        }
      }

      @media (max-width: 768px) {
        .dash-header {
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 40px;
        }
        .feedback-grid {
          grid-template-columns: 1fr;
        }
        .admin-feedback-wrapper {
          padding: 100px 20px;
        }
        h1 {
          font-size: 2.8rem;
        }
      }
    `,
  ],
})
export class OwnerFeedbackComponent implements OnInit {
  private ratingService = inject(RatingService);
  feedback = signal<any[]>([]);

  ngOnInit() {
    this.ratingService.getAdminFeedback().subscribe((data) => this.feedback.set(data));
  }

  getAverageRating(): string {
    if (this.feedback().length === 0) return '0.0';
    const sum = this.feedback().reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / this.feedback().length).toFixed(1);
  }

  getRatingClass(rating: number): string {
    if (rating >= 4) return 'rate-excellent';
    if (rating === 3) return 'rate-good';
    return 'rate-poor';
  }

  getRatingText(rating: number): string {
    if (rating >= 5) return 'Exceptional';
    if (rating >= 4) return 'Very Good';
    if (rating >= 3) return 'Average';
    if (rating >= 2) return 'Below Average';
    return 'Critical';
  }
}
