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

  // 1. Check if the user is authenticated
  if (!authService.isLoggedIn()) {
    toastr.error('You must be logged in to access this page.', 'Unauthorized');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // 2. Check if the user is forced to reset their password
  if (authService.mustResetPassword() && !state.url.includes('/reset-password')) {
    toastr.warning('Please reset your temporary password before continuing.', 'Action Required');
    router.navigate(['/reset-password']);
    return false;
  }

  // 3. Dynamic Permission Checking (Maps to your backend allowPermission middleware)
  const requiredPermissions = route.data['permissions'] as string[];

  if (requiredPermissions && requiredPermissions.length > 0) {
    // Check if the user's JWT has AT LEAST ONE of the required permissions
    const hasPermission = requiredPermissions.some(permission =>
      authService.hasPermission(permission)
    );

    if (!hasPermission) {
      toastr.error('You do not have permission to access this module.', 'Access Denied');
      router.navigate(['/dashboard']); // Redirect to a safe page
      return false;
    }
  }

  return true; // Everything is valid!
};