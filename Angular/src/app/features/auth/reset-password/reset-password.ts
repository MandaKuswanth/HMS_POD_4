import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Added for performance
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;

  resetForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    {
      validators: this.passwordMatchValidator
    }
  );

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      this.toastr.error('Please fix password errors');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck(); // Update UI to show loading state

    // Safely extract strictly-typed values
    const { newPassword, confirmPassword } = this.resetForm.getRawValue();

    const payload = {
      newPassword,
      confirmPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('Password reset successful');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        const message =
          error?.error?.message ||
          error?.error?.errors?.[0]?.msg ||
          'Password reset failed';

        this.toastr.error(message);
        this.cdr.markForCheck(); // Update UI to hide loading state on error
      }
    });
  }
}