import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MenuNode {
    nodeId: string;
    name: string;
    path: string;
    icon: string;
    permissions: string[];
    order: number;
    status: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NodeService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = `${environment.API_URL}/api/nodes`;

    // Cache the nodes so we don't spam the backend on every page refresh
    private nodesCache$?: Observable<MenuNode[]>;

    getActiveNodes(): Observable<MenuNode[]> {
        if (!this.nodesCache$) {
            this.nodesCache$ = this.http.get<MenuNode[]>(this.API_URL).pipe(
                shareReplay(1)
            );
        }
        return this.nodesCache$;
    }
}