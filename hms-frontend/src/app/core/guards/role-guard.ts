  import { inject } from '@angular/core';
  import { CanActivateFn, Router } from '@angular/router';
  import { ToastrService } from 'ngx-toastr';

  export const roleGuard: CanActivateFn = () => {
    const router = inject(Router);
    const toastr = inject(ToastrService);

    const role = localStorage.getItem('role');

    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      return true;
    }

    toastr.error('Access denied. Only ADMIN or TECHNICIAN can access this page.');
    router.navigate(['/dashboard']);
    return false;
  };