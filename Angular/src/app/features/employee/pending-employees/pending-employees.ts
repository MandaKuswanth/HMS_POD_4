import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { EmployeeService } from '../../../core/services/employee';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { PageShell } from '../../../shared/components/page-shell/page-shell';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';
import { PaginationMeta } from '../../../core/models/api-response.model';

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
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    PageShell,
    LoadingState,
    EmptyState,
    PaginationComponent,
    HasPermissionDirective,
  ],
  templateUrl: './pending-employees.html',
  styleUrl: './pending-employees.scss',
})
export class PendingEmployees implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly PERMISSIONS = PERMISSIONS;
  readonly displayedColumns = ['name', 'email', 'department', 'designation', 'roles', 'actions'];

  pending = signal<PendingEmployee[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);

  page = 1;
  limit = 10;
  pagination: PaginationMeta = {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.employeeService.getPendingEmployees({ page: this.page, limit: this.limit }).subscribe({
      next: res => {
        this.pending.set((res.data as PendingEmployee[]) ?? []);
        this.pagination = res.pagination || this.pagination;
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load pending employees', 'Error');
        this.loading.set(false);
      },
    });
  }

  approve(userId: string): void {
    this.processing.set(userId);
    this.employeeService.approveEmployee(userId).subscribe({
      next: () => {
        this.toast.success('Employee approved successfully', 'Success');
        this.load();
        this.processing.set(null);
      },
      error: () => {
        this.toast.error('Failed to approve employee', 'Error');
        this.processing.set(null);
      },
    });
  }

  reject(userId: string, name: string): void {
    this.confirmDialog.open({
      title: 'Reject Registration',
      message: `Reject registration for ${name}? This will permanently remove the request.`,
      confirmText: 'Reject',
      confirmColor: 'warn',
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.processing.set(userId);
      this.employeeService.rejectEmployee(userId).subscribe({
        next: () => {
          this.toast.warning('Employee registration rejected', 'Rejected');
          this.load();
          this.processing.set(null);
        },
        error: () => {
          this.toast.error('Failed to reject employee', 'Error');
          this.processing.set(null);
        },
      });
    });
  }

  onPreviousPage(): void {
    if (this.pagination.hasPreviousPage) {
      this.page -= 1;
      this.load();
    }
  }

  onNextPage(): void {
    if (this.pagination.hasNextPage) {
      this.page += 1;
      this.load();
    }
  }
}
