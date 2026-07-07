import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface MenuNode {
  nodeId?: string;
  name: string;
  path: string;
  icon?: string;
  permissions: string[];
  parentNodeId?: string | null;
  order?: number;
  status?: boolean;
  isDeleted?: boolean;
  children?: MenuNode[];
}

@Injectable({
  providedIn: 'root',
})
export class NodeService {
  private readonly http = inject(HttpClient);

  private readonly API_URL = environment.apiUrl + '/api/nodes';

  getMyMenu(): Observable<any> {
    return this.http.get(`${this.API_URL}/my-menu`);
  }

  getNodes(
    page = 1,
    limit = 5
  ): Observable<any> {
    return this.http.get(
      `${this.API_URL}?page=${page}&limit=${limit}`
    );
  }

  getNodeById(nodeId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${nodeId}`);
  }

  createNode(data: MenuNode): Observable<any> {
    return this.http.post(this.API_URL, data);
  }

  updateNode(
    nodeId: string,
    data: Partial<MenuNode>
  ): Observable<any> {
    return this.http.put(`${this.API_URL}/${nodeId}`, data);
  }

  deleteNode(nodeId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${nodeId}`);
  }
}