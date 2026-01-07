import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Import the Navbar
import { NavbarComponent } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  // Register imports here so they can be used in the template
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <!-- The Navbar sits at the top -->
    <app-navbar></app-navbar>

    <!-- The RouterOutlet displays the current page (Home, Menu, etc.) -->
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
