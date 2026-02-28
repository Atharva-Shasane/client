import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService } from '../../services/rating';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-owner-feedback',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="admin-feedback-wrapper">
      <header class="dash-header">
        <div class="title-area">
          <span class="badge">Engagement Intelligence</span>
          <h1>User <span class="highlight">Feedback</span></h1>
          <p>Analyzing customer tone, dish performance, and satisfaction levels.</p>
        </div>

        <div class="header-stats">
          <div class="h-stat glass-card">
            <span class="s-val">{{ feedback().length }}</span>
            <span class="s-lbl">Total Reviews</span>
          </div>
          <div class="h-stat glass-card border-accent">
            <span class="s-val highlight">{{ getAverageRating() }}</span>
            <span class="s-lbl">Avg Score</span>
          </div>
        </div>
      </header>

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

            <!-- Itemized breakdown for context -->
            <div class="dish-breakdown" *ngIf="item.dishRatings?.length">
              <div class="dish-pill" *ngFor="let dr of item.dishRatings">
                <span class="d-name">{{ dr.name }}</span>
                <span class="d-score">★{{ dr.rating }}</span>
              </div>
            </div>

            <div class="card-content">
              <p class="comment-text">
                "{{ item.comment || 'The customer provided a rating without a written review.' }}"
              </p>
            </div>

            <!-- Owner Response Loop -->
            <div class="reply-section">
              <div *ngIf="item.ownerReply && !item.showReply" class="existing-reply">
                <span class="reply-lbl">Response Sent</span>
                <p class="reply-val">{{ item.ownerReply }}</p>
                <button (click)="toggleReplyEdit(item)" class="btn-edit">Modify Reply</button>
              </div>

              <div *ngIf="!item.ownerReply || item.showReply" class="reply-form">
                <textarea
                  [(ngModel)]="item.newReply"
                  placeholder="Address customer concerns..."
                  maxlength="500"
                ></textarea>
                <div class="reply-actions">
                  <button
                    (click)="submitReply(item)"
                    class="btn-send"
                    [disabled]="!item.newReply || item.loading"
                  >
                    {{ item.loading ? '...' : item.ownerReply ? 'Update' : 'Reply' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="meta-item">
                <span class="m-lbl">Order Ref</span>
                <span class="m-val">#{{ item.orderId?.orderNumber }}</span>
              </div>
              <!-- Re-added Date display to fix compiler warning -->
              <div class="meta-item">
                <span class="m-lbl">Submitted</span>
                <span class="m-val">{{ item.createdAt | date: 'MMM d, y' }}</span>
              </div>
              <div class="meta-item text-right">
                <span class="m-lbl">AI Mood</span>
                <span class="m-val sentiment" [ngClass]="getSentimentClass(item.sentimentScore)">
                  {{ getSentimentText(item.sentimentScore) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-state glass-card">
          <div class="empty-visual">📭</div>
          <h3>Inbox Empty</h3>
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
        padding: 80px 30px;
        font-family: 'Inter', sans-serif;
      }
      .dash-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 40px;
        flex-wrap: wrap;
        gap: 20px;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      h1 {
        font-size: 2.2rem;
        font-weight: 900;
        margin: 5px 0;
        letter-spacing: -1.5px;
      }
      .highlight {
        color: #ff6600;
      }
      .dash-header p {
        color: #555;
        font-size: 0.95rem;
        max-width: 450px;
      }

      .header-stats {
        display: flex;
        gap: 12px;
      }
      .h-stat {
        padding: 12px 20px;
        border-radius: 16px;
        min-width: 120px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .s-val {
        display: block;
        font-size: 1.6rem;
        font-weight: 900;
        line-height: 1;
      }
      .s-lbl {
        font-size: 0.55rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        margin-top: 6px;
        letter-spacing: 1px;
      }

      .feedback-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 20px;
      }
      .feedback-card {
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(18, 18, 18, 0.4);
        backdrop-filter: blur(10px);
      }
      .card-inner {
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .avatar {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        background: #111;
        font-size: 1.1rem;
      }
      .u-name {
        display: block;
        font-weight: 800;
        font-size: 0.95rem;
        color: #fff;
      }
      .u-email {
        font-size: 0.7rem;
        color: #444;
      }

      .rating-badge {
        text-align: right;
      }
      .rating-badge .num {
        display: block;
        font-size: 1.2rem;
        font-weight: 900;
        line-height: 1;
      }
      .rating-badge .stars {
        font-size: 0.75rem;
        letter-spacing: 1px;
      }

      .dish-breakdown {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 15px;
      }
      .dish-pill {
        background: #000;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid #1a1a1a;
        font-size: 0.65rem;
        display: flex;
        gap: 6px;
      }
      .dish-pill .d-name {
        color: #666;
      }
      .dish-pill .d-score {
        color: #ffcc00;
        font-weight: 800;
      }

      .comment-text {
        color: #eee;
        font-style: italic;
        line-height: 1.4;
        font-size: 0.95rem;
        margin-bottom: 18px;
      }

      .reply-section {
        margin-bottom: 15px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        border: 1px dashed #222;
      }
      .reply-lbl {
        font-size: 0.55rem;
        font-weight: 900;
        color: #ff6600;
        text-transform: uppercase;
        margin-bottom: 4px;
        display: block;
      }
      .reply-val {
        font-size: 0.8rem;
        color: #888;
        margin-bottom: 8px;
        line-height: 1.3;
      }
      .btn-edit {
        background: none;
        border: none;
        color: #333;
        font-size: 0.6rem;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
      }

      textarea {
        width: 100%;
        background: #000;
        border: 1px solid #222;
        border-radius: 8px;
        padding: 8px;
        color: white;
        font-family: inherit;
        font-size: 0.8rem;
        resize: none;
        height: 60px;
      }
      .reply-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
      .btn-send {
        background: #ff6600;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 6px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.7rem;
        transition: 0.2s;
      }
      .btn-send:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        padding-top: 15px;
        border-top: 1px solid #111;
        margin-top: auto;
      }
      .m-lbl {
        font-size: 0.5rem;
        color: #333;
        font-weight: 900;
        text-transform: uppercase;
        display: block;
      }
      .m-val {
        font-size: 0.75rem;
        font-weight: 700;
        color: #aaa;
      }
      .sentiment {
        font-weight: 900;
      }
      .s-pos {
        color: #00ff88;
      }
      .s-neg {
        color: #ff4444;
      }
      .s-neu {
        color: #555;
      }

      .rate-excellent {
        color: #00ff88;
      }
      .rate-excellent.avatar {
        border-color: #00ff88;
        color: #00ff88;
        background: rgba(0, 255, 136, 0.05);
      }
      .rate-good {
        color: #ffcc00;
      }
      .rate-good.avatar {
        border-color: #ffcc00;
        color: #ffcc00;
        background: rgba(255, 204, 0, 0.05);
      }
      .rate-poor {
        color: #ff4444;
      }
      .rate-poor.avatar {
        border-color: #ff4444;
        color: #ff4444;
        background: rgba(255, 68, 68, 0.05);
      }

      .empty-state {
        text-align: center;
        padding: 60px 40px;
        border-radius: 30px;
      }
      .empty-visual {
        font-size: 3rem;
        opacity: 0.1;
        margin-bottom: 15px;
      }
    `,
  ],
})
export class OwnerFeedbackComponent implements OnInit {
  private ratingService = inject(RatingService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  feedback = signal<any[]>([]);

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.ratingService.getAdminFeedback().subscribe((data) => {
      const processed = data.map((f) => ({
        ...f,
        showReply: false,
        newReply: f.ownerReply || '',
        loading: false,
      }));
      this.feedback.set(processed);
    });
  }

  getAverageRating(): string {
    if (!this.feedback().length) return '0.0';
    const sum = this.feedback().reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / this.feedback().length).toFixed(1);
  }

  getRatingClass(rating: number) {
    if (rating >= 4) return 'rate-excellent';
    if (rating === 3) return 'rate-good';
    return 'rate-poor';
  }

  getSentimentText(score: number): string {
    if (score > 0.3) return 'Excellent Tone';
    if (score > 0.05) return 'Positive';
    if (score < -0.3) return 'Highly Dissatisfied';
    if (score < -0.05) return 'Negative';
    return 'Neutral';
  }

  getSentimentClass(score: number): string {
    if (score > 0.05) return 's-pos';
    if (score < -0.05) return 's-neg';
    return 's-neu';
  }

  toggleReplyEdit(item: any) {
    item.showReply = true;
    this.cdr.detectChanges();
  }

  submitReply(item: any) {
    // FIX for NG0100: Use a macrotask for safer lifecycle state changes
    setTimeout(() => {
      item.loading = true;
      this.cdr.detectChanges();

      this.ratingService.replyToFeedback(item._id, item.newReply).subscribe({
        next: (res) => {
          this.toast.success('Response published.');
          item.ownerReply = res.ownerReply;
          item.showReply = false;
          item.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toast.error('Submission failed.');
          item.loading = false;
          this.cdr.detectChanges();
        },
      });
    }, 0);
  }
}
