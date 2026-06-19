import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { EmployeeService } from '../../../core/services/employee';

interface PendingEmployee {
    user: {
        _id: string;
        email: string;
        roles: string[];
    };
    employee: {
        name: string;
        email: string;
        department: string;
        designation: string;
        phone: string;
    };
}

@Component({
    selector: 'app-pending-employees',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Pending Approvals</h1>
        <p class="subtitle">Employee registrations waiting for admin approval</p>
      </div>

      @if (loading()) {
        <p class="loading">Loading...</p>
      }

      @if (!loading() && pending().length === 0) {
        <div class="empty">
          <p>No pending registrations.</p>
        </div>
      }

      @if (!loading() && pending().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Roles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of pending(); track item.user._id) {
                <tr>
                  <td>{{ item.employee?.name }}</td>
                  <td>{{ item.employee?.email }}</td>
                  <td>{{ item.employee?.department }}</td>
                  <td>{{ item.employee?.designation }}</td>
                  <td>
                    @for (role of item.user.roles; track role) {
                      <span class="badge">{{ role }}</span>
                    }
                  </td>
                  <td>
                    <div class="actions">
                      <button
                        class="btn approve"
                        [disabled]="processing() === item.user._id"
                        (click)="approve(item.user._id)">
                        Approve
                      </button>
                      <button
                        class="btn reject"
                        [disabled]="processing() === item.user._id"
                        (click)="reject(item.user._id)">
                        Reject
                      </button>
                    </div>
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
    h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
    .subtitle { color: #888; font-size: 14px; }
    .loading { color: #666; }
    .empty { text-align: center; padding: 48px; color: #999; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.07); }
    th { background: #f7f7f7; padding: 12px 16px; text-align: left; font-size: 13px; color: #555; font-weight: 600; }
    td { padding: 12px 16px; border-top: 1px solid #f0f0f0; font-size: 14px; color: #333; }
    .badge { background: #ebf4ff; color: #2b6cb0; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-right: 4px; }
    .actions { display: flex; gap: 8px; }
    .btn { padding: 6px 16px; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .approve { background: #f0fff4; color: #276749; }
    .approve:hover:not(:disabled) { background: #c6f6d5; }
    .reject { background: #fff5f5; color: #c53030; }
    .reject:hover:not(:disabled) { background: #fed7d7; }
  `]
})
export class PendingEmployees implements OnInit {
    private employeeService = inject(EmployeeService);
    private toastr = inject(ToastrService);

    pending = signal<PendingEmployee[]>([]);
    loading = signal(true);
    processing = signal<string | null>(null);

    ngOnInit() {
        this.load();
    }

    load() {
        this.employeeService.getPendingEmployees().subscribe({
            next: res => {
                this.pending.set(res.data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.toastr.error('Failed to load pending employees', 'Error');
                this.loading.set(false);
            }
        });
    }

    approve(userId: string) {
        this.processing.set(userId);
        this.employeeService.approveEmployee(userId).subscribe({
            next: () => {
                this.toastr.success('Employee approved successfully', 'Success');
                this.pending.update(list => list.filter(p => p.user._id !== userId));
                this.processing.set(null);
            },
            error: () => {
                this.toastr.error('Failed to approve employee', 'Error');
                this.processing.set(null);
            }
        });
    }

    reject(userId: string) {
        this.processing.set(userId);
        this.employeeService.rejectEmployee(userId).subscribe({
            next: () => {
                this.toastr.warning('Employee registration rejected', 'Rejected');
                this.pending.update(list => list.filter(p => p.user._id !== userId));
                this.processing.set(null);
            },
            error: () => {
                this.toastr.error('Failed to reject employee', 'Error');
                this.processing.set(null);
            }
        });
    }
}