import { Injectable, inject, signal, computed } from '@angular/core';
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
  private readonly USER_KEY = 'user';
  private readonly PERMISSIONS_KEY = 'permissions';

  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(this.TOKEN_KEY)
  );
  private readonly userSignal = signal<User | null>(this.readUserFromStorage());
  private readonly permissionsSignal = signal<string[]>(
    this.readPermissionsFromStorage()
  );

  /** Reactive current user; updates on login/logout without a page reload. */
  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.tokenSignal());
  readonly permissions = this.permissionsSignal.asReadonly();
  readonly role = computed(() => this.user()?.roles?.[0]?.name ?? null);
  readonly roles = computed(
    () => this.user()?.roles?.map((role) => role.name) ?? []
  );

  private readUserFromStorage(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  private readPermissionsFromStorage(): string[] {
    const permissions = localStorage.getItem(this.PERMISSIONS_KEY);
    return permissions ? JSON.parse(permissions) : [];
  }

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
      this.tokenSignal.set(token);
    }

    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.userSignal.set(user);
      this.savePermissions(user.permissions || []);
    }
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).subscribe({ error: () => {} });

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);

    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.permissionsSignal.set([]);

    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh-token`, {}, { withCredentials: true }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.data.token);
        this.tokenSignal.set(res.data.token);
      })
    );
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getUser(): User | null {
    return this.user();
  }

  getRole(): string | null {
    return this.role();
  }

  getRoles(): string[] {
    return this.roles();
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  getEmployeeId(): string | null {
    return this.user()?.employeeId ?? null;
  }

  mustResetPassword(): boolean {
    return this.user()?.mustResetPassword ?? false;
  }

  savePermissions(permissions: string[]): void {
    localStorage.setItem(
      this.PERMISSIONS_KEY,
      JSON.stringify(permissions)
    );
    this.permissionsSignal.set(permissions);
  }

  getPermissions(): string[] {
    return this.permissions();
  }

  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }
}