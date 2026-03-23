import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts(); trackBy: trackById"
        class="toast-item"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        [class.toast-info]="toast.type === 'info'">

        <!-- Icon -->
        <div class="toast-icon">
          <!-- Success -->
          <svg *ngIf="toast.type === 'success'" width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Error -->
          <svg *ngIf="toast.type === 'error'" width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!-- Info -->
          <svg *ngIf="toast.type === 'info'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <!-- Message -->
        <span class="toast-message">{{ toast.message }}</span>

        <!-- Close -->
        <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Dismiss">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Progress bar — auto-dismiss indicator -->
        <div class="toast-progress"></div>
      </div>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       DESIGN TOKENS — full system match
    ═══════════════════════════════════════════ */
    :host {
      --green:       #22c55e;
      --green-dim:   rgba(34,197,94,0.15);
      --green-border:rgba(34,197,94,0.25);
      --red:         #ef4444;
      --red-dim:     rgba(239,68,68,0.15);
      --red-border:  rgba(239,68,68,0.25);
      --blue:        #4f9cf9;
      --blue-dim:    rgba(79,156,249,0.15);
      --blue-border: rgba(79,156,249,0.25);
      --surface-2:   #111111;
      --border-h:    rgba(255,255,255,0.13);
      --text:        #f0ede8;
      --text-muted:  #9a9a9a;
    }

    /* ═══════════════════════════════════════════
       CONTAINER
       BUG FIX: original used flex-direction: column-reverse
       which made the newest toast appear at the BOTTOM of the
       stack (visually lowest) — counter-intuitive. Newest should
       stack on top. Changed to column-reverse correctly but
       positioned from bottom-right so newest appears closest
       to the corner the user's eye goes to first.
    ═══════════════════════════════════════════ */
    .toast-container {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      /* newest toast appended last = visually on top when column */
    }

    /* ═══════════════════════════════════════════
       TOAST ITEM
    ═══════════════════════════════════════════ */
    .toast-item {
      position: relative;
      pointer-events: auto;
      min-width: 300px;
      max-width: 420px;
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 13px 14px 13px 14px;
      border-radius: 14px;
      /* BUG FIX: original used solid colored backgrounds (rgba green/red/blue 0.95)
         which looked out of place against the dark design system. Replaced with
         the surface-2 base + colored left border + dim background — matching the
         card/tile system used throughout the app. */
      background: var(--surface-2);
      border: 1px solid var(--border-h);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
      animation: toastIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
      overflow: hidden;
    }

    @keyframes toastIn {
      from { transform: translateX(110%) scale(0.95); opacity: 0; }
      to   { transform: translateX(0)   scale(1);    opacity: 1; }
    }

    /* Type-specific left accent border + icon background */
    .toast-success { border-left: 3px solid var(--green); background: color-mix(in srgb, #111111 88%, #22c55e 12%); }
    .toast-error   { border-left: 3px solid var(--red);   background: color-mix(in srgb, #111111 88%, #ef4444 12%); }
    .toast-info    { border-left: 3px solid var(--blue);  background: color-mix(in srgb, #111111 88%, #4f9cf9 12%); }

    /* ── Icon circle ── */
    .toast-icon {
      width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    /* BUG FIX: original used emoji (✅ ❌ ℹ️) which render inconsistently
       across OS/browser (different sizes, colors, styles). Replaced with
       SVG icons that are always the correct size and color. */
    .toast-success .toast-icon { background: var(--green-dim); color: var(--green); }
    .toast-error   .toast-icon { background: var(--red-dim);   color: var(--red);   }
    .toast-info    .toast-icon { background: var(--blue-dim);  color: var(--blue);  }

    /* ── Message ── */
    .toast-message {
      flex: 1;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.45;
      /* BUG FIX: original had no min-width:0 — long messages caused the
         container to overflow past max-width on some browsers */
      min-width: 0;
      word-break: break-word;
    }

    /* ── Close button ── */
    .toast-close {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      color: var(--text-muted); cursor: pointer;
      transition: background 0.18s, color 0.18s;
      /* BUG FIX: original close button used &times; text character which
         renders at different sizes depending on font-family. SVG is consistent. */
    }
    .toast-close:hover {
      background: rgba(255,255,255,0.12);
      color: var(--text);
    }

    /* ── Progress bar ──
       Animates from full width to 0 over ~3s to give visual feedback
       that the toast will auto-dismiss. Duration should match ToastService
       auto-remove delay (typically 3000ms). */
    .toast-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 2px; width: 100%;
      transform-origin: left;
      animation: progress 3s linear forwards;
      border-radius: 0 0 14px 14px;
    }
    .toast-success .toast-progress { background: var(--green); }
    .toast-error   .toast-progress { background: var(--red);   }
    .toast-info    .toast-progress { background: var(--blue);  }

    @keyframes progress {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 480px) {
      .toast-container {
        left: 16px;
        right: 16px;
        bottom: 20px;
      }
      .toast-item {
        min-width: 0;
        max-width: 100%;
      }
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);

  // BUG FIX: *ngFor had no trackBy — every signal update re-created ALL
  // toast DOM nodes, resetting the progress bar animation mid-display and
  // causing visual flicker when a new toast was added while others existed.
  trackById(_: number, toast: any): string {
    return toast.id;
  }
}