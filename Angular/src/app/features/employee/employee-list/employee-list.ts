import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { EmployeeService } from '../../../core/services/employee';
import { AuthService } from '../../../core/services/auth';
import { EmployeeDialog } from '../employee-dialog/employee-dialog';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatRippleModule,
    MatCardModule,
    HasPermissionDirective,
    Sidebar
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly PERMISSIONS = PERMISSIONS;

  employees: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  expandedEmployee: any = null;
  activeView: 'all' | 'active' | 'pending' = 'all';
  searchText = '';
  selectedRole = 'All Roles';
  selectedDepartment = 'All Departments';

  displayedColumns = ['employeeCode', 'name', 'email', 'phone', 'department', 'designation', 'role', 'status'];

  // ── Permission-based flags (replaces hardcoded isAdmin) ──────────────────
  get canCreate(): boolean { return this.authService.hasPermission(PERMISSIONS.EMPLOYEE_CREATE); }
  get canUpdate(): boolean { return this.authService.hasPermission(PERMISSIONS.EMPLOYEE_UPDATE); }
  get canDelete(): boolean { return this.authService.hasPermission(PERMISSIONS.EMPLOYEE_DELETE); }

  // ── Derived filter lists ──────────────────────────────────────────────────
  get roles(): string[] {
    const all = this.employees.map(e => this.getRoleDisplay(e)).filter(Boolean);
    return ['All Roles', ...new Set(all)];
  }

  get departments(): string[] {
    const all = this.employees.map(e => e.department).filter(Boolean);
    return ['All Departments', ...new Set(all)];
  }

  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }

  // ── Counts ────────────────────────────────────────────────────────────────
  get activeCount(): number { return this.employees.filter(e => e.status).length; }
  get pendingCount(): number { return this.employees.filter(e => !e.status).length; }

  // ── Filter logic ─────────────────────────────────────────────────────────
  applyFilters(): void {
    let list = [...this.employees];

    if (this.activeView === 'active') list = list.filter(e => e.status);
    if (this.activeView === 'pending') list = list.filter(e => !e.status);

    if (this.selectedRole !== 'All Roles') {
      list = list.filter(e => this.getRoleDisplay(e).includes(this.selectedRole));
    }

    if (this.selectedDepartment !== 'All Departments') {
      list = list.filter(e => e.department === this.selectedDepartment);
    }

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      list = list.filter(e =>
        e.employeeCode?.toLowerCase().includes(q) ||
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q)
      );
    }

    this.dataSource.data = list;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        this.employees = res?.data?.employees || res?.data || res || [];
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: () => this.toastr.error('Failed to load employees', 'Error')
    });
  }

  setView(view: 'all' | 'active' | 'pending'): void {
    this.activeView = view;
    this.applyFilters();
    this.cdr.markForCheck();
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
    this.dialog.open(EmployeeDialog, { data: { mode: 'add' }, width: '680px' })
      .afterClosed().subscribe(res => { if (res) this.loadEmployees(); });
  }

  openEditDialog(emp: any): void {
    this.dialog.open(EmployeeDialog, { data: { mode: 'edit', employee: emp }, width: '680px' })
      .afterClosed().subscribe(res => { if (res) this.loadEmployees(); });
  }

  toggleEmployeeStatus(emp: any): void {
    this.employeeService.toggleEmployeeStatus(emp.employeeCode).subscribe({
      next: () => {
        this.toastr.success(`Employee ${emp.status ? 'deactivated' : 'activated'}`, 'Success');
        this.loadEmployees();
      },
      error: () => this.toastr.error('Failed to update status', 'Error')
    });
  }

  deleteEmployee(emp: any): void {
    if (!confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    this.employeeService.deleteEmployee(emp.employeeCode).subscribe({
      next: () => {
        this.toastr.success('Employee deleted', 'Success');
        this.loadEmployees();
      },
      error: () => this.toastr.error('Failed to delete employee', 'Error')
    });
  }
}