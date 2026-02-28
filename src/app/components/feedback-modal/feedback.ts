import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  ChangeDetectorRef,
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
          <span class="badge">Order Feedback</span>
          <h2>{{ isViewOnly ? 'Your Feedback' : 'Rate Your Experience' }}</h2>
          <p class="order-info">Order #{{ orderNumber }}</p>
        </header>

        <div class="body">
          <!-- Context: What they ordered -->
          <div class="order-summary" *ngIf="items && items.length > 0">
            <span class="label">You Ordered</span>
            <div class="item-list">
              <span class="item-tag" *ngFor="let item of items">
                {{ item.quantity }}x {{ item.name }}
              </span>
            </div>
          </div>

          <!-- Star Selection -->
          <div class="stars">
            <button
              *ngFor="let s of [1, 2, 3, 4, 5]"
              (click)="!isViewOnly && setRating(s)"
              [class.active]="selectedRating() >= s"
              class="star-btn"
              [disabled]="isViewOnly"
            >
              ★
            </button>
          </div>
          <p class="rating-label">{{ getRatingLabel() }}</p>

          <!-- Comment Input -->
          <div class="comment-box">
            <label>Comment / Suggestions</label>
            <textarea
              [(ngModel)]="comment"
              [placeholder]="isViewOnly ? '' : 'Tell us how the taste and service was...'"
              [readonly]="isViewOnly"
              maxlength="500"
            ></textarea>
          </div>
        </div>

        <footer class="footer">
          <div class="actions" *ngIf="!isViewOnly; else closeOnly">
            <button (click)="onLater()" class="btn-later" [disabled]="loading">Give Later</button>
            <button
              (click)="onSubmit()"
              class="btn-submit"
              [disabled]="selectedRating() === 0 || loading"
            >
              {{ loading ? 'Processing...' : 'Submit Now' }}
            </button>
          </div>
          <ng-template #closeOnly>
            <button (click)="onClose()" class="btn-close">Close View</button>
          </ng-template>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      .feedback-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(12px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .feedback-card {
        width: 100%;
        max-width: 440px;
        padding: 35px;
        text-align: center;
        background: #111;
        border: 1px solid #222;
        border-radius: 32px;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      h2 {
        font-size: 1.6rem;
        font-weight: 900;
        margin: 8px 0;
      }
      .order-info {
        color: #555;
        font-size: 0.85rem;
        margin-bottom: 20px;
        font-weight: 600;
      }

      .order-summary {
        background: #000;
        border-radius: 16px;
        padding: 15px;
        margin-bottom: 20px;
        text-align: left;
        border: 1px solid #1a1a1a;
      }
      .order-summary .label {
        font-size: 0.65rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        display: block;
        margin-bottom: 8px;
      }
      .item-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .item-tag {
        font-size: 0.75rem;
        background: #1a1a1a;
        color: #aaa;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid #222;
      }

      .stars {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .star-btn {
        background: none;
        border: none;
        font-size: 2.2rem;
        color: #222;
        cursor: pointer;
        transition: 0.2s;
      }
      .star-btn.active {
        color: #ffcc00;
        filter: drop-shadow(0 0 10px rgba(255, 204, 0, 0.4));
      }
      .rating-label {
        color: #ffcc00;
        font-weight: 800;
        font-size: 0.8rem;
        min-height: 18px;
        margin-bottom: 20px;
      }

      .comment-box {
        text-align: left;
      }
      .comment-box label {
        display: block;
        font-size: 0.65rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      textarea {
        width: 100%;
        background: #000;
        border: 1px solid #222;
        border-radius: 12px;
        padding: 12px;
        color: white;
        resize: none;
        height: 100px;
        font-family: inherit;
        font-size: 0.9rem;
      }

      .footer {
        margin-top: 25px;
      }
      .actions {
        display: flex;
        gap: 10px;
      }
      .btn-later {
        flex: 1;
        background: #1a1a1a;
        color: #555;
        border: 1px solid #222;
        padding: 14px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-submit {
        flex: 2;
        background: #ff6600;
        color: white;
        border: none;
        padding: 14px;
        border-radius: 12px;
        font-weight: 900;
        cursor: pointer;
      }
      .btn-close {
        width: 100%;
        background: #222;
        color: white;
        border: none;
        padding: 14px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-submit:disabled {
        opacity: 0.2;
        cursor: not-allowed;
      }

      .animate-slide-up {
        animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class FeedbackModalComponent {
  private ratingService = inject(RatingService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  @Input() isVisible = false;
  @Input() isViewOnly = false;
  @Input() orderId = '';
  @Input() orderNumber = '';
  @Input() items: any[] = [];
  @Input() initialRating = 0;
  @Input() initialComment = '';

  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  selectedRating = signal(0);
  comment = '';
  loading = false;

  ngOnChanges() {
    if (this.isVisible) {
      this.selectedRating.set(this.initialRating || 0);
      this.comment = this.initialComment || '';
    }
  }

  setRating(r: number) {
    this.selectedRating.set(r);
  }

  getRatingLabel() {
    const labels = ['', 'Poor', 'Average', 'Good', 'Very Good', 'Legendary!'];
    return labels[this.selectedRating()];
  }

  onLater() {
    this.loading = true;
    this.ratingService
      .submitFeedback({
        orderId: this.orderId,
        rating: 0,
        comment: 'USER DISMISSED',
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.close.emit();
        },
        error: () => {
          this.loading = false;
          this.close.emit();
        },
      });
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    this.loading = true;
    this.cdr.detectChanges();

    this.ratingService
      .submitFeedback({
        orderId: this.orderId,
        rating: this.selectedRating(),
        comment: this.comment,
      })
      .subscribe({
        next: () => {
          this.toast.success('Thank you for the legendary feedback!');
          this.refresh.emit();
          this.close.emit();
          this.loading = false;
        },
        error: () => {
          this.toast.error('Failed to submit feedback.');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
