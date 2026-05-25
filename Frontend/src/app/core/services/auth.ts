import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly baseUrl = 'http://localhost:5000/api/employees';

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, data);
  }

  saveLoginData(response: any): void {
    const token = response?.data?.token;
    const user = response?.data?.user;
    const role = user?.role;

    const mustResetPassword =
      response?.data?.resetRequired ?? user?.mustResetPassword ?? false;

    if (token) {
      localStorage.setItem('token', token);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    if (role) {
      localStorage.setItem('role', role);
    }

    localStorage.setItem('mustResetPassword', String(mustResetPassword));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('mustResetPassword');

    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem('token'));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getUser(): any {
    const user = localStorage.getItem('user');

    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  isAdminOrTechnician(): boolean {
    const role = this.getRole();
    return role === 'ADMIN' || role === 'TECHNICIAN';
  }

  mustResetPassword(): boolean {
    return localStorage.getItem('mustResetPassword') === 'true';
  }

  markPasswordResetDone(): void {
    localStorage.setItem('mustResetPassword', 'false');

    const user = this.getUser();

    if (user) {
      user.mustResetPassword = false;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}