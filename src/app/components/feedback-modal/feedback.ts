import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  ChangeDetectorRef,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService } from '../../services/rating';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="feedback-overlay" *ngIf="isVisible">
      <div class="feedback-card glass-card animate-slide-up">
        <header class="header">
          <span class="badge">Dining Experience</span>
          <h2>{{ isViewOnly ? 'Review Summary' : 'Rate Your Feast' }}</h2>
          <p class="order-info">Ref: #{{ orderNumber }}</p>
        </header>

        <div class="body">
          <!-- Dish Breakdown -->
          <div class="granular-section" *ngIf="items && items.length > 0">
            <span class="section-lbl">Dish Ratings</span>
            <div class="dish-scroller">
              <div class="dish-item" *ngFor="let item of items; let i = index">
                <span class="d-name text-truncate">{{ item.name }}</span>
                <div class="d-stars">
                  <button
                    *ngFor="let s of [1, 2, 3, 4, 5]"
                    (click)="!isViewOnly && setDishRating(item.menuItemId || item._id, s)"
                    [class.active]="(dishRatingsMap.get(item.menuItemId || item._id) || 0) >= s"
                    class="star-btn"
                    [disabled]="isViewOnly"
                  >
                    ★
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Overall Experience -->
          <div class="overall-section">
            <span class="section-lbl">Overall Satisfaction</span>
            <div class="main-stars">
              <button
                *ngFor="let s of [1, 2, 3, 4, 5]"
                (click)="!isViewOnly && overallRating.set(s)"
                [class.active]="overallRating() >= s"
                class="star-lg"
                [disabled]="isViewOnly"
              >
                ★
              </button>
            </div>
          </div>

          <!-- Written Review -->
          <div class="comment-section">
            <span class="section-lbl">Any Comments?</span>
            <textarea
              [(ngModel)]="comment"
              [readonly]="isViewOnly"
              placeholder="Tell us about the flavors, the service, or the vibe..."
              maxlength="500"
            ></textarea>
          </div>

          <!-- OWNER REPLY FEATURE: Restored with high-visibility styling -->
          <div class="reply-container fade-in" *ngIf="ownerReply">
            <div class="reply-card">
              <span class="r-lbl">Kitchen Response</span>
              <p class="r-text">{{ ownerReply }}</p>
            </div>
          </div>
        </div>

        <footer class="footer">
          <button class="btn-dismiss" (click)="onDismiss()">
            {{ isViewOnly ? 'Close' : 'Maybe Later' }}
          </button>
          <button
            *ngIf="!isViewOnly"
            class="btn-submit"
            [disabled]="overallRating() === 0 || isSubmitting()"
            (click)="onSubmit()"
          >
            {{ isSubmitting() ? 'Sending...' : 'Submit Review' }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      .feedback-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .glass-card {
        background: #0a0a0a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        width: 100%;
        max-width: 450px;
        overflow: hidden;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
      }
      .header {
        padding: 30px 30px 20px;
        text-align: center;
      }
      .badge {
        background: rgba(255, 102, 0, 0.1);
        color: #ff6600;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
      }
      .body {
        padding: 0 30px 30px;
        overflow-y: auto;
      }
      .section-lbl {
        display: block;
        font-size: 0.75rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .dish-scroller {
        max-height: 180px;
        overflow-y: auto;
        margin-bottom: 25px;
        padding-right: 5px;
      }
      .dish-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        background: rgba(255, 255, 255, 0.03);
        padding: 10px 15px;
        border-radius: 12px;
      }
      .star-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #222;
        cursor: pointer;
        transition: 0.2s;
      }
      .star-btn.active {
        color: #ffc107;
      }
      .main-stars {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 25px;
      }
      .star-lg {
        background: none;
        border: none;
        font-size: 2.5rem;
        color: #222;
        cursor: pointer;
      }
      .star-lg.active {
        color: #ff6600;
        text-shadow: 0 0 20px rgba(255, 102, 0, 0.4);
      }
      textarea {
        width: 100%;
        background: #111;
        border: 1px solid #222;
        border-radius: 12px;
        color: #fff;
        padding: 15px;
        font-family: inherit;
        resize: none;
        height: 100px;
      }

      /* REPLY UI - RESTORED FEATURE */
      .reply-container {
        margin-top: 25px;
        padding-top: 20px;
        border-top: 1px dashed #222;
        animation: fadeIn 0.5s ease;
      }
      .reply-card {
        background: rgba(255, 102, 0, 0.08);
        padding: 18px;
        border-radius: 15px;
        border-left: 4px solid #ff6600;
      }
      .r-lbl {
        font-size: 0.7rem;
        font-weight: 900;
        color: #ff6600;
        text-transform: uppercase;
        display: block;
        margin-bottom: 8px;
        letter-spacing: 1px;
      }
      .r-text {
        color: #ffffff;
        line-height: 1.6;
        font-size: 0.95rem;
        font-weight: 500;
        font-style: italic;
      }

      .footer {
        padding: 20px 30px;
        display: flex;
        gap: 15px;
        background: rgba(255, 255, 255, 0.02);
      }
      .btn-dismiss {
        flex: 1;
        background: transparent;
        border: 1px solid #333;
        color: #aaa;
        padding: 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 700;
      }
      .btn-submit {
        flex: 2;
        background: #ff6600;
        color: #fff;
        border: none;
        padding: 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 800;
        box-shadow: 0 10px 20px rgba(255, 102, 0, 0.2);
      }
      .btn-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .animate-slide-up {
        animation: slideUp 0.3s ease-out;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class FeedbackModalComponent implements OnChanges {
  private ratingService = inject(RatingService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  @Input() isVisible = false;
  @Input() isViewOnly = false;
  @Input() orderId = '';
  @Input() orderNumber = '';
  @Input() items: any[] = [];
  @Input() ownerReply = '';
  @Input() initialRating = 0;
  @Input() initialComment = '';
  @Input() dishRatings: any[] = [];

  // Match the event names expected by MyOrdersComponent
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  overallRating = signal(0);
  comment = '';
  isSubmitting = signal(false);
  dishRatingsMap = new Map<string, number>();

  ngOnChanges() {
    if (this.isVisible) {
      this.overallRating.set(this.initialRating || 0);
      this.comment = this.initialComment || '';

      this.dishRatingsMap.clear();
      if (this.dishRatings && this.dishRatings.length > 0) {
        this.dishRatings.forEach((dr) => {
          this.dishRatingsMap.set(dr.menuItemId, dr.rating);
        });
      } else if (this.items) {
        this.items.forEach((item) => {
          const id = item.menuItemId || item._id;
          if (id) this.dishRatingsMap.set(id, 0);
        });
      }
    }
  }

  setDishRating(menuItemId: string, score: number) {
    this.dishRatingsMap.set(menuItemId, score);
    this.cdr.detectChanges();
  }

  onDismiss() {
    if (!this.isViewOnly && this.overallRating() === 0) {
      this.ratingService
        .submitFeedback({
          orderId: this.orderId,
          rating: 0,
          comment: 'USER DISMISSED',
        })
        .subscribe();
    }
    this.isVisible = false;
    this.close.emit();
  }

  onSubmit() {
    if (this.overallRating() === 0 || !this.orderId) return;

    this.isSubmitting.set(true);

    const dishRatingsPayload = Array.from(this.dishRatingsMap.entries()).map(([id, score]) => ({
      menuItemId: id,
      rating: score || this.overallRating(),
    }));

    const payload = {
      orderId: this.orderId,
      rating: this.overallRating(),
      comment: this.comment,
      dishRatings: dishRatingsPayload,
    };

    this.ratingService.submitFeedback(payload).subscribe({
      next: () => {
        this.toastService.show('Thank you for your feedback!', 'success');
        this.isVisible = false;
        this.isSubmitting.set(false);
        this.refresh.emit();
        this.close.emit();
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.msg || 'Failed to submit feedback';
        this.toastService.show(errorMsg, 'error');

        if (errorMsg.includes('already')) {
          this.isVisible = false;
          this.close.emit();
        }
      },
    });
  }
}
