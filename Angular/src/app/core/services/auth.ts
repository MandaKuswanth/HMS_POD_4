import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

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
    refreshToken: string;
    resetRequired: boolean;
    user: User;
  };
}

export interface RefreshTokenResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
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
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
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
    const refreshToken = response?.data?.refreshToken;
    const user = response?.data?.user;

    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }

    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.savePermissions(user.permissions || []);
    }
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({ error: () => {} });
    }

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);

    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh-token`, { refreshToken }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.data.token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, res.data.refreshToken);
      })
    );
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
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