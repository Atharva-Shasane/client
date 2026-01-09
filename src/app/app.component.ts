import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { ToastComponent } from './components/toast/toast'; // Import Toast UI

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent], // Add ToastComponent here
  template: `
    <!-- Global Notifications -->
    <app-toast></app-toast>

    <app-navbar></app-navbar>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      main {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
})
export class AppComponent {
  title = 'Killa Restaurant';
}
