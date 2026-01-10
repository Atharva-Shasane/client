import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-wrapper">
      <div class="container fade-in">
        <div class="glitch-box">
          <h1 class="glitch">404</h1>
          <span class="shadow">404</span>
        </div>
        <h2>Table <span class="highlight">Not Found</span></h2>
        <p>Sorry, the page you are looking for has been cleared from our menu.</p>
        <button (click)="goHome()" class="home-btn">Back to Reality</button>
      </div>
    </div>
  `,
  styles: [
    `
      .error-wrapper {
        background: #0a0a0a;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-family: 'Poppins', sans-serif;
        padding: 0 20px;
      }
      .glitch-box {
        position: relative;
        margin-bottom: 20px;
      }
      h1 {
        font-size: 10rem;
        font-weight: 900;
        margin: 0;
        color: #ff6600;
        line-height: 1;
        letter-spacing: -5px;
      }
      .shadow {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        font-size: 10rem;
        font-weight: 900;
        color: rgba(255, 255, 255, 0.03);
        z-index: -1;
        transform: translate(5px, 5px);
      }

      h2 {
        font-size: 3rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -1px;
      }
      .highlight {
        color: #ff6600;
      }
      p {
        color: #666;
        font-size: 1.1rem;
        margin: 20px 0 40px;
        max-width: 450px;
        margin-left: auto;
        margin-right: auto;
      }

      .home-btn {
        padding: 16px 45px;
        background: white;
        color: black;
        border: none;
        border-radius: 50px;
        font-weight: 800;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.3s;
        box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
      }
      .home-btn:hover {
        background: #ff6600;
        color: white;
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(255, 107, 0, 0.3);
      }

      @media (max-width: 768px) {
        h1 {
          font-size: 6rem;
        }
        h2 {
          font-size: 2rem;
        }
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
