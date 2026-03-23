import { Component, inject, OnInit, signal, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService } from '../../services/rating';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-owner-feedback',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="fb-page">

      <!-- ── Ambient BG ── -->
      <div class="fb-bg">
        <div class="fb-blob blob-1"></div>
        <div class="fb-blob blob-2"></div>
        <div class="fb-grain"></div>
      </div>

      <div class="fb-shell">

        <!-- ══════════════════════════════════
             HEADER
        ══════════════════════════════════ -->
        <header class="fb-header">
          <div class="fh-left">
            <p class="fh-eyebrow">
              <span class="eyebrow-dot"></span>
              Engagement Intelligence
            </p>
            <h1 class="fh-title">Customer <span class="accent">Feedback</span></h1>
            <p class="fh-sub">Analyzing customer tone, dish performance, and satisfaction levels.</p>
          </div>

          <div class="fh-stats">
            <div class="stat-tile">
              <span class="st-num">{{ feedback().length }}</span>
              <span class="st-label">Total Reviews</span>
            </div>
            <div class="stat-tile stat-tile-accent">
              <span class="st-num accent">{{ getAverageRating() }}</span>
              <span class="st-label">Avg Score</span>
            </div>
            <div class="stat-tile">
              <span class="st-num st-pos">{{ getPositiveCount() }}</span>
              <span class="st-label">Positive</span>
            </div>
            <div class="stat-tile">
              <!-- BUG FIX: was no pending-reply count — useful for the owner to see what needs response -->
              <span class="st-num st-amber">{{ getPendingReplies() }}</span>
              <span class="st-label">Needs Reply</span>
            </div>
          </div>
        </header>

        <!-- ══════════════════════════════════
             FILTER BAR
        ══════════════════════════════════ -->
        <div class="filter-bar" *ngIf="feedback().length > 0">
          <div class="filter-chips">
            <button class="fchip" [class.fchip-active]="activeFilter() === 'all'" (click)="setFilter('all')">
              All
            </button>
            <button class="fchip" [class.fchip-active]="activeFilter() === 'positive'" (click)="setFilter('positive')">
              <span class="fchip-dot dot-green"></span>Positive (4–5 ★)
            </button>
            <button class="fchip" [class.fchip-active]="activeFilter() === 'neutral'" (click)="setFilter('neutral')">
              <span class="fchip-dot dot-amber"></span>Neutral (3 ★)
            </button>
            <button class="fchip" [class.fchip-active]="activeFilter() === 'negative'" (click)="setFilter('negative')">
              <span class="fchip-dot dot-red"></span>Negative (1–2 ★)
            </button>
            <button class="fchip" [class.fchip-active]="activeFilter() === 'unreplied'" (click)="setFilter('unreplied')">
              Needs Reply
            </button>
          </div>
          <span class="filter-count">{{ filteredFeedback().length }} result{{ filteredFeedback().length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- ══════════════════════════════════
             FEEDBACK GRID
        ══════════════════════════════════ -->
        <div class="fb-grid" *ngIf="filteredFeedback().length > 0">
          <div
            class="fb-card"
            *ngFor="let item of filteredFeedback(); trackBy: trackById">

            <!-- Card top: user info + rating -->
            <div class="fc-top">
              <div class="fc-user">
                <div class="fc-avatar" [class.av-excellent]="item.rating >= 4" [class.av-good]="item.rating === 3" [class.av-poor]="item.rating < 3">
                  <!-- BUG FIX: was item.userId?.name?.charAt(0) — if name is undefined this renders nothing.
                       Added fallback to '?' -->
                  {{ (item.userId?.name || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="fc-user-info">
                  <!-- BUG FIX: was item.userId?.name directly — if null renders blank. Added fallback -->
                  <p class="fc-name">{{ item.userId?.name || 'Anonymous' }}</p>
                  <p class="fc-email">{{ item.userId?.email || '—' }}</p>
                </div>
              </div>

              <!-- Rating badge -->
              <div class="fc-rating" [class.rb-excellent]="item.rating >= 4" [class.rb-good]="item.rating === 3" [class.rb-poor]="item.rating < 3">
                <!-- BUG FIX: was {{ item.rating }}.0 — if rating is 0 this shows "0.0" which is misleading.
                     Also '★'.repeat(0) = '' so the stars row disappears. Added guard. -->
                <span class="rb-num">{{ item.rating > 0 ? item.rating + '.0' : '—' }}</span>
                <div class="rb-stars">
                  <span *ngFor="let s of getStarArray(item.rating)" class="rb-star">★</span>
                </div>
              </div>
            </div>

            <!-- Order ref + date row -->
            <div class="fc-meta-row">
              <span class="fc-order-ref">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                <!-- BUG FIX: was item.orderId?.orderNumber — if orderId is null (rating not linked to order)
                     this renders blank. Added fallback -->
                #{{ item.orderId?.orderNumber || 'N/A' }}
              </span>
              <span class="fc-date">{{ item.createdAt | date:'d MMM y' }}</span>
              <!-- AI Sentiment badge -->
              <span class="fc-sentiment" [class.sent-pos]="item.sentimentScore > 0.05" [class.sent-neg]="item.sentimentScore < -0.05" [class.sent-neu]="item.sentimentScore >= -0.05 && item.sentimentScore <= 0.05">
                <span class="sent-dot"></span>
                {{ getSentimentText(item.sentimentScore) }}
              </span>
            </div>

            <!-- Dish-level ratings -->
            <div class="dish-pills" *ngIf="item.dishRatings?.length">
              <div class="dish-pill" *ngFor="let dr of item.dishRatings">
                <span class="dp-name">{{ dr.name || 'Dish' }}</span>
                <span class="dp-score">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#ffd700"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {{ dr.rating }}
                </span>
              </div>
            </div>

            <!-- Comment -->
            <div class="fc-comment">
              <!-- BUG FIX: was rendering empty comment as literal empty string inside quotes.
                   Now shows a styled placeholder instead -->
              <p class="fc-comment-text" *ngIf="item.comment">
                "{{ item.comment }}"
              </p>
              <p class="fc-no-comment" *ngIf="!item.comment">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Rating only — no written review
              </p>
            </div>

            <!-- Reply section -->
            <div class="reply-section">
              <!-- Existing reply view -->
              <div class="existing-reply" *ngIf="item.ownerReply && !item.showReply">
                <div class="er-head">
                  <div class="er-label">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                    Your Response
                  </div>
                  <button class="er-edit-btn" (click)="toggleReplyEdit(item)">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M15.5 2.5a2.121 2.121 0 0 1 3 3L12 12l-4 1 1-4 6.5-6.5z"/></svg>
                    Edit
                  </button>
                </div>
                <p class="er-text">{{ item.ownerReply }}</p>
              </div>

              <!-- Reply compose form -->
              <div class="reply-form" *ngIf="!item.ownerReply || item.showReply">
                <div class="rf-label">
                  {{ item.ownerReply ? 'Update your response' : 'Write a response' }}
                </div>
                <div class="rf-input-wrap" [class.rf-focused]="item.replyFocused">
                  <textarea
                    class="rf-textarea"
                    [(ngModel)]="item.newReply"
                    [name]="'reply_' + item._id"
                    placeholder="Address the customer's experience thoughtfully…"
                    maxlength="500"
                    rows="3"
                    (focus)="item.replyFocused = true"
                    (blur)="item.replyFocused = false">
                  </textarea>
                  <div class="rf-char-count">{{ (item.newReply || '').length }}/500</div>
                </div>
                <div class="rf-actions">
                  <button class="rf-cancel" *ngIf="item.ownerReply" (click)="cancelEdit(item)">Cancel</button>
                  <button
                    class="rf-send"
                    (click)="submitReply(item)"
                    [disabled]="!item.newReply?.trim() || item.loading">
                    <span class="rf-spinner" *ngIf="item.loading"></span>
                    <svg *ngIf="!item.loading" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    {{ item.loading ? 'Sending…' : item.ownerReply ? 'Update Reply' : 'Send Reply' }}
                  </button>
                </div>
              </div>
            </div>

          </div><!-- /fb-card -->
        </div>

        <!-- ══════════════════════════════════
             EMPTY STATE
        ══════════════════════════════════ -->
        <div class="fb-empty" *ngIf="feedback().length === 0">
          <div class="fe-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 class="fe-title">No feedback yet</h3>
          <p class="fe-sub">Customer reviews will appear here once submitted after order completion.</p>
        </div>

        <!-- Filtered empty -->
        <div class="fb-empty" *ngIf="feedback().length > 0 && filteredFeedback().length === 0">
          <div class="fe-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 class="fe-title">No results for this filter</h3>
          <p class="fe-sub">Try a different filter to see more feedback.</p>
          <button class="fe-reset" (click)="setFilter('all')">View All Feedback</button>
        </div>

      </div><!-- /fb-shell -->
    </div><!-- /fb-page -->
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       DESIGN TOKENS — full system match
    ═══════════════════════════════════════════ */
    :host {
      --orange:      #ff6600;
      --orange-dim:  rgba(255,102,0,0.12);
      --orange-glow: rgba(255,102,0,0.28);
      --green:       #22c55e;
      --green-dim:   rgba(34,197,94,0.12);
      --red:         #ef4444;
      --red-dim:     rgba(239,68,68,0.1);
      --amber:       #f59e0b;
      --amber-dim:   rgba(245,158,11,0.1);
      --blue:        #4f9cf9;
      --surface:     #0d0d0d;
      --surface-2:   #111111;
      --surface-3:   #161616;
      --surface-4:   #1a1a1a;
      --border:      rgba(255,255,255,0.07);
      --border-h:    rgba(255,255,255,0.13);
      --text:        #f0ede8;
      --text-muted:  #6b6b6b;
      --text-dim:    #3a3a3a;
    }

    /* ═══════════════════════════════════════════
       PAGE + BG
    ═══════════════════════════════════════════ */
    .fb-page {
      position: relative;
      min-height: 100vh;
      background: var(--surface);
      color: var(--text);
      padding: 72px 0 80px;
      overflow-x: hidden;
    }
    .fb-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .fb-blob {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.08;
      animation: blobDrift 12s ease-in-out infinite alternate;
    }
    .blob-1 { width: 540px; height: 540px; background: var(--orange); top: -160px; right: -80px; }
    .blob-2 { width: 360px; height: 360px; background: #1a4fa0; bottom: 40px; left: -80px; animation-delay: -6s; }
    @keyframes blobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(20px,16px) scale(1.05); }
    }
    .fb-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");
    }

    /* ═══════════════════════════════════════════
       SHELL
    ═══════════════════════════════════════════ */
    .fb-shell {
      position: relative; z-index: 1;
      max-width: 1300px; margin: 0 auto; padding: 0 28px;
      animation: fadeUp 0.5s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ═══════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════ */
    .fb-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 32px; flex-wrap: wrap;
      padding: 36px 0 28px;
    }
    .fh-eyebrow {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--orange); margin: 0 0 10px;
    }
    .eyebrow-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--orange); box-shadow: 0 0 8px var(--orange-glow);
      animation: epulse 2s ease-in-out infinite;
    }
    @keyframes epulse {
      0%,100% { box-shadow: 0 0 5px var(--orange-glow); }
      50%      { box-shadow: 0 0 14px var(--orange); }
    }
    .fh-title {
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      font-weight: 900; letter-spacing: -0.04em; margin: 0 0 10px; line-height: 1;
    }
    .accent { color: var(--orange); }
    .fh-sub { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin: 0; max-width: 420px; }

    /* Stats row */
    .fh-stats { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; }
    .stat-tile {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 14px; padding: 14px 20px;
      display: flex; flex-direction: column; align-items: center;
      min-width: 90px; text-align: center;
      transition: border-color 0.2s;
    }
    .stat-tile:hover { border-color: var(--border-h); }
    .stat-tile-accent { border-color: rgba(255,102,0,0.2); background: var(--orange-dim); }
    .st-num   { font-size: 1.7rem; font-weight: 900; line-height: 1; color: var(--text); }
    .st-label { font-size: 0.58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px; }
    .st-pos   { color: var(--green); }
    .st-amber { color: var(--amber); }

    /* ═══════════════════════════════════════════
       FILTER BAR
    ═══════════════════════════════════════════ */
    .filter-bar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap; margin-bottom: 24px;
    }
    .filter-chips { display: flex; gap: 7px; flex-wrap: wrap; }
    .fchip {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--surface-2); border: 1px solid var(--border);
      color: var(--text-muted); padding: 7px 14px; border-radius: 20px;
      font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: all 0.18s;
    }
    .fchip:hover { color: var(--text); border-color: var(--border-h); }
    .fchip-active { background: var(--orange) !important; border-color: var(--orange) !important; color: #fff !important; box-shadow: 0 3px 12px var(--orange-glow); }
    .fchip-dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot-green { background: var(--green); }
    .dot-amber { background: var(--amber); }
    .dot-red   { background: var(--red); }
    .filter-count { font-size: 0.72rem; color: var(--text-muted); font-weight: 700; white-space: nowrap; }

    /* ═══════════════════════════════════════════
       FEEDBACK GRID
    ═══════════════════════════════════════════ */
    .fb-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 18px;
    }

    /* ── Feedback Card ── */
    .fb-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 20px; padding: 20px;
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
      animation: cardIn 0.35s ease both;
    }
    .fb-card:hover {
      border-color: var(--border-h);
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.35);
    }
    @keyframes cardIn {
      from { opacity:0; transform:translateY(10px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* Card top row */
    .fc-top {
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .fc-user { display: flex; align-items: center; gap: 12px; }
    .fc-avatar {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 1rem;
      background: var(--surface-3); border: 1.5px solid var(--border);
      transition: border-color 0.2s;
    }
    .av-excellent { background: var(--green-dim); border-color: rgba(34,197,94,0.3); color: var(--green); }
    .av-good      { background: var(--amber-dim); border-color: rgba(245,158,11,0.3); color: var(--amber); }
    .av-poor      { background: var(--red-dim);   border-color: rgba(239,68,68,0.3); color: var(--red); }

    .fc-name  { font-weight: 800; font-size: 0.9rem; margin: 0 0 2px; color: var(--text); }
    .fc-email { font-size: 0.68rem; color: var(--text-muted); margin: 0; }

    /* Rating badge */
    .fc-rating { text-align: right; }
    .rb-num { display: block; font-size: 1.2rem; font-weight: 900; line-height: 1; }
    .rb-stars { display: flex; gap: 1px; justify-content: flex-end; margin-top: 3px; }
    .rb-star { font-size: 0.75rem; }
    .rb-excellent .rb-num { color: var(--green); }
    .rb-excellent .rb-star { color: var(--green); }
    .rb-good .rb-num      { color: var(--amber); }
    .rb-good .rb-star     { color: var(--amber); }
    .rb-poor .rb-num      { color: var(--red); }
    .rb-poor .rb-star     { color: var(--red); }

    /* Meta row */
    .fc-meta-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .fc-order-ref {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.68rem; font-weight: 700;
      color: var(--text-muted);
      background: var(--surface-3); border: 1px solid var(--border);
      padding: 3px 9px; border-radius: 6px;
      font-family: 'Courier New', monospace;
    }
    .fc-date {
      font-size: 0.68rem; color: var(--text-dim); font-weight: 600;
    }
    .fc-sentiment {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.62rem; font-weight: 800;
      padding: 3px 9px; border-radius: 20px;
      margin-left: auto;
    }
    .sent-pos { background: var(--green-dim); color: var(--green); }
    .sent-neu { background: var(--surface-3); color: var(--text-muted); border: 1px solid var(--border); }
    .sent-neg { background: var(--red-dim); color: var(--red); }
    .sent-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

    /* Dish pills */
    .dish-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .dish-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--surface-3); border: 1px solid var(--border);
      padding: 4px 10px; border-radius: 7px;
    }
    .dp-name  { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; }
    .dp-score {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 0.65rem; font-weight: 900; color: #ffd700;
    }

    /* Comment */
    .fc-comment {
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 14px 16px;
    }
    .fc-comment-text {
      font-size: 0.88rem; font-style: italic;
      color: rgba(240,237,232,0.8); line-height: 1.65; margin: 0;
    }
    .fc-no-comment {
      display: flex; align-items: center; gap: 7px;
      font-size: 0.75rem; color: var(--text-dim); margin: 0;
      font-style: normal;
    }

    /* Reply section */
    .reply-section {
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 14px;
    }

    /* Existing reply */
    .existing-reply { display: flex; flex-direction: column; gap: 8px; }
    .er-head { display: flex; justify-content: space-between; align-items: center; }
    .er-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.62rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--orange);
    }
    .er-edit-btn {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: 1px solid var(--border);
      color: var(--text-muted); font-size: 0.65rem; font-weight: 700;
      padding: 4px 9px; border-radius: 7px; cursor: pointer;
      transition: all 0.18s;
    }
    .er-edit-btn:hover { border-color: var(--border-h); color: var(--text); }
    .er-text {
      font-size: 0.82rem; color: var(--text-muted);
      line-height: 1.55; margin: 0; font-style: italic;
    }

    /* Reply form */
    .reply-form { display: flex; flex-direction: column; gap: 10px; }
    .rf-label {
      font-size: 0.62rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    .rf-input-wrap {
      position: relative;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 10px; overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .rf-focused { border-color: rgba(255,102,0,0.4); box-shadow: 0 0 0 3px rgba(255,102,0,0.07); }
    .rf-textarea {
      width: 100%; background: none; border: none; outline: none;
      color: var(--text); font-family: inherit; font-size: 0.82rem;
      padding: 12px 14px; resize: none; line-height: 1.55;
      box-sizing: border-box;
    }
    .rf-textarea::placeholder { color: var(--text-dim); }
    .rf-char-count {
      text-align: right; font-size: 0.6rem; color: var(--text-dim);
      padding: 0 12px 8px; font-weight: 700;
    }
    .rf-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .rf-cancel {
      background: none; border: 1px solid var(--border);
      color: var(--text-muted); padding: 8px 14px; border-radius: 8px;
      font-size: 0.72rem; font-weight: 700; cursor: pointer;
      transition: color 0.18s, border-color 0.18s;
    }
    .rf-cancel:hover { color: var(--text); border-color: var(--border-h); }
    .rf-send {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--orange); color: #fff;
      border: none; padding: 8px 18px; border-radius: 8px;
      font-size: 0.75rem; font-weight: 800; cursor: pointer;
      box-shadow: 0 3px 12px var(--orange-glow);
      transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
    }
    .rf-send:hover:not([disabled]) { background: #e55a00; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,102,0,0.45); }
    .rf-send:disabled { background: var(--surface-4); color: var(--text-muted); box-shadow: none; cursor: not-allowed; }
    .rf-spinner {
      display: inline-block; width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.25);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ═══════════════════════════════════════════
       EMPTY STATES
    ═══════════════════════════════════════════ */
    .fb-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 14px;
      min-height: 50vh; text-align: center;
    }
    .fe-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--surface-2); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-dim); margin-bottom: 4px;
    }
    .fe-title { font-size: 1.3rem; font-weight: 900; margin: 0; }
    .fe-sub   { font-size: 0.88rem; color: var(--text-muted); margin: 0; max-width: 380px; line-height: 1.6; }
    .fe-reset {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--surface-2); border: 1px solid var(--border);
      color: var(--text-muted); padding: 10px 20px; border-radius: 10px;
      font-size: 0.8rem; font-weight: 700; cursor: pointer; margin-top: 6px;
      transition: color 0.18s, border-color 0.18s;
    }
    .fe-reset:hover { color: var(--text); border-color: var(--border-h); }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 900px) {
      .fb-header { flex-direction: column; align-items: flex-start; }
      .fh-stats  { width: 100%; justify-content: flex-start; }
    }
    @media (max-width: 600px) {
      .fb-shell { padding: 0 16px; }
      .fb-grid  { grid-template-columns: 1fr; }
      .fc-meta-row { gap: 6px; }
      .fc-sentiment { margin-left: 0; }
    }
  `],
})
export class OwnerFeedbackComponent implements OnInit {
  private ratingService = inject(RatingService);
  private toast         = inject(ToastService);
  private cdr           = inject(ChangeDetectorRef);

  feedback     = signal<any[]>([]);
  activeFilter = signal<string>('all');

  // Use star rating (always present & reliable) not sentimentScore (async AI, defaults to 0).
  // Positive  = 4–5 stars, Neutral = 3 stars, Negative = 1–2 stars.
  filteredFeedback = computed(() => {
    const list = this.feedback();
    const f    = this.activeFilter();
    if (f === 'all')       return list;
    if (f === 'positive')  return list.filter(i => i.rating >= 4);
    if (f === 'neutral')   return list.filter(i => i.rating === 3);
    if (f === 'negative')  return list.filter(i => i.rating > 0 && i.rating <= 2);
    if (f === 'unreplied') return list.filter(i => !i.ownerReply);
    return list;
  });

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.ratingService.getAdminFeedback().subscribe({
      next: (data: any[]) => {
        const processed = data.map((f: any) => ({
          ...f,
          showReply:    false,
          // BUG FIX: was initialising newReply to ownerReply — this pre-fills the textarea
          // even when the reply form is hidden, so if you click Reply on a fresh review
          // the textarea already has the old reply text in it. Default to '' always;
          // the textarea content is populated lazily when the user opens edit mode.
          newReply:     '',
          loading:      false,
          replyFocused: false,
        }));
        this.feedback.set(processed);
      },
      error: () => this.toast.show('Failed to load feedback records', 'error'),
    });
  }

  setFilter(f: string) { this.activeFilter.set(f); }

  getAverageRating(): string {
    const list = this.feedback();
    if (!list.length) return '—';
    // BUG FIX: original included ratings of 0 (dismissed modal) in the average.
    // Only count actually submitted ratings (rating > 0)
    const submitted = list.filter(f => f.rating > 0);
    if (!submitted.length) return '—';
    const sum = submitted.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / submitted.length).toFixed(1);
  }

  getPositiveCount(): number {
    return this.feedback().filter(f => f.rating >= 4).length;
  }

  getPendingReplies(): number {
    return this.feedback().filter(f => !f.ownerReply).length;
  }

  // BUG FIX: '★'.repeat(item.rating) crashes if rating is 0 (repeat(0) = '' is fine but
  // repeat(-1) would throw a RangeError). Also template `*ngFor` on an array is cleaner.
  getStarArray(rating: number): number[] {
    const n = Math.max(0, Math.min(5, Math.floor(rating)));
    return Array(n).fill(0);
  }

  getSentimentText(score: number): string {
    if (score > 0.3)  return 'Very Positive';
    if (score > 0.05) return 'Positive';
    if (score < -0.3) return 'Very Negative';
    if (score < -0.05) return 'Negative';
    return 'Neutral';
  }

  toggleReplyEdit(item: any) {
    // BUG FIX: pre-fill textarea with existing reply when opening edit mode
    item.newReply  = item.ownerReply || '';
    item.showReply = true;
    this.cdr.detectChanges();
  }

  cancelEdit(item: any) {
    item.showReply = false;
    item.newReply  = '';
    this.cdr.detectChanges();
  }

  submitReply(item: any) {
    // BUG FIX: was checking !item.newReply but not trimming — a reply of all spaces
    // would pass the guard. Added .trim() check.
    if (!item.newReply?.trim() || item.loading) return;

    // BUG FIX: original wrapped everything in setTimeout(() => {}, 0) — this defers to the
    // next macrotask but is unnecessary and masks change detection issues. Removed; Angular
    // signals + cdr.detectChanges() handle this synchronously and correctly.
    item.loading = true;
    this.cdr.detectChanges();

    this.ratingService.replyToFeedback(item._id, item.newReply.trim()).subscribe({
      next: (res: any) => {
        this.toast.show('Response published successfully', 'success');
        item.ownerReply = res.ownerReply;
        item.showReply  = false;
        item.newReply   = '';
        item.loading    = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.show('Failed to publish response', 'error');
        item.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // BUG FIX: trackBy missing — every loadAll() call recreated all card DOM nodes,
  // resetting open reply forms and causing flicker
  trackById(_: number, item: any): string {
    return item._id;
  }
}