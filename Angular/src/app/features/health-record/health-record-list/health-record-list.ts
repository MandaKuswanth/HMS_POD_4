import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { debounceTime, Subject } from 'rxjs';

import { HealthRecordService, HealthRecord } from '../../../core/services/health-record';
import { PatientService } from '../../../core/services/patient';
import { PERMISSIONS } from '../../../constants/permission';
import { PageShell } from '../../../shared/components/page-shell/page-shell';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ToastService } from '../../../shared/services/toast.service';
import { PaginationMeta } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-health-record-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    PageShell,
    PaginationComponent,
    LoadingState,
    EmptyState,
  ],
  templateUrl: './health-record-list.html',
  styleUrl: './health-record-list.scss',
})
export class HealthRecordList implements OnInit {
  private readonly healthRecordService = inject(HealthRecordService);
  private readonly patientService = inject(PatientService);
  private readonly toast = inject(ToastService);
  private readonly searchChanges$ = new Subject<string>();

  readonly PERMISSIONS = PERMISSIONS;
  readonly displayedColumns = ['date', 'patientId', 'symptoms', 'diagnosis', 'actions'];

  records: HealthRecord[] = [];
  patientFilter = '';
  isLoading = false;
  expandedRecord: HealthRecord | null = null;

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
    this.loadRecords();
    this.searchChanges$.pipe(debounceTime(400)).subscribe(() => {
      if (this.patientFilter.trim()) {
        this.loadByPatient(this.patientFilter.trim());
      } else {
        this.page = 1;
        this.loadRecords();
      }
    });
  }

  onFilterChange(): void {
    this.searchChanges$.next(this.patientFilter);
  }

  loadRecords(): void {
    this.isLoading = true;
    this.healthRecordService.getAllRecords({ page: this.page, limit: this.limit }).subscribe({
      next: (res) => {
        this.records = res.data || [];
        this.pagination = res.pagination || this.pagination;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load health records');
        this.isLoading = false;
      },
    });
  }

  loadByPatient(patientId: string): void {
    this.isLoading = true;
    this.healthRecordService.getRecordsByPatient(patientId).subscribe({
      next: (res) => {
        this.records = res.data || [];
        this.pagination = {
          page: 1,
          limit: this.records.length || 10,
          totalRecords: this.records.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load patient health records');
        this.isLoading = false;
      },
    });
  }

  toggleRow(record: HealthRecord): void {
    this.expandedRecord = this.expandedRecord === record ? null : record;
  }

  onPreviousPage(): void {
    if (this.pagination.hasPreviousPage) {
      this.page -= 1;
      this.loadRecords();
    }
  }

  onNextPage(): void {
    if (this.pagination.hasNextPage) {
      this.page += 1;
      this.loadRecords();
    }
  }
}
