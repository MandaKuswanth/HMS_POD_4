import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const token = localStorage.getItem('token');

  if (!token) {
    toastr.error('Please login first');
    router.navigate(['/login']);
    return false;
  }

  return true;
};