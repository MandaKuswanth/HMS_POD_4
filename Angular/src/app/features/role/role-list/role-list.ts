import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
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
    imports: [CommonModule],
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
          <table>
            <thead>
              <tr>
                <th>Role ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (role of roles(); track role.roleId) {
                <tr>
                  <td>{{ role.roleId }}</td>
                  <td><span class="badge">{{ role.name }}</span></td>
                  <td>{{ role.description || '—' }}</td>
                  <td>
                    <div class="permissions-wrap">
                      @for (p of role.permissions; track p) {
                        <span class="perm-tag">{{ p }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span [class]="role.status ? 'status active' : 'status inactive'">
                      {{ role.status ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; }
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; }
    .loading { color: #666; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.07); }
    th { background: #f7f7f7; padding: 12px 16px; text-align: left; font-size: 13px; color: #555; font-weight: 600; }
    td { padding: 12px 16px; border-top: 1px solid #f0f0f0; font-size: 14px; color: #333; vertical-align: top; }
    .badge { background: #ebf4ff; color: #2b6cb0; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .permissions-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
    .perm-tag { background: #f0fff4; color: #276749; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .status { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status.active { background: #f0fff4; color: #276749; }
    .status.inactive { background: #fff5f5; color: #c53030; }
  `]
})
export class RoleList implements OnInit {
    private http = inject(HttpClient);
    private toastr = inject(ToastrService);

    roles = signal<Role[]>([]);
    loading = signal(true);

    private readonly baseUrl = `${environment.API_URL}/api/roles`;

    ngOnInit() {
        this.http.get<any>(this.baseUrl).subscribe({
            next: res => {
                this.roles.set(res.data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.toastr.error('Failed to load roles', 'Error');
                this.loading.set(false);
            }
        });
    }
}