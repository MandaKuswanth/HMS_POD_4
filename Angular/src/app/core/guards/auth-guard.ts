import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../shared/services/toast.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    toast.error('You must be logged in to access this page.', 'Unauthorized');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.mustResetPassword() && !state.url.includes('/reset-password')) {
    toast.warning('Please reset your temporary password before continuing.', 'Action Required');
    router.navigate(['/reset-password']);
    return false;
  }

  const requiredPermissions = route.data['permissions'] as string[] | undefined;

  if (requiredPermissions?.length) {
    const hasPermission = authService.hasAnyPermission(requiredPermissions);

    if (!hasPermission) {
      toast.error('You do not have permission to access this page.', 'Access Denied');
      router.navigate(['/forbidden']);
      return false;
    }
  }

  return true;
};
