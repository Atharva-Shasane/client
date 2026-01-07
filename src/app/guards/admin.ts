import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // ye wala line check kr rha hai k PERSON logged in hai k nhi
  const user = authService.currentUser();

  // agar user hai aur uska role OWNER hai to access dega
  if (user && user.role === 'OWNER') {
    return true;
  }

  // agar role "USER" hai to alert show krdo k owner hona chahiye
  if (user) {
    alert('Access Denied: Owner privileges required.');
  }

  router.navigate(['/home']);
  return false;
};
