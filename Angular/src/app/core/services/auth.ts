import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs'; // 1. ADDED: Import 'tap' from rxjs

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword?: string;
}

export interface RoleInfo {
  roleId: string;
  name: string;
}

export interface User {
  employeeId: string;
  email: string;
  roleIds: string[];
  roles: RoleInfo[];
  permissions: string[];
  status: boolean;
  mustResetPassword: boolean;
}

export interface LoginResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    token: string;
    resetRequired: boolean;
    user: User;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.API_URL}/api/employees`;

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.API_URL}/login`,
      data
    ).pipe(
      tap(res => this.saveLoginData(res)) // 2. FIXED: Changed 'tab' to 'tap'
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(
      `${this.API_URL}/reset-password`,
      data
    );
  }

  saveLoginData(response: LoginResponse): void {
    const token = response?.data?.token;
    const user = response?.data?.user;

    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }

    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  getRole(): string | null {
    // Optional: Kept this in case you still need to pull a primary role string, 
    // but relies on the roles array now.
    return this.getUser()?.roles?.[0]?.name ?? null;
  }

  getEmployeeId(): string | null {
    return this.getUser()?.employeeId ?? null;
  }

  mustResetPassword(): boolean {
    return this.getUser()?.mustResetPassword ?? false;
  }

  hasRole(roleName: string): boolean {
    const user = this.getUser();
    return user?.roles?.some(r => r.name === roleName) ?? false;
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.includes(permission) ?? false;
  }
}