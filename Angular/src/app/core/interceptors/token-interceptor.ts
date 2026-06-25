import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, BehaviorSubject, Observable, filter, take, switchMap } from 'rxjs';
import { AuthService } from '../services/auth';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  let authReq = req;
  if (token) {
    authReq = addTokenHeader(req, token);
  }

  // Ensure cookies (withCredentials) are sent so that httpOnly secure refresh token works
  authReq = authReq.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Avoid retrying on refresh or login endpoints themselves
        if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
          authService.clearAuthState();
          return throwError(() => error);
        }
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

const addTokenHeader = (request: HttpRequest<any>, token: string) => {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
};

const handle401Error = (
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refresh().pipe(
      switchMap((res) => {
        isRefreshing = false;
        const newToken = res.data.accessToken;
        refreshTokenSubject.next(newToken);
        return next(addTokenHeader(request, newToken));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.clearAuthState();
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addTokenHeader(request, token!)))
    );
  }
};