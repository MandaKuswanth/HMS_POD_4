import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,

} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute ,Router} from '@angular/router';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { EmployeeService } from '../../../core/services/employee';
import { AuthService } from '../../../core/services/auth';
import { EmployeeDialog } from '../employee-dialog/employee-dialog';

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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  employees: any[] = [];
  expandedEmployee: any = null;

  searchText = '';
  selectedRole = 'ALL ROLES';
  selectedDepartment = 'ALL DEPARTMENTS';

  activeView: 'all' | 'active' | 'pending' = 'all';


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

  get isAdmin(): boolean {
    return this.authService.getRole()?.toUpperCase() === 'ADMIN';
  }

  get filteredEmployees(): any[] {
    let employees = [...this.employees];

    if (this.activeView === 'active') {
      employees = employees.filter((emp: any) => emp.status === true);
    } else if (this.activeView === 'pending') {
      employees = employees.filter((emp: any) => emp.status === false);
    }

    if (this.selectedRole !== 'ALL ROLES') {
      employees = employees.filter(
        (emp: any) => emp.role === this.selectedRole
      );
    }

    if (this.selectedDepartment !== 'ALL DEPARTMENTS') {
      employees = employees.filter(
        (emp: any) => emp.department === this.selectedDepartment
      );
    }

    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();

      employees = employees.filter((emp: any) =>
        emp.employeeCode?.toLowerCase().includes(search) ||
        emp.name?.toLowerCase().includes(search) ||
        emp.email?.toLowerCase().includes(search) ||
        emp.phone?.includes(search)
      );
    }

    return employees;
  }

  get activeCount(): number {
    return this.employees.filter((emp: any) => emp.status === true).length;
  }

  get pendingCount(): number {
    return this.employees.filter((emp: any) => emp.status === false).length;
  }

  get roles(): string[] {
    const roles = this.employees
      .map((emp: any) => emp.role)
      .filter(Boolean);

    return ['ALL ROLES', ...new Set(roles)];
  }

  get departments(): string[] {
    const departments = this.employees
      .map((emp: any) => emp.department)
      .filter(Boolean);

    return ['ALL DEPARTMENTS', ...new Set(departments)];
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['view'] === 'active') {
        this.activeView = 'active';
      } else if (params['view'] === 'pending') {
        this.activeView = 'pending';
      } else {
        this.activeView = 'all';
      }

      this.expandedEmployee = null;
      this.cdr.markForCheck();
    });

    this.loadEmployees();
  }

  setView(view: 'all' | 'active' | 'pending'): void {
    this.activeView = view;
    this.expandedEmployee = null;
    this.cdr.markForCheck();
  }



  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        let employees: any[] = [];

        if (Array.isArray(response?.data)) {
          employees = response.data;
        } else if (Array.isArray(response)) {
          employees = response;
        }

        this.employees = employees;
        this.expandedEmployee = null;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('EMPLOYEE LIST ERROR:', error);

        this.employees = [];
        this.expandedEmployee = null;

        this.toastr.warning('Failed to load employees');
        this.cdr.markForCheck();
      },
    });
  }

  toggleRow(employee: any): void {
    this.expandedEmployee = this.expandedEmployee === employee ? null : employee;
    this.cdr.markForCheck();
  }

  openAddDialog(): void {
    const ref = this.dialog.open(EmployeeDialog, {
      data: { mode: 'add' },
      width: '680px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadEmployees();
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
        this.loadEmployees();
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
        const currentUser = JSON.parse(
          localStorage.getItem('user') || '{}'
        );

        const isDeletingOwnAccount =
          currentUser?.employeeId === employee.employeeCode;

        if (isDeletingOwnAccount) {
          this.toastr.success('Your account has been deleted. Please login again.');

          localStorage.clear();
          this.router.navigate(['/login']);
          return;
        }

        this.toastr.success('Employee deleted successfully');
        this.expandedEmployee = null;
        this.loadEmployees();
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

    const message =
      employee.role === 'DOCTOR' && employee.status
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

        this.expandedEmployee = null;
        this.loadEmployees();
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Failed to update employee status'
        );
      },
    });
  }
}