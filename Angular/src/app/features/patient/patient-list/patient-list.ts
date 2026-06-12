import { Component, inject, OnInit } from '@angular/core';
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
import { AuthService } from '../../../core/services/auth';
import { PatientDialog } from '../patient-dialog/patient-dialog';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    Navbar,
    Sidebar
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css'
})
export class PatientList implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly patientService = inject(PatientService);
  private readonly toastr = inject(ToastrService);

  displayedColumns: string[] = [
    'UHID',
    'name',
    'email',
    'phone',
    'gender',
    'dob',
    'status'
  ];

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
      next: (response) => {
        const patients = response?.data?.patients ?? [];
        this.allPatients = patients;
        this.dataSource.data = patients;
      },
      error: (err) => {
        console.error('PATIENT LOAD ERROR:', err);
        this.toastr.error('Failed to load patients');
      }
    });
  }

  get canAddOrUpdatePatient(): boolean {
    const role = (this.authService.getRole() ?? '').toUpperCase();
    return ['ADMIN', 'RECEPTIONIST'].includes(role);
  }
  get canViewPatient(): boolean {
    const role = (this.authService.getRole() ?? '').toUpperCase();
    return ['ADMIN', 'RECEPTIONIST','NURSE'].includes(role);
  }

  toggleRow(row: PatientRequest): void {
    this.expandedPatient = this.expandedPatient === row ? null : row;
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
      filtered = filtered.filter(p => p.gender === this.selectedGender);
    }

    if (this.selectedStatus !== 'ALL') {
      const isActive = this.selectedStatus === 'ACTIVE';
      filtered = filtered.filter(p => p.status === isActive);
    }

    this.dataSource.data = filtered;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedGender = 'ALL';
    this.selectedStatus = 'ALL';
    this.dataSource.data = this.allPatients;
  }

  openAddDialog(): void {
    const ref = this.dialog.open(PatientDialog, {
      width: '800px',
      disableClose: true,
      data: { mode: 'add' }
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) this.loadPatients();
    });
  }

  editPatient(patient: PatientRequest): void {
    const ref = this.dialog.open(PatientDialog, {
      width: '800px',
      disableClose: true,
      data: { mode: 'edit', patient }
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) this.loadPatients();
    });
  }

  viewPatient(patient: PatientRequest): void {
    this.dialog.open(PatientDialog, {
      width: '800px',
      data: { mode: 'view', patient }
    });
  }

  deletePatient(patient: PatientRequest): void {
    if (!patient?.UHID) {
      this.toastr.error('Patient ID missing');
      return;
    }

    const confirmed = confirm(
      `Delete ${patient.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.patientService.deletePatient(patient.UHID).subscribe({
      next: () => {
        this.toastr.success('Patient deleted successfully');
        this.expandedPatient = null;
        this.loadPatients();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Delete failed');
      }
    });
  }

  toggleStatus(patient: PatientRequest): void {
    if (!patient?.UHID) return;

    this.patientService.toggleStatus(patient.UHID).subscribe({
      next: () => {
        const updatedStatus = !patient.status;

        patient.status = updatedStatus;

        this.allPatients = this.allPatients.map(p =>
          p.UHID === patient.UHID ? { ...p, status: updatedStatus } : p
        );

        this.dataSource.data = [...this.allPatients];

        this.toastr.success('Status updated successfully');
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Status update failed');
      }
    });
  }
}