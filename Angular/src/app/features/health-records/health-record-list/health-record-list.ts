import { Component, OnInit, inject, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ToastrService } from 'ngx-toastr';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { HealthRecordDialog } from '../health-record-dialog/health-record-dialog';
import { HealthRecordRequest, HealthRecordService } from '../../../core/services/health-record';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-health-record-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatFormFieldModule,
    MatInputModule,
    HasPermissionDirective,
  ],
  templateUrl: './health-record-list.html',
  styleUrl: './health-record-list.css',
})
export class HealthRecordList implements OnInit {
  private readonly healthRecordService = inject(HealthRecordService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  readonly PERMISSIONS = PERMISSIONS;
  readonly pageSizeOptions = [5, 10, 25, 50];

  // Signal States
  readonly recordsSignal = signal<HealthRecordRequest[]>([]);
  readonly totalSignal = signal(0);
  readonly pageSignal = signal(0); // 0-indexed
  readonly limitSignal = signal(5);
  readonly loadingSignal = signal(false);

  readonly searchTextSignal = signal('');
  readonly expandedRecordSignal = signal<HealthRecordRequest | null>(null);

  private readonly searchSubject = new Subject<string>();

  displayedColumns: string[] = [
    'healthRecordId',
    'appointmentId',
    'patient',
    'doctor',
    'diagnosis',
    'createdAt',
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

      this.loadHealthRecords(page, limit, search);
    });
  }

  ngOnInit(): void {}

  loadHealthRecords(page: number, limit: number, search: string): void {
    this.loadingSignal.set(true);
    this.healthRecordService
      .getHealthRecords(page, limit, search)
      .subscribe({
        next: (response: any) => {
          this.loadingSignal.set(false);
          const records = Array.isArray(response?.data)
            ? response.data
            : (Array.isArray(response?.data?.records) ? response.data.records : []);

          this.recordsSignal.set(records);
          this.totalSignal.set(response?.pagination?.totalItems || response?.data?.pagination?.totalRecords || 0);
          this.expandedRecordSignal.set(null);
        },
        error: (error) => {
          this.loadingSignal.set(false);
          console.error('HEALTH RECORD LOAD ERROR:', error);
          this.recordsSignal.set([]);
          this.totalSignal.set(0);
          this.expandedRecordSignal.set(null);
          this.toastr.error('Failed to load health records');
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
    this.expandedRecordSignal.set(null);
  }

  onPageChange(event: PageEvent): void {
    this.pageSignal.set(event.pageIndex);
    this.limitSignal.set(event.pageSize);
    this.expandedRecordSignal.set(null);
  }

  toggleRow(record: HealthRecordRequest): void {
    const current = this.expandedRecordSignal();
    this.expandedRecordSignal.set(current?.healthRecordId === record.healthRecordId ? null : record);
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
        this.pageSignal.set(0);
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
        this.pageSignal.set(this.pageSignal());
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
          this.expandedRecordSignal.set(null);
          this.pageSignal.set(0);
        },
        error: (error) => {
          this.toastr.error(
            error?.error?.message || 'Failed to delete health record'
          );
        },
      });
  }
}