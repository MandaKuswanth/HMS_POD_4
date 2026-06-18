import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // 1. REQUIRED for Toastr
import { provideToastr } from 'ngx-toastr';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token-interceptor';

// 2. Optional: Custom Global Error Handler
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any) {
    console.error('Global Error Caught:', error);
    // You can send this to an error tracking service like Sentry
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // Ensure animations are provided for Toastr and Material components
   provideAnimationsAsync(),

    provideHttpClient(withInterceptors([tokenInterceptor])),

    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true, // Recommended for better UX
    }),

    provideNativeDateAdapter(),

    // 3. Proper way to provide error handling
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
};