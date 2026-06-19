import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  hidePassword = true;
  loading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const credentials = this.loginForm.getRawValue();

    this.authService.login({
      email: credentials.email!,
      password: credentials.password!
    }).subscribe({
      next: (res) => {
        this.loading = false;

        // FIX: backend sends resetRequired when admin creates an employee
        // with a temp password — must redirect to reset-password first
        if (res.data.resetRequired) {
          this.toastr.warning('Please reset your temporary password to continue.', 'Action Required');
          this.router.navigate(['/reset-password']);
        } else {
          this.toastr.success('Login successful');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;

        if (err.status === 403 || err.error?.message?.toLowerCase().includes('pending')) {
          this.router.navigate(['/account-inactive']);
        } else {
          this.toastr.error(err.error?.message || 'Invalid credentials');
        }
      }
    });
  }
}  