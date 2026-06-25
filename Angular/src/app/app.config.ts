import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token-interceptor';
import { AuthService } from './core/services/auth';
import { catchError, of } from 'rxjs';

export function initializeApp(authService: AuthService) {
  return () => {
    return new Promise<void>((resolve) => {
      authService.refresh().pipe(
        catchError(() => {
          // If silent refresh fails on startup, resolve successfully and let authGuard handle routing to login
          return of(null);
        })
      ).subscribe(() => {
        resolve();
      });
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(withInterceptors([tokenInterceptor])),

    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),

    provideNativeDateAdapter(),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    }
  ],
};