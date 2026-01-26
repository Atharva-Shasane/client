import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { RatingService, PendingFeedback } from '../../services/rating';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content fade-in">
          <span class="badge">Legendary Flavors</span>
          <h1>Experience the <span class="highlight">Killa</span> Taste</h1>
          <p>
            The most authentic and powerful restaurant experience in town. Fresh ingredients, bold
            spices, and legendary service.
          </p>
          <div class="hero-actions">
            <a routerLink="/menu" class="btn-primary">Explore Menu</a>
            <a routerLink="/my-orders" class="btn-secondary">My Orders</a>
          </div>
        </div>
        <div class="hero-image">
          <div class="image-overlay"></div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <div class="feature-grid">
            <div class="feature-card glass-card">
              <div class="icon">🚀</div>
              <h3>Quick Delivery</h3>
              <p>Get your legendary meal delivered to your doorstep in record time.</p>
            </div>
            <div class="feature-card glass-card">
              <div class="icon">👨‍🍳</div>
              <h3>Expert Chefs</h3>
              <p>Our culinary masters craft every dish with passion and precision.</p>
            </div>
            <div class="feature-card glass-card">
              <div class="icon">⭐</div>
              <h3>Quality Taste</h3>
              <p>Only the freshest ingredients make it into our legendary kitchen.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-item">
              <h2>15k+</h2>
              <p>Happy Customers</p>
            </div>
            <div class="stat-item">
              <h2>50+</h2>
              <p>Award Winning</p>
            </div>
            <div class="stat-item">
              <h2>10+</h2>
              <p>Years Experience</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Multi-Step Feedback Modal -->
      <div class="feedback-modal-overlay" *ngIf="feedbackStep() !== 'NONE'">
        <div class="feedback-card-modal glass-card animate-slide-up">
          <!-- Step 1: Invitation -->
          <div *ngIf="feedbackStep() === 'INVITE'" class="invite-step">
            <header class="feedback-header">
              <span class="feedback-badge">Special Invitation</span>
              <h2>Welcome back!</h2>
              <p>
                We noticed you recently enjoyed
                <strong>Order #{{ pendingOrder()?.orderNumber }}</strong
                >.
              </p>
              <p class="invite-msg">
                Would you like to share your experience with us? It only takes a second!
              </p>
            </header>
            <div class="invite-actions">
              <button (click)="declineFeedback()" class="btn-decline">No, Thanks</button>
              <button (click)="acceptInvitation()" class="btn-accept">Yes, I'd love to!</button>
            </div>
          </div>

          <!-- Step 2: The Actual Form -->
          <div *ngIf="feedbackStep() === 'FORM'" class="form-step">
            <header class="feedback-header">
              <span class="feedback-badge">Rating Order #{{ pendingOrder()?.orderNumber }}</span>
              <h2>Rate your experience</h2>
            </header>

            <div class="feedback-body">
              <div class="order-summary-box">
                <div class="summary-header">Items in this order:</div>
                <div class="item-list">
                  <div class="item-pill" *ngFor="let item of pendingOrder()?.items">
                    <span class="qty">{{ item.quantity }}x</span>
                    <span class="name">{{ item.name }}</span>
                  </div>
                </div>
              </div>

              <div class="star-rating">
                <button
                  *ngFor="let star of [1, 2, 3, 4, 5]"
                  (click)="setRating(star)"
                  [class.active]="selectedRating() >= star"
                  class="star-btn"
                >
                  ★
                </button>
              </div>
              <p class="rating-label">{{ getRatingLabel() }}</p>

              <div class="review-area">
                <label>Add a comment (Optional)</label>
                <textarea
                  [(ngModel)]="reviewComment"
                  placeholder="How was the taste and service?"
                  maxlength="500"
                ></textarea>
              </div>
            </div>

            <footer class="feedback-footer">
              <button (click)="dismissFeedback()" class="btn-skip">Later</button>
              <button
                (click)="submitFeedback()"
                class="btn-submit"
                [disabled]="selectedRating() === 0"
              >
                Submit Review
              </button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .home-container {
        background: #0a0a0a;
        min-height: 100vh;
        color: white;
        padding-top: 80px;
        font-family: 'Poppins', sans-serif;
      }
      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1400px;
        margin: 0 auto;
        padding: 100px 24px;
        gap: 60px;
      }
      .hero-content {
        flex: 1;
      }
      .badge {
        color: #ff6600;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.8rem;
      }
      .hero-content h1 {
        font-size: clamp(3rem, 8vw, 5rem);
        font-weight: 900;
        line-height: 1;
        margin: 20px 0;
        letter-spacing: -2px;
      }
      .highlight {
        color: #ff6600;
      }
      .hero-content p {
        color: #888;
        font-size: 1.2rem;
        max-width: 600px;
        margin-bottom: 40px;
      }
      .hero-actions {
        display: flex;
        gap: 20px;
      }
      .btn-primary {
        background: #ff6600;
        color: white;
        padding: 18px 40px;
        border-radius: 16px;
        text-decoration: none;
        font-weight: 800;
        box-shadow: 0 10px 30px rgba(255, 102, 0, 0.3);
        transition: 0.3s;
      }
      .btn-secondary {
        background: #1a1a1a;
        color: white;
        padding: 18px 40px;
        border-radius: 16px;
        text-decoration: none;
        font-weight: 800;
        border: 1px solid #333;
        transition: 0.3s;
      }
      .features {
        padding: 100px 0;
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
      }
      .feature-card {
        padding: 40px;
        border-radius: 32px;
        text-align: center;
        border: 1px solid #1a1a1a;
        transition: 0.3s;
      }
      .feature-card:hover {
        border-color: #ff6600;
        transform: translateY(-10px);
      }
      .feature-card .icon {
        font-size: 3rem;
        margin-bottom: 20px;
      }
      .feature-card h3 {
        font-size: 1.5rem;
        font-weight: 800;
        margin-bottom: 15px;
      }
      .feature-card p {
        color: #666;
      }
      .stats {
        padding: 80px 0;
        background: #050505;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        text-align: center;
      }
      .stat-item h2 {
        font-size: 4rem;
        font-weight: 900;
        color: #ff6600;
        margin: 0;
      }
      .stat-item p {
        color: #444;
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 2px;
      }

      /* Feedback Overlay */
      .feedback-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.92);
        backdrop-filter: blur(20px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .feedback-card-modal {
        width: 100%;
        max-width: 500px;
        background: #111;
        border: 1px solid #222;
        border-radius: 32px;
        padding: 35px;
        text-align: center;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
      }
      .feedback-badge {
        color: #ff6600;
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 2px;
        display: block;
        margin-bottom: 10px;
      }
      .feedback-header h2 {
        font-size: 1.6rem;
        font-weight: 900;
        margin: 8px 0;
      }
      .feedback-header p {
        color: #555;
        font-size: 0.85rem;
        line-height: 1.5;
      }

      /* Invite Step Specifics */
      .invite-msg {
        margin-top: 20px !important;
        color: #aaa !important;
        font-style: italic;
      }
      .invite-actions {
        display: flex;
        gap: 15px;
        margin-top: 30px;
      }
      .btn-decline {
        flex: 1;
        background: #1a1a1a;
        color: #555;
        border: 1px solid #222;
        padding: 16px;
        border-radius: 14px;
        font-weight: 800;
        cursor: pointer;
        transition: 0.3s;
      }
      .btn-decline:hover {
        color: #e74c3c;
        border-color: #e74c3c;
      }
      .btn-accept {
        flex: 1.5;
        background: #ff6600;
        color: white;
        border: none;
        padding: 16px;
        border-radius: 14px;
        font-weight: 900;
        cursor: pointer;
        transition: 0.3s;
        box-shadow: 0 10px 20px rgba(255, 102, 0, 0.2);
      }
      .btn-accept:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
      }

      /* Form Step Specifics */
      .order-summary-box {
        margin: 20px 0;
        padding: 15px;
        background: #080808;
        border-radius: 20px;
        border: 1px solid #1a1a1a;
        text-align: left;
      }
      .summary-header {
        font-size: 0.7rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
      }
      .item-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .item-pill {
        background: #111;
        border: 1px solid #222;
        padding: 6px 12px;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #888;
        display: flex;
        gap: 6px;
      }
      .item-pill .qty {
        color: #ff6600;
        font-weight: 800;
      }
      .star-rating {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin: 20px 0 8px;
      }
      .star-btn {
        background: none;
        border: none;
        color: #222;
        font-size: 2.2rem;
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
        font-size: 0.85rem;
        min-height: 20px;
        margin-bottom: 25px;
      }
      .review-area {
        text-align: left;
      }
      .review-area label {
        display: block;
        font-size: 0.7rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .review-area textarea {
        width: 100%;
        background: #000;
        border: 1px solid #222;
        border-radius: 16px;
        padding: 15px;
        color: #fff;
        font-family: inherit;
        resize: none;
        height: 100px;
        font-size: 0.9rem;
      }
      .feedback-footer {
        display: flex;
        gap: 12px;
        margin-top: 25px;
      }
      .btn-skip {
        flex: 1;
        background: #1a1a1a;
        color: #555;
        border: none;
        padding: 15px;
        border-radius: 14px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-submit {
        flex: 2;
        background: #ff6600;
        color: white;
        border: none;
        padding: 15px;
        border-radius: 14px;
        font-weight: 900;
        cursor: pointer;
      }
      .btn-submit:disabled {
        opacity: 0.2;
        cursor: not-allowed;
      }

      .glass-card {
        background: rgba(26, 26, 26, 0.8);
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .animate-slide-up {
        animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .fade-in {
        animation: fadeIn 1s ease-out forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  ratingService = inject(RatingService);
  toast = inject(ToastService);

  // Values: 'NONE' | 'INVITE' | 'FORM'
  feedbackStep = signal<string>('NONE');
  pendingOrder = signal<any>(null);
  selectedRating = signal(0);
  reviewComment = '';

  private feedbackCheckedThisVisit = false;

  ngOnInit() {
    if (this.auth.currentUser() && !this.feedbackCheckedThisVisit) {
      this.checkFeedback();
    }
  }

  checkFeedback() {
    this.ratingService.checkPendingFeedback().subscribe({
      next: (res: PendingFeedback) => {
        if (res.pending && res.order) {
          this.pendingOrder.set(res.order);
          this.feedbackStep.set('INVITE'); // Start with the invitation
        }
        this.feedbackCheckedThisVisit = true;
      },
      error: () => {
        this.feedbackCheckedThisVisit = true;
      },
    });
  }

  acceptInvitation() {
    this.feedbackStep.set('FORM');
  }

  declineFeedback() {
    if (!this.pendingOrder()) return;

    // Call server to mark as dismissed forever
    this.ratingService.dismissFeedback(this.pendingOrder()._id).subscribe({
      next: () => {
        this.feedbackStep.set('NONE');
        this.toast.success("No problem! We won't ask about this order again.");
      },
      error: () => {
        this.feedbackStep.set('NONE');
      },
    });
  }

  setRating(rating: number) {
    this.selectedRating.set(rating);
  }

  getRatingLabel() {
    const labels = ['', 'Poor', 'Average', 'Good', 'Very Good', 'Legendary!'];
    return labels[this.selectedRating()];
  }

  dismissFeedback() {
    this.feedbackStep.set('NONE');
  }

  submitFeedback() {
    if (this.selectedRating() === 0 || !this.pendingOrder()) return;

    this.ratingService
      .submitFeedback({
        orderId: this.pendingOrder()._id,
        rating: this.selectedRating(),
        comment: this.reviewComment,
      })
      .subscribe({
        next: () => {
          this.toast.success('Thank you for the legendary feedback!');
          this.feedbackStep.set('NONE');
        },
        error: (err) => {
          this.toast.error(err.error?.msg || 'Failed to submit feedback.');
        },
      });
  }
}
