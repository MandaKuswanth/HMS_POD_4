import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AuthService } from '../../../core/services/auth'
import { RoleService, RoleRequest } from '../../../core/services/role';
import { MatDialog } from '@angular/material/dialog';
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
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  dataSource = new MatTableDataSource<RoleRequest>([]);
  roles: RoleRequest[] = [];

  searchText = '';
  totalRecords = 0;
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25];


  displayedColumns: string[] = [
    'roleId',
    'name',
    'description',
    'permissions',
    'status',
    'actions',
  ];

  ngOnInit(): void {
    this.loadRoles();
  }


  loadRoles(): void {
    const page = this.pageIndex + 1;

    this.roleService.getRoles(page, this.pageSize).subscribe({
      next: (response: any) => {
        const roles = Array.isArray(response?.data?.records)
          ? response.data.records
          : [];

        this.roles = roles;
        this.dataSource.data = roles;

        this.totalRecords =
          response?.data?.pagination?.totalRecords || 0;
      },
      error: (error) => {
        console.error('ROLE LIST ERROR:', error);
        this.toastr.error(
          error?.error?.message || 'Failed to load roles'
        );
      },
    });
  }

  applyFilter(): void {
    const search = this.searchText.trim().toLowerCase();

    if (search) {
      this.dataSource.data = this.roles.filter((role) =>
        role.roleId?.toLowerCase().includes(search) ||
        role.name?.toLowerCase().includes(search) ||
        role.description?.toLowerCase().includes(search)
      );
    } else {
      this.dataSource.data = this.roles;
    }

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.dataSource.data = this.roles;

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  deleteRole(role: RoleRequest): void {
    if (!role.roleId) {
      this.toastr.error('Role ID missing');
      return;
    }

    if (role.name === 'SUPER_ADMIN') {
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
        this.loadRoles();
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
        this.loadRoles();
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
        this.loadRoles();
      }
    });
  }
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.loadRoles();
  }
}