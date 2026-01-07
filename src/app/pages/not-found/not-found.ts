import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="not-found-container">
      <h1>404</h1>
      <p>Oops! The page you are looking for has been eaten.</p>
      <button (click)="goHome()">Return Home</button>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 80vh;
        text-align: center;
        background: #f8f9fa;
      }
      h1 {
        font-size: 6rem;
        margin: 0;
        color: #ff6b00;
      }
      p {
        font-size: 1.5rem;
        color: #555;
        margin-bottom: 2rem;
      }
      button {
        padding: 12px 24px;
        background: #333;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1.2rem;
        cursor: pointer;
        transition: 0.3s;
      }
      button:hover {
        background: #000;
      }
    `,
  ],
})
export class NotFoundComponent {
  router = inject(Router);

  goHome() {
    this.router.navigate(['/home']);
  }
}
