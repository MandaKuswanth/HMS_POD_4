import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';

import { RoleService, Role } from '../../../core/services/role';
import { ToastService } from '../../../shared/services/toast.service';
import { PageShell } from '../../../shared/components/page-shell/page-shell';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PaginationMeta } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    PageShell,
    PaginationComponent,
    LoadingState,
    EmptyState,
  ],
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
})
export class RoleList implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  dataSource: Role[] = [];
  displayedColumns = ['roleId', 'name', 'description', 'permissions', 'status'];
  loading = signal(true);

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
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.roleService.getRoles({ page: this.page, limit: this.limit }).subscribe({
      next: res => {
        this.dataSource = res.data ?? [];
        this.pagination = res.pagination || this.pagination;
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load roles', 'Error');
        this.loading.set(false);
      },
    });
  }

  onPreviousPage(): void {
    if (this.pagination.hasPreviousPage) {
      this.page -= 1;
      this.loadRoles();
    }
  }

  onNextPage(): void {
    if (this.pagination.hasNextPage) {
      this.page += 1;
      this.loadRoles();
    }
  }
}
