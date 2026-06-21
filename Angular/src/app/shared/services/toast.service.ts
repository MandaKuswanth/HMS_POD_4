import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, title?: string): void {
    this.show(message, title, 'success');
  }

  error(message: string, title?: string): void {
    this.show(message, title, 'error');
  }

  warning(message: string, title?: string): void {
    this.show(message, title, 'warning');
  }

  info(message: string, title?: string): void {
    this.show(message, title, 'info');
  }

  private show(message: string, title: string | undefined, type: ToastType): void {
    const text = title ? `${title}: ${message}` : message;

    this.snackBar.open(text, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`hms-snackbar`, `hms-snackbar-${type}`],
    });
  }
}
