import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RoleRequest {
  roleId?: string;
  name: string;
  description?: string;
  permissions: string[];
  status?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private readonly http = inject(HttpClient);

  private readonly API_URL =
    environment.apiUrl + '/api/roles';

  getRoles(
    page = 1,
    limit = 5
  ): Observable<any> {
    return this.http.get(
      `${this.API_URL}?page=${page}&limit=${limit}`
    );
  }

  getRoleById(
    roleId: string
  ): Observable<any> {
    return this.http.get(
      `${this.API_URL}/${roleId}`
    );
  }

  createRole(
    data: RoleRequest
  ): Observable<any> {
    return this.http.post(
      this.API_URL,
      data
    );
  }

  updateRole(
    roleId: string,
    data: Partial<RoleRequest>
  ): Observable<any> {
    return this.http.put(
      `${this.API_URL}/${roleId}`,
      data
    );
  }

  deleteRole(
    roleId: string
  ): Observable<any> {
    return this.http.delete(
      `${this.API_URL}/${roleId}`
    );
  }
}