import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ToastrService } from 'ngx-toastr';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  readonly fb = inject(FormBuilder);
  readonly authService = inject(Auth);
  readonly router = inject(Router);
  readonly toastr = inject(ToastrService);
  readonly cdr = inject(ChangeDetectorRef);

  hidePassword = true;
  loading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.error('Please enter valid login details');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.authService.login(this.loginForm.value as any).subscribe({
      next: (response) => {
        this.loading = false;
        this.cdr.markForCheck();

        this.authService.saveLoginData(response);

        const mustResetPassword = localStorage.getItem('mustResetPassword') === 'true';
        const route = mustResetPassword ? '/reset-password' : '/dashboard';

        this.router.navigate([route]).then(() => {
          setTimeout(() => {
            this.toastr.success('Login successful');
          });
        });
      },
      error: (error) => {

        this.loading = false;

        this.cdr.markForCheck();

        console.log(error);

        if (error.status === 403) {

          this.router.navigate(['/account-inactive']);

          return;
        }

        const message =
          error?.error?.message ||
          error?.error?.errors?.[0] ||
          'Invalid credentials';

        this.toastr.error(message);
      }
    });
  }
}
