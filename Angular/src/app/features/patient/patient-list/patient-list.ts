import {
  Component, inject, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { PatientService, PatientRequest } from '../../../core/services/patient';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { PatientDialog } from '../patient-dialog/patient-dialog';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, DatePipe,
    MatTableModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatButtonModule,
    Navbar, Sidebar,
    HasPermissionDirective  // add this
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css'
})
export class PatientList implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly patientService = inject(PatientService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly PERMISSIONS = PERMISSIONS; // expose to template

  displayedColumns: string[] = ['UHID', 'name', 'email', 'phone', 'gender', 'dob', 'status'];
  dataSource = new MatTableDataSource<PatientRequest>([]);
  allPatients: PatientRequest[] = [];

  searchText = '';
  selectedGender = 'ALL';
  selectedStatus = 'ALL';
  expandedPatient: PatientRequest | null = null;

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (response: any) => {
        const patients = response?.data?.patients || response?.data || response || [];
        this.allPatients = patients;
        this.dataSource.data = patients;
        this.expandedPatient = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastr.error('Failed to load patients');
        this.allPatients = [];
        this.dataSource.data = [];
        this.cdr.markForCheck();
      }
    });
  }

  toggleRow(row: PatientRequest): void {
    this.expandedPatient = this.expandedPatient === row ? null : row;
    this.cdr.markForCheck();
  }

  onRowClick(row: PatientRequest, event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    this.toggleRow(row);
  }

  applyFilters(): void {
    let filtered = [...this.allPatients];
    const search = this.searchText.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter(p =>
        (p.UHID ?? '').toLowerCase().includes(search) ||
        (p.name ?? '').toLowerCase().includes(search) ||
        (p.email ?? '').toLowerCase().includes(search) ||
        (p.phone ?? '').includes(search) ||
        (p.gender ?? '').toLowerCase().includes(search)
      );
    }

    if (this.selectedGender !== 'ALL') {
      filtered = filtered.filter(p => p.gender?.toLowerCase() === this.selectedGender.toLowerCase());
    }

    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(p => p.status === (this.selectedStatus === 'ACTIVE'));
    }

    this.dataSource.data = filtered;
    this.expandedPatient = null;
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedGender = 'ALL';
    this.selectedStatus = 'ALL';
    this.dataSource.data = this.allPatients;
    this.expandedPatient = null;
    this.cdr.markForCheck();
  }

  openAddDialog(): void {
    this.dialog.open(PatientDialog, { width: '800px', disableClose: true, data: { mode: 'add' } })
      .afterClosed().subscribe((result: boolean) => { if (result) this.loadPatients(); });
  }

  editPatient(patient: PatientRequest): void {
    this.dialog.open(PatientDialog, { width: '800px', disableClose: true, data: { mode: 'edit', patient } })
      .afterClosed().subscribe((result: boolean) => { if (result) this.loadPatients(); });
  }

  viewPatient(patient: PatientRequest): void {
    this.dialog.open(PatientDialog, { width: '800px', data: { mode: 'view', patient } });
  }

  deletePatient(patient: PatientRequest): void {
    if (!patient?.UHID) { this.toastr.error('Patient ID missing'); return; }
    if (!confirm(`Delete ${patient.name}? This cannot be undone.`)) return;

    this.patientService.deletePatient(patient.UHID).subscribe({
      next: () => { this.toastr.success('Patient deleted successfully'); this.loadPatients(); },
      error: (err) => this.toastr.error(err?.error?.message || 'Delete failed')
    });
  }

  toggleStatus(patient: PatientRequest): void {
    if (!patient?.UHID) return;

    this.patientService.toggleStatus(patient.UHID).subscribe({
      next: () => {
        this.allPatients = this.allPatients.map(p =>
          p.UHID === patient.UHID ? { ...p, status: !p.status } : p
        );
        this.applyFilters();
        this.toastr.success('Status updated successfully');
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Status update failed')
    });
  }
}