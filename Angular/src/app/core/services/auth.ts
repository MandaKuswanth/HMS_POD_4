import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs';
import { NodeService } from './node';

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

  private readonly nodeService = inject(NodeService);

  private readonly API_URL = `${environment.API_URL}/api/employees`;

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  // ─── Reactive signals ───────────────────────────────────────────────────────
  // These replace any hardcoded role checks across the app.
  // Components and guards read from these instead of calling getUser() directly.

  private _user = signal<User | null>(this._loadUser());
  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  /** Read-only user signal — use in templates with auth.user() */
  readonly user = this._user.asReadonly();

  /** Flat permissions array derived from the logged-in user */
  readonly permissions = computed(() => this._user()?.permissions ?? []);

  /** True if a valid token exists */
  readonly isAuthenticated = computed(() => !!this._token());

  // ─── Auth actions ────────────────────────────────────────────────────────────

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.API_URL}/login`,
      data
    ).pipe(
      tap(res => this.saveLoginData(res))
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
      this._token.set(token);
    }

    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this._user.set(user);
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.nodeService.clearCache();  // add this line
    this.router.navigate(['/login']);
  }

  // ─── Permission helpers ───────────────────────────────────────────────────────

  /** Check if the user has a single permission */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /** Check if the user has at least one of the given permissions */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /** Check if the user has all of the given permissions */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /** Check if the user has a specific role by name */
  hasRole(roleName: string): boolean {
    return this._user()?.roles?.some(r => r.name === roleName) ?? false;
  }

  // ─── Convenience getters ──────────────────────────────────────────────────────

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return this._token();
  }

  getUser(): User | null {
    return this._user();
  }

  getRole(): string | null {
    return this._user()?.roles?.[0]?.name ?? null;
  }

  getEmployeeId(): string | null {
    return this._user()?.employeeId ?? null;
  }

  mustResetPassword(): boolean {
    return this._user()?.mustResetPassword ?? false;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private _loadUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
