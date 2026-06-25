import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';

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
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  hidePassword = true;
  loading = false;

  readonly loginForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        )
      ]
    ],
    password: ['', Validators.required]
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.error('Please enter valid login details');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => this.handleLoginSuccess(response),

        error: (error) => this.handleLoginError(error)
      });
  }

  private handleLoginSuccess(response: any): void {
    this.authService.saveLoginData(response);

    const redirectUrl = this.authService.mustResetPassword()
      ? '/reset-password'
      : '/dashboard';

    this.router.navigate([redirectUrl]).then(() => {
      this.toastr.success('Login successful');
    });
  }

  private handleLoginError(error: any): void {
    console.error('Login Error:', error);

    if (error.status === 403) {
      this.router.navigate(['/account-inactive']);
      return;
    }

    this.toastr.error(
      this.getErrorMessage(error)
    );
  }

  private getErrorMessage(error: any): string {
    return (
      error?.error?.message ??
      error?.error?.errors?.[0] ??
      'Invalid credentials'
    );
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}