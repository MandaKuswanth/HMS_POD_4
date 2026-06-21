import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, Subject } from 'rxjs';

import { EmployeeService } from '../../../core/services/employee';
import { AuthService } from '../../../core/services/auth';
import { EmployeeDialog } from '../employee-dialog/employee-dialog';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';
import { PageShell } from '../../../shared/components/page-shell/page-shell';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { PaginationMeta } from '../../../core/models/api-response.model';
import { HMS_DIALOG_CONFIG } from '../../../shared/constants/dialog.config';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    HasPermissionDirective,
    PageShell,
    PaginationComponent,
    EmptyState,
    LoadingState,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss',
})
export class EmployeeList implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly searchChanges$ = new Subject<string>();

  readonly PERMISSIONS = PERMISSIONS;

  employees: any[] = [];
  expandedEmployee: any = null;
  searchText = '';
  selectedRole = 'ALL';
  selectedStatus = 'ALL';
  isLoading = false;

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

  displayedColumns = ['employeeCode', 'name', 'email', 'phone', 'department', 'designation', 'role', 'status'];

  get canCreate(): boolean { return this.authService.hasPermission(PERMISSIONS.EMPLOYEE_CREATE); }
  get canUpdate(): boolean { return this.authService.hasPermission(PERMISSIONS.EMPLOYEE_UPDATE); }
  get canDelete(): boolean { return this.authService.hasPermission(PERMISSIONS.EMPLOYEE_DELETE); }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'];
      }
      this.loadEmployees();
    });

    this.searchChanges$.pipe(debounceTime(400)).subscribe(() => {
      this.page = 1;
      this.loadEmployees();
    });
  }

  onSearchChange(): void {
    this.searchChanges$.next(this.searchText);
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.employeeService.getEmployees({
      page: this.page,
      limit: this.limit,
      search: this.searchText.trim() || undefined,
      status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
      role: this.selectedRole !== 'ALL' ? this.selectedRole : undefined,
    }).subscribe({
      next: (res) => {
        this.employees = (res.data as any[]) || [];
        this.pagination = res.pagination || this.pagination;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load employees');
        this.cdr.markForCheck();
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadEmployees();
  }

  toggleRow(emp: any): void {
    this.expandedEmployee = this.expandedEmployee === emp ? null : emp;
    this.cdr.markForCheck();
  }

  getRoleDisplay(emp: any): string {
    if (Array.isArray(emp.roles)) return emp.roles.join(', ');
    return emp.role || emp.roleName || 'N/A';
  }

  openAddDialog(): void {
    this.dialog.open(EmployeeDialog, { ...HMS_DIALOG_CONFIG, data: { mode: 'add' } })
      .afterClosed().subscribe(res => { if (res) this.loadEmployees(); });
  }

  openEditDialog(emp: any): void {
    this.dialog.open(EmployeeDialog, { ...HMS_DIALOG_CONFIG, data: { mode: 'edit', employee: emp } })
      .afterClosed().subscribe(res => { if (res) this.loadEmployees(); });
  }

  toggleEmployeeStatus(emp: any): void {
    this.employeeService.toggleEmployeeStatus(emp.employeeCode).subscribe({
      next: () => {
        this.toast.success(`Employee ${emp.status ? 'deactivated' : 'activated'} successfully`);
        this.loadEmployees();
      },
      error: () => this.toast.error('Failed to update status'),
    });
  }

  deleteEmployee(emp: any): void {
    this.confirmDialog.open({
      title: 'Delete Employee',
      message: `Delete ${emp.name}? This cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'warn',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.employeeService.deleteEmployee(emp.employeeCode).subscribe({
        next: () => {
          this.toast.success('Employee deleted successfully');
          this.loadEmployees();
        },
        error: () => this.toast.error('Failed to delete employee'),
      });
    });
  }

  onPreviousPage(): void {
    if (this.pagination.hasPreviousPage) {
      this.page -= 1;
      this.loadEmployees();
    }
  }

  onNextPage(): void {
    if (this.pagination.hasNextPage) {
      this.page += 1;
      this.loadEmployees();
    }
  }
}
