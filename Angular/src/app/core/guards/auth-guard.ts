import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);
  if (!authService.isLoggedIn()) {
    toastr.error('You must be logged in to access this page.', 'Unauthorized');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.mustResetPassword() && !state.url.includes('/reset-password')) {
    toastr.warning('Please reset your temporary password before continuing.', 'Action Required');
    router.navigate(['/reset-password']);
    return false;
  }

  const requiredPermissions = route.data['permissions'] as string[];

  if (requiredPermissions?.length > 0) {
    const hasPermission = authService.hasAnyPermission(requiredPermissions);

    if (!hasPermission) {
      toastr.error('You do not have permission to access this page.', 'Access Denied');
      router.navigate(['/forbidden']);
      return false;
    }
  }

  return true;
};