import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr'; // Added for better UX
import { catchError, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const token = localStorage.getItem('token');

  // 1. Clone and add Authorization header
  const authReq = token ? req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 2. Handle 401 Unauthorized globally
      if (error.status === 401) {
        toastr.error('Session expired. Please login again.', 'Session Ended');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      // 3. Handle 403 Forbidden globally (Access denied)
      else if (error.status === 403) {
        toastr.error('You do not have permission to perform this action.', 'Access Denied');
      }
      // 4. Extract custom message from your backend's ApiError class
      else if (error.error?.message) {
        toastr.error(error.error.message, 'Error');
      }

      return throwError(() => error);
    })
  );
};