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
          <span class="badge">Dining Experience</span>
          <h2>{{ isViewOnly ? 'Review Summary' : 'Rate Your Feast' }}</h2>
          <p class="order-info">Ref: #{{ orderNumber }}</p>
        </header>

        <div class="body">
          <!-- Dish Breakdown (Always visible if data exists) -->
          <div class="granular-section" *ngIf="items && items.length > 0">
            <span class="section-lbl">Dish Ratings</span>
            <div class="dish-scroller">
              <div class="dish-item" *ngFor="let item of items; let i = index">
                <span class="d-name">{{ item.name }}</span>
                <div class="d-stars">
                  <button
                    *ngFor="let s of [1, 2, 3, 4, 5]"
                    (click)="!isViewOnly && setDishRating(i, s)"
                    [class.active]="(dishScores[i] || 0) >= s"
                    class="mini-star"
                    [disabled]="isViewOnly"
                  >
                    ★
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Overall Service Rating -->
          <div class="overall-section">
            <span class="section-lbl">Overall Service</span>
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
          </div>

          <!-- User's Written Review -->
          <div class="comment-box">
            <label>Your Comments</label>
            <p *ngIf="isViewOnly" class="view-comment">
              "{{ comment || 'No written review provided.' }}"
            </p>
            <textarea
              *ngIf="!isViewOnly"
              [(ngModel)]="comment"
              placeholder="How was the overall taste and service?"
              maxlength="500"
            ></textarea>
          </div>

          <!-- OWNER REPLY: Critical section for visibility -->
          <div class="reply-container fade-in" *ngIf="ownerReply">
            <div class="reply-card">
              <span class="r-lbl">Kitchen Response</span>
              <p class="r-text">{{ ownerReply }}</p>
            </div>
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
              {{ loading ? '...' : 'Submit Now' }}
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
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .feedback-card {
        width: 100%;
        max-width: 400px;
        padding: 25px;
        text-align: center;
        background: #080808;
        border: 1px solid #1a1a1a;
        border-radius: 20px;
        max-height: 85vh;
        overflow-y: auto;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        font-size: 0.55rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      h2 {
        font-size: 1.2rem;
        font-weight: 900;
        margin: 4px 0;
        color: #fff;
      }
      .order-info {
        color: #444;
        font-size: 0.75rem;
        margin-bottom: 20px;
        font-family: monospace;
      }

      .section-lbl {
        display: block;
        font-size: 0.6rem;
        font-weight: 800;
        color: #333;
        text-transform: uppercase;
        margin-bottom: 10px;
        text-align: left;
        letter-spacing: 1px;
      }

      .granular-section {
        margin-bottom: 20px;
        border-bottom: 1px solid #111;
        padding-bottom: 15px;
      }
      .dish-scroller {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .dish-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #000;
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid #121212;
      }
      .d-name {
        font-size: 0.8rem;
        font-weight: 600;
        color: #ccc;
      }
      .mini-star {
        background: none;
        border: none;
        color: #151515;
        cursor: pointer;
        font-size: 1rem;
        transition: 0.2s;
      }
      .mini-star.active {
        color: #ffcc00;
      }

      .stars {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      .star-btn {
        background: none;
        border: none;
        font-size: 1.8rem;
        color: #151515;
        cursor: pointer;
        transition: 0.2s;
      }
      .star-btn.active {
        color: #ffcc00;
      }
      .rating-label {
        color: #ffcc00;
        font-weight: 800;
        font-size: 0.7rem;
        margin: 5px 0 15px;
      }

      .comment-box {
        text-align: left;
        margin-top: 10px;
      }
      .comment-box label {
        display: block;
        font-size: 0.6rem;
        font-weight: 800;
        color: #333;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .view-comment {
        color: #fff;
        font-style: italic;
        font-size: 0.95rem;
        line-height: 1.4;
        padding: 10px;
        background: #000;
        border-radius: 8px;
        border: 1px solid #111;
      }
      textarea {
        width: 100%;
        background: #000;
        border: 1px solid #1a1a1a;
        border-radius: 10px;
        padding: 10px;
        color: white;
        resize: none;
        height: 60px;
        font-family: inherit;
        font-size: 0.85rem;
      }

      /* REPLY UI - ENHANCED FOR READABILITY */
      .reply-container {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px dashed #222;
        text-align: left;
      }
      .reply-card {
        background: rgba(255, 102, 0, 0.08);
        padding: 15px;
        border-radius: 12px;
        border-left: 3px solid #ff6600;
      }
      .r-lbl {
        font-size: 0.65rem;
        font-weight: 900;
        color: #ff6600;
        text-transform: uppercase;
        display: block;
        margin-bottom: 6px;
        letter-spacing: 1px;
      }
      .r-text {
        color: #ffffff;
        line-height: 1.5;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .footer {
        margin-top: 20px;
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
        padding: 12px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-submit {
        flex: 2;
        background: #ff6600;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 10px;
        font-weight: 900;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-close {
        width: 100%;
        background: #1a1a1a;
        color: white;
        border: 1px solid #222;
        padding: 12px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.85rem;
      }

      .animate-slide-up {
        animation: slideUp 0.3s ease-out;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(15px);
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
  @Input() ownerReply = '';
  @Input() dishRatings: any[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  selectedRating = signal(0);
  comment = '';
  dishScores: number[] = [];
  loading = false;

  ngOnChanges() {
    if (this.isVisible) {
      this.selectedRating.set(this.initialRating || 0);
      this.comment = this.initialComment || '';

      if (this.dishRatings && this.dishRatings.length > 0) {
        this.dishScores = this.items.map((item) => {
          const found = this.dishRatings.find(
            (dr) => dr.menuItemId === (item.menuItemId || item._id),
          );
          return found ? found.rating : 0;
        });
      } else {
        this.dishScores = new Array(this.items.length).fill(0);
      }
    }
  }

  setDishRating(idx: number, score: number) {
    this.dishScores[idx] = score;
    this.cdr.detectChanges();
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
      .subscribe(() => {
        this.loading = false;
        this.close.emit();
      });
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    this.loading = true;
    this.cdr.detectChanges();

    const granular = this.items.map((item, i) => ({
      menuItemId: item.menuItemId || item._id,
      name: item.name,
      rating: this.dishScores[i] || this.selectedRating(),
    }));

    this.ratingService
      .submitFeedback({
        orderId: this.orderId,
        rating: this.selectedRating(),
        comment: this.comment,
        dishRatings: granular,
      })
      .subscribe({
        next: () => {
          this.toast.success('Feedback received!');
          this.refresh.emit();
          this.close.emit();
          this.loading = false;
        },
        error: () => {
          this.toast.error('Failed to submit.');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
