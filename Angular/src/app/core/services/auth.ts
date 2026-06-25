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

export interface UserRole {
  roleId: string;
  name: string;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  roleIds: string[];
  roles: UserRole[];
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
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = 'http://localhost:3000/api/employees';

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';
  private readonly PERMISSIONS_KEY = 'permissions';

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.API_URL}/login`,
      data
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
      localStorage.setItem(
        this.USER_KEY,
        JSON.stringify(user)
      );

      this.savePermissions(user.permissions || []);
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);

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
    return this.getUser()?.roles?.[0]?.name ?? null;
  }

  getRoles(): string[] {
    return this.getUser()?.roles?.map((role) => role.name) ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  getEmployeeId(): string | null {
    return this.getUser()?.employeeId ?? null;
  }

  mustResetPassword(): boolean {
    return this.getUser()?.mustResetPassword ?? false;
  }

  savePermissions(permissions: string[]): void {
    localStorage.setItem(
      this.PERMISSIONS_KEY,
      JSON.stringify(permissions)
    );
  }

  getPermissions(): string[] {
    const permissions = localStorage.getItem(this.PERMISSIONS_KEY);
    return permissions ? JSON.parse(permissions) : [];
  }

  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }
}