import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    toastr.error('You must be logged in to access this page.', 'Unauthorized');
    router.navigate(['/login']);
    return false;
  }

  return true;
};