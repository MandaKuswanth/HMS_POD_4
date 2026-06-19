import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { environment } from '../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

interface Role {
    roleId: string;
    name: string;
    description: string;
    permissions: string[];
    status: boolean;
}

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatPaginatorModule],
    template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Roles & Permissions</h1>
      </div>

      @if (loading()) {
        <p class="loading">Loading roles...</p>
      }

      @if (!loading()) {
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource">
            
            <ng-container matColumnDef="roleId">
              <th mat-header-cell *matHeaderCellDef>Role ID</th>
              <td mat-cell *matCellDef="let role">{{ role.roleId }}</td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let role"><span class="badge">{{ role.name }}</span></td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let role">{{ role.description || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="permissions">
              <th mat-header-cell *matHeaderCellDef>Permissions</th>
              <td mat-cell *matCellDef="let role">
                <div class="permissions-wrap">
                  @for (p of role.permissions; track p) {
                    <span class="perm-tag">{{ p }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let role">
                <span [class]="role.status ? 'status active' : 'status inactive'">
                  {{ role.status ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[5, 10, 25]" aria-label="Select page of roles"></mat-paginator>
        </div>
      }
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; }
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; }
    .loading { color: #666; }
    .table-wrapper { overflow-x: auto; background: white; border-radius: 10px; box-shadow: 0 1px 8px rgba(0,0,0,0.07); }
    table { width: 100%; }
    .badge { background: #ebf4ff; color: #2b6cb0; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .permissions-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
    .perm-tag { background: #f0fff4; color: #276749; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .status { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status.active { background: #f0fff4; color: #276749; }
    .status.inactive { background: #fff5f5; color: #c53030; }
  `]
})
export class RoleList implements OnInit {
    @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
        if (paginator) {
            this.dataSource.paginator = paginator;
        }
    }
    private http = inject(HttpClient);
    private toastr = inject(ToastrService);

    dataSource = new MatTableDataSource<Role>([]);
    displayedColumns: string[] = ['roleId', 'name', 'description', 'permissions', 'status'];
    loading = signal(true);

    private readonly baseUrl = `${environment.API_URL}/api/roles`;

    ngOnInit() {
        this.http.get<any>(this.baseUrl).subscribe({
            next: res => {
                this.dataSource.data = res.data ?? [];
                this.loading.set(false);
            },
            error: () => {
                this.toastr.error('Failed to load roles', 'Error');
                this.loading.set(false);
            }
        });
    }
}