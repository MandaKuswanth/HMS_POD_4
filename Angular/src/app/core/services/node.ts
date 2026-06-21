import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

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

export interface NodeItem {
  nodeId: string;
  name: string;
  path: string;
  icon: string;
  permissions: string[];
  parentNodeId: string | null;
  order: number;
  status: boolean;
  isDeleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class NodeService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/api/nodes`;

  private menuCache$?: Observable<MyMenuResponse>;

  getMyMenu(): Observable<MyMenuResponse> {
    if (!this.menuCache$) {
      this.menuCache$ = this.http.get<ApiResponse<MyMenuResponse>>(`${this.API_URL}/my-menu`).pipe(
        map(res => res.data),
        shareReplay(1)
      );
    }
    return this.menuCache$;
  }

  getNodes(): Observable<ApiResponse<NodeItem[]>> {
    return this.http.get<ApiResponse<NodeItem[]>>(this.API_URL);
  }

  clearCache(): void {
    this.menuCache$ = undefined;
  }
}
