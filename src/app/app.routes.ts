import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { MenuComponent } from './pages/menu/menu';
import { CartComponent } from './pages/cart/cart';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { MyOrdersComponent } from './pages/my-orders/my-orders';
import { ProfileComponent } from './pages/profile/profile';
import { OwnerDashboardComponent } from './pages/owner/dashboard';
import { MenuManagementComponent } from './pages/owner/menu-management';
import { CheckoutComponent } from './pages/checkout/checkout';
import { NotFoundComponent } from './pages/not-found/not-found';
import { AnalyticsComponent } from './pages/owner/analytics';
import { OwnerFeedbackComponent } from './pages/owner/feedback-admin';
import { authGuard } from './guards/auth';
import { adminGuard } from './guards/admin';

export const routes: Routes = [
  // Redirect empty path to home
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'cart', component: CartComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Customer Routes with Auth Guard
  {
    path: 'my-orders',
    component: MyOrdersComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
  },

  // Owner Exclusive Routes with Admin Guard
  {
    path: 'owner',
    component: OwnerDashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'owner/menu',
    component: MenuManagementComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'owner/analytics',
    component: AnalyticsComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'owner/feedback',
    component: OwnerFeedbackComponent,
    canActivate: [adminGuard],
  },

  // Fallback for 404
  { path: '**', component: NotFoundComponent },
];
