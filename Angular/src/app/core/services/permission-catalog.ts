import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CatalogPermission {
    key: string;
    label: string;
    description?: string;
}

export interface CatalogResponse {
    success: boolean;
    data: Record<string, CatalogPermission[]>;
}
export interface CreatePermissionPayload {
    key: string;
    label: string;
    category: string;
    description?: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionCatalogService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/api/permissions`;

    getCatalog(): Observable<CatalogResponse> {
        return this.http.get<CatalogResponse>(`${this.baseUrl}/catalog`);
    }
    createPermission(payload: CreatePermissionPayload): Observable<any> {
        return this.http.post(`${this.baseUrl}/catalog`, payload);
    }

    deletePermission(key: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/catalog/${key}`);
    }
}