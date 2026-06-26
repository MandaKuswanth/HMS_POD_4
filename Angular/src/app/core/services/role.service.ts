import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RoleData {
  _id: string;
  roleId: string;
  name: string;
  description?: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/roles`;

  // Cache subjects
  private rolesSubject = new BehaviorSubject<RoleData[] | null>(null);
  private publicRolesSubject = new BehaviorSubject<RoleData[] | null>(null);

  // Expose observables with shareReplay
  public roles$ = this.rolesSubject.asObservable().pipe(
    shareReplay(1)
  );
  
  public publicRoles$ = this.publicRolesSubject.asObservable().pipe(
    shareReplay(1)
  );

  /**
   * Fetches authenticated roles dynamically applying visibility rules.
   * If cached, returns cached data.
   */
  getRoles(): Observable<RoleData[]> {
    if (this.rolesSubject.getValue() !== null) {
      return this.roles$ as Observable<RoleData[]>;
    }
    return this.fetchRolesFromServer();
  }

  /**
   * Fetches public roles for self registration (No SUPER_ADMIN/ADMIN)
   */
  getPublicRoles(): Observable<RoleData[]> {
    if (this.publicRolesSubject.getValue() !== null) {
      return this.publicRoles$ as Observable<RoleData[]>;
    }
    return this.fetchPublicRolesFromServer();
  }

  /**
   * Force refresh the cache (call after Create/Update/Delete)
   */
  refreshRoles(): void {
    this.fetchRolesFromServer().subscribe();
    this.fetchPublicRolesFromServer().subscribe();
  }

  private fetchRolesFromServer(): Observable<RoleData[]> {
    return this.http.get<any>(`${this.baseUrl}/search?limit=50`).pipe(
      map(response => response.data || []),
      tap(roles => this.rolesSubject.next(roles)),
      catchError(err => {
        console.error('Failed to fetch roles', err);
        return of([]);
      })
    );
  }

  private fetchPublicRolesFromServer(): Observable<RoleData[]> {
    return this.http.get<any>(`${this.baseUrl}/public-search?limit=50`).pipe(
      map(response => response.data || []),
      tap(roles => this.publicRolesSubject.next(roles)),
      catchError(err => {
        console.error('Failed to fetch public roles', err);
        return of([]);
      })
    );
  }
}
