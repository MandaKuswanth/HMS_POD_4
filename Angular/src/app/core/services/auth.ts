import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface UserRole {
  roleId: string;
  name: string;
}

export interface User {
  id: string;
  employeeId?: string;
  UHID?: string;
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
    accessToken: string;
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

  private readonly API_URL = 'http://localhost:3000/api/v1/auth';
  private readonly EMP_API_URL = 'http://localhost:3000/api/v1/employees';

  // State Signals
  private readonly _accessToken = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);
  private readonly _permissions = signal<string[]>([]);

  // Public Read-Only Signals
  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly isLoggedIn = computed(() => !!this._accessToken());

  login(data: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, data).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setAuthState(res.data.accessToken, res.data.user);
        }
      })
    );
  }

  refresh(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/refresh`, {}, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setAuthState(res.data.accessToken, res.data.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearAuthState();
      })
    );
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.EMP_API_URL}/reset-password`, data);
  }

  setAuthState(token: string, user: User): void {
    this._accessToken.set(token);
    this._user.set(user);
    this._permissions.set(user.permissions || []);
  }

  clearAuthState(): void {
    this._accessToken.set(null);
    this._user.set(null);
    this._permissions.set([]);
    this.router.navigate(['/login']);
  }

  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
  }

  saveLoginData(response: any): void {
    if (response && response.data) {
      this.setAuthState(response.data.accessToken, response.data.user);
    }
  }

  mustResetPassword(): boolean {
    return this._user()?.mustResetPassword || false;
  }

  getUser(): User | null {
    return this._user();
  }

  getRole(): string | null {
    const user = this._user();
    if (!user || !user.roles || user.roles.length === 0) {
      return null;
    }
    return user.roles[0].name;
  }
}