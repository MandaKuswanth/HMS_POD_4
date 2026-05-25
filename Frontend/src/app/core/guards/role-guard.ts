import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const role = localStorage.getItem('role');
  const allowedRoles: string[] = route.data?.['roles'] || [];

  // If no roles specified, fall back to legacy admin check
  if (allowedRoles.length === 0) {
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      return true;
    }
    toastr.error('Access denied. You do not have permission to access this page.');
    // router.navigate(['/unauthorized']);
    router.navigate(['/dashboard']);

    return false;
  }

  // Check if current role is in allowed list
  if (role && allowedRoles.includes(role)) {
    return true;
  }

  toastr.error('Access denied. You do not have permission to access this page.');
  // router.navigate(['/unauthorized']);
  router.navigate(['/dashboard']);

  return false;
};