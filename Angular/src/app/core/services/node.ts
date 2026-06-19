import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MenuNode {
    nodeId: string;
    name: string;
    path: string;
    icon: string;
    permissions: string[];
    parentNodeId: string | null;
    order: number;
    children?: MenuNode[];
}

export interface MyMenuResponse {
    permissions: string[];
    menu: MenuNode[];
}

@Injectable({
    providedIn: 'root'
})
export class NodeService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = `${environment.API_URL}/api/nodes`;

    // Cache so we don't call the backend on every navigation
    private menuCache$?: Observable<MyMenuResponse>;

    /**
     * Calls GET /api/nodes/my-menu
     * Backend filters nodes by the logged-in user's permissions and returns a nested tree.
     * This is the only endpoint the sidebar should ever call.
     */
    getMyMenu(): Observable<MyMenuResponse> {
        if (!this.menuCache$) {
            this.menuCache$ = this.http.get<any>(`${this.API_URL}/my-menu`).pipe(
                map(res => res.data as MyMenuResponse),
                shareReplay(1)
            );
        }
        return this.menuCache$;
    }

    /**
     * Call this on logout so the next user gets a fresh menu.
     */
    clearCache(): void {
        this.menuCache$ = undefined;
    }
}