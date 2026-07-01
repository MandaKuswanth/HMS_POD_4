import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { ToastrService } from 'ngx-toastr';

import { HealthRecordDialog } from '../health-record-dialog/health-record-dialog';

import {
  HealthRecordRequest,
  HealthRecordService,
} from '../../../core/services/health-record';

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';
import { MainComponent } from '../../../shared/components/maincomponent/maincomponent';

@Component({
  selector: 'app-health-record-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    HasPermissionDirective,
    MainComponent,
  ],
  templateUrl: './health-record-list.html',
  styleUrl: './health-record-list.css',
})
export class HealthRecordList implements OnInit {
  private readonly healthRecordService = inject(HealthRecordService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly PERMISSIONS = PERMISSIONS;

  healthRecords: HealthRecordRequest[] = [];
  filteredHealthRecords: HealthRecordRequest[] = [];

  expandedRecord: HealthRecordRequest | null = null;
  searchText = '';
  isLoading = false;

  pageIndex = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25];
  totalRecords = 0;

  displayedColumns: string[] = [
    'healthRecordId',
    'appointmentId',
    'patient',
    'doctor',
    'diagnosis',
    'createdAt',
  ];

  ngOnInit(): void {
    this.loadHealthRecords();
  }

  loadHealthRecords(): void {
    this.isLoading = true;
    this.expandedRecord = null;
    this.cdr.detectChanges();

    this.healthRecordService
      .getHealthRecords(this.pageIndex + 1, this.pageSize)
      .subscribe({
        next: (response: any) => {
          const records = Array.isArray(response?.data?.records)
            ? response.data.records
            : [];

          this.healthRecords = records;
          this.filteredHealthRecords = [...records];

          this.totalRecords =
            response?.data?.pagination?.totalRecords || 0;

          this.isLoading = false;
          this.expandedRecord = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('HEALTH RECORD LOAD ERROR:', error);

          this.healthRecords = [];
          this.filteredHealthRecords = [];
          this.totalRecords = 0;
          this.isLoading = false;
          this.expandedRecord = null;

          this.toastr.error('Failed to load health records');
          this.cdr.detectChanges();
        },
      });
  }

  applyFilter(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredHealthRecords = search
      ? this.healthRecords.filter((record) =>
        (record.healthRecordId ?? '').toLowerCase().includes(search) ||
        (record.appointmentId ?? '').toLowerCase().includes(search) ||
        (record.patientId ?? '').toLowerCase().includes(search) ||
        (record.patientName ?? '').toLowerCase().includes(search) ||
        (record.doctorName ?? '').toLowerCase().includes(search) ||
        (record.diagnosis ?? '').toLowerCase().includes(search)
      )
      : [...this.healthRecords];

    this.expandedRecord = null;
  }

  clearSearch(): void {
    this.searchText = '';
    this.filteredHealthRecords = [...this.healthRecords];
    this.expandedRecord = null;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadHealthRecords();
  }

  toggleRow(record: HealthRecordRequest): void {
    this.expandedRecord =
      this.expandedRecord === record ? null : record;
  }

  openAddDialog(): void {
    const ref = this.dialog.open(HealthRecordDialog, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: { mode: 'add' },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.pageIndex = 0;
        this.loadHealthRecords();
      }
    });
  }

  openEditDialog(record: HealthRecordRequest): void {
    const ref = this.dialog.open(HealthRecordDialog, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        mode: 'edit',
        record,
      },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loadHealthRecords();
      }
    });
  }

  deleteHealthRecord(record: HealthRecordRequest): void {
    if (!record?.healthRecordId) {
      this.toastr.error('Health record ID missing');
      return;
    }

    const confirmed = confirm(
      `Delete health record ${record.healthRecordId}?`
    );

    if (!confirmed) return;

    this.healthRecordService
      .deleteHealthRecord(record.healthRecordId)
      .subscribe({
        next: () => {
          this.toastr.success('Health record deleted successfully');
          this.expandedRecord = null;
          this.loadHealthRecords();
        },
        error: (error) => {
          this.toastr.error(
            error?.error?.message || 'Failed to delete health record'
          );
        },
      });
  }
}
