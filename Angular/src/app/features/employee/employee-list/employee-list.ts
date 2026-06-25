import { Component, inject, OnInit, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ToastrService } from 'ngx-toastr';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { EmployeeService } from '../../../core/services/employee';
import { AuthService } from '../../../core/services/auth';
import { EmployeeDialog } from '../employee-dialog/employee-dialog';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    HasPermissionDirective,
    Navbar,
    Sidebar,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly PERMISSIONS = PERMISSIONS;
  readonly pageSizeOptions = [5, 10, 25, 50];

  // Signal States
  readonly employeesSignal = signal<any[]>([]);
  readonly totalSignal = signal(0);
  readonly pageSignal = signal(0); // 0-indexed
  readonly limitSignal = signal(5);
  readonly loadingSignal = signal(false);

  readonly searchTextSignal = signal('');
  readonly roleSignal = signal('ALL ROLES');
  readonly departmentSignal = signal('ALL DEPARTMENTS');
  readonly statusSignal = signal<'all' | 'active' | 'pending'>('all'); // all, active, pending
  readonly expandedEmployeeSignal = signal<any | null>(null);

  private readonly searchSubject = new Subject<string>();

  readonly departmentsList = [
    'ALL DEPARTMENTS',
    'Cardiology',
    'Pediatrics',
    'General Medicine',
    'Orthopedics',
    'Neurology',
    'Nursing',
    'Front Desk',
    'Administration'
  ];

  readonly rolesList = [
    'ALL ROLES',
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'HR',
    'ADMIN'
  ];

  displayedColumns: string[] = [
    'employeeCode',
    'name',
    'email',
    'phone',
    'department',
    'designation',
    'role',
    'status',
  ];

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe((val) => {
      this.searchTextSignal.set(val);
      this.pageSignal.set(0);
    });

    // Reactive load effect
    effect(() => {
      const page = this.pageSignal() + 1;
      const limit = this.limitSignal();
      const search = this.searchTextSignal();
      const role = this.roleSignal();
      const department = this.departmentSignal();
      const status = this.statusSignal();

      this.loadEmployees(page, limit, search, role, department, status);
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['view'] === 'active') {
        this.statusSignal.set('active');
      } else if (params['view'] === 'pending') {
        this.statusSignal.set('pending');
      } else {
        this.statusSignal.set('all');
      }
      this.pageSignal.set(0);
      this.expandedEmployeeSignal.set(null);
    });
  }

  setView(view: 'all' | 'active' | 'pending'): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: view === 'all' ? null : view },
      queryParamsHandling: 'merge',
    });
  }

  loadEmployees(page: number, limit: number, search: string, role: string, department: string, status: 'all' | 'active' | 'pending'): void {
    this.loadingSignal.set(true);
    this.employeeService.getEmployees(page, limit, search, department, role, status).subscribe({
      next: (response: any) => {
        this.loadingSignal.set(false);
        const records = Array.isArray(response?.data)
          ? response.data
          : (Array.isArray(response?.data?.records) ? response.data.records : []);

        this.employeesSignal.set(records);
        this.totalSignal.set(response?.pagination?.totalItems || response?.data?.pagination?.totalRecords || 0);
        this.expandedEmployeeSignal.set(null);
      },
      error: (error) => {
        this.loadingSignal.set(false);
        console.error('EMPLOYEE LIST ERROR:', error);
        this.employeesSignal.set([]);
        this.totalSignal.set(0);
        this.expandedEmployeeSignal.set(null);
        this.toastr.warning('Failed to load employees');
      },
    });
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  onRoleChange(val: string): void {
    this.roleSignal.set(val);
    this.pageSignal.set(0);
  }

  onDepartmentChange(val: string): void {
    this.departmentSignal.set(val);
    this.pageSignal.set(0);
  }

  toggleRow(employee: any): void {
    const current = this.expandedEmployeeSignal();
    this.expandedEmployeeSignal.set(current?.employeeCode === employee.employeeCode ? null : employee);
  }

  openAddDialog(): void {
    const ref = this.dialog.open(EmployeeDialog, {
      data: { mode: 'add' },
      width: '680px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.pageSignal.set(0);
      }
    });
  }

  openEditDialog(employee: any): void {
    const ref = this.dialog.open(EmployeeDialog, {
      data: {
        mode: 'edit',
        employee,
      },
      width: '680px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        // Force reload by re-setting page
        this.pageSignal.set(this.pageSignal());
      }
    });
  }

  deleteEmployee(employee: any): void {
    if (!employee?.employeeCode) {
      this.toastr.error('Employee code missing');
      return;
    }

    const confirmed = confirm(
      `Delete ${employee.name}? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.employeeService.deleteEmployee(employee.employeeCode).subscribe({
      next: () => {
        const currentUser = this.authService.user();
        const isDeletingOwnAccount = currentUser?.employeeId === employee.employeeCode;

        if (isDeletingOwnAccount) {
          this.toastr.success('Your account has been deleted. Please login again.');
          this.authService.clearAuthState();
          return;
        }

        this.toastr.success('Employee deleted successfully');
        this.expandedEmployeeSignal.set(null);
        this.pageSignal.set(0);
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Failed to delete employee'
        );
      },
    });
  }

  toggleEmployeeStatus(employee: any): void {
    if (!employee?.employeeCode) {
      this.toastr.error('Employee code missing');
      return;
    }

    const action = employee.status ? 'deactivate' : 'activate';
    const isDoctor = Array.isArray(employee.roles)
      ? employee.roles.includes('DOCTOR')
      : employee.role === 'DOCTOR';

    const message =
      isDoctor && employee.status
        ? `Deactivate Dr. ${employee.name}? Existing appointments with this doctor may be affected.`
        : `Are you sure you want to ${action} ${employee.name}?`;

    const confirmed = confirm(message);

    if (!confirmed) {
      return;
    }

    this.employeeService.toggleEmployeeStatus(employee.employeeCode).subscribe({
      next: (response: any) => {
        this.toastr.success(
          response?.message || `Employee ${action}d successfully`
        );
        this.expandedEmployeeSignal.set(null);
        this.pageSignal.set(this.pageSignal());
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Failed to update employee status'
        );
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSignal.set(event.pageIndex);
    this.limitSignal.set(event.pageSize);
    this.expandedEmployeeSignal.set(null);
  }

  clearFilters(): void {
    this.searchTextSignal.set('');
    this.roleSignal.set('ALL ROLES');
    this.departmentSignal.set('ALL DEPARTMENTS');
    this.pageSignal.set(0);
    this.expandedEmployeeSignal.set(null);
  }
}