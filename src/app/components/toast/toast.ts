import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts()" class="toast-item" [ngClass]="toast.type">
        <div class="toast-content">
          <span class="icon" [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'">✅</span>
            <span *ngSwitchCase="'error'">❌</span>
            <span *ngSwitchCase="'info'">ℹ️</span>
          </span>
          <span class="message">{{ toast.message }}</span>
        </div>
        <button (click)="toastService.remove(toast.id)" class="close-btn">&times;</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 30px; /* Moved to bottom to avoid Navbar overlap */
        right: 30px;
        z-index: 9999;
        display: flex;
        flex-direction: column-reverse; /* Newest toasts appear at the bottom */
        gap: 12px;
        pointer-events: none;
      }

      .toast-item {
        pointer-events: auto;
        min-width: 320px;
        max-width: 450px;
        padding: 16px 20px;
        border-radius: 16px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        animation: slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .message {
        font-weight: 600;
        font-size: 0.95rem;
        font-family: 'Poppins', sans-serif;
      }

      .success {
        background: rgba(46, 204, 113, 0.95);
      }

      .error {
        background: rgba(231, 76, 60, 0.95);
      }

      .info {
        background: rgba(52, 152, 219, 0.95);
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 1.2rem;
        width: 28px;
        height: 28px;
        line-height: 24px;
        border-radius: 50%;
        cursor: pointer;
        margin-left: 15px;
        transition: 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      @keyframes slideInUp {
        from {
          transform: translateY(100%) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
