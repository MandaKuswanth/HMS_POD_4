import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedQuery, buildQueryParams } from '../models/api-response.model';

export interface Role {
  roleId: string;
  name: string;
  description?: string;
  permissions: string[];
  status: boolean;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/api/roles`;

  getRoles(query: PaginatedQuery = {}): Observable<ApiResponse<Role[]>> {
    const params = new HttpParams({ fromObject: buildQueryParams(query) });
    return this.http.get<ApiResponse<Role[]>>(this.baseUrl, { params });
  }

  getRoleById(roleId: string): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.baseUrl}/${roleId}`);
  }

  createRole(data: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.baseUrl, data);
  }

  updateRole(roleId: string, data: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.baseUrl}/${roleId}`, data);
  }

  deleteRole(roleId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${roleId}`);
  }
}
