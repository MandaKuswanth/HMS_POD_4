import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';

import { ToastrService } from 'ngx-toastr';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AuthService } from '../../../core/services/auth';
import { RoleService, RoleRequest } from '../../../core/services/role';
import { RoleDialog } from '../role-dialouge/role-dialouge';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    Navbar,
    Sidebar,
    HasPermissionDirective,
  ],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css',
})
export class RoleList implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  readonly PERMISSIONS = PERMISSIONS;
  readonly pageSizeOptions = [5, 10, 25, 50];

  // Signal States
  readonly rolesSignal = signal<RoleRequest[]>([]);
  readonly totalSignal = signal(0);
  readonly pageSignal = signal(0); // 0-indexed
  readonly limitSignal = signal(5);
  readonly loadingSignal = signal(false);

  readonly searchTextSignal = signal('');

  private readonly searchSubject = new Subject<string>();

  displayedColumns: string[] = [
    'roleId',
    'name',
    'description',
    'permissions',
    'status',
    'actions',
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

      this.loadRoles(page, limit, search);
    });
  }

  ngOnInit(): void {}

  loadRoles(page: number, limit: number, search: string): void {
    this.loadingSignal.set(true);
    this.roleService.getRoles(page, limit, search).subscribe({
      next: (response: any) => {
        this.loadingSignal.set(false);
        const roles = Array.isArray(response?.data)
          ? response.data
          : (Array.isArray(response?.data?.records) ? response.data.records : []);

        this.rolesSignal.set(roles);
        this.totalSignal.set(response?.pagination?.totalItems || response?.data?.pagination?.totalRecords || 0);
      },
      error: (error) => {
        this.loadingSignal.set(false);
        console.error('ROLE LIST ERROR:', error);
        this.rolesSignal.set([]);
        this.totalSignal.set(0);
        this.toastr.error(error?.error?.message || 'Failed to load roles');
      },
    });
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  clearSearch(): void {
    this.searchTextSignal.set('');
    this.pageSignal.set(0);
  }

  deleteRole(role: RoleRequest): void {
    if (!role.roleId) {
      this.toastr.error('Role ID missing');
      return;
    }

    if (role.name === 'SUPER_ADMIN' || role.name === 'SUPER ADMIN') {
      this.toastr.warning('SUPER_ADMIN role cannot be deleted');
      return;
    }

    const confirmed = confirm(
      `Delete role ${role.name}?`
    );

    if (!confirmed) {
      return;
    }

    this.roleService.deleteRole(role.roleId).subscribe({
      next: () => {
        this.toastr.success('Role deleted successfully');
        this.pageSignal.set(0);
      },
      error: (error) => {
        this.toastr.error(
          error?.error?.message || 'Failed to delete role'
        );
      },
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(RoleDialog, {
      width: '760px',
      disableClose: true,
      data: {
        mode: 'add',
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.pageSignal.set(0);
      }
    });
  }

  openEditDialog(role: RoleRequest): void {
    const ref = this.dialog.open(RoleDialog, {
      width: '760px',
      disableClose: true,
      data: {
        mode: 'edit',
        role,
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.pageSignal.set(this.pageSignal());
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSignal.set(event.pageIndex);
    this.limitSignal.set(event.pageSize);
  }
}