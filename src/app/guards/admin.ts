import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ToastService } from '../services/toast';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = authService.currentUser();

  if (user && user.role === 'OWNER') {
    return true;
  }

  if (user) {
    toast.error('Access Denied: Owner privileges required.');
  } else {
    toast.error('Please login to continue.');
  }

  router.navigate(['/home']);
  return false;
};
