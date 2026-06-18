import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AppointmentService } from '../../../core/services/appointment';
import { AppointmentDialog } from '../appointment-dialog/appointment-dialog';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-appointment-list',
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    Navbar,
    Sidebar,
  ],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css',
})
export class AppointmentList implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  appointments: any[] = [];
  filteredAppointments: any[] = [];

  searchText = '';
  isLoading = false;
  expandedAppointment: any = null;

  selectedStatus = 'ALL STATUS';
  selectedDoctor = 'ALL DOCTORS';
  selectedDate: Date | null = null;

  displayedColumns: string[] = [
    'appointmentId',
    'patientId',
    'doctorEmployeeId',
    'date',
    'timeSlot',
    'status',
  ];

  // --- Dynamic RBAC Permission Checks ---
  get canAddAppointment(): boolean {
    // Allows backend to dictate who can create (e.g., Receptionist, Admin)
    return this.authService.hasPermission('APPOINTMENT_CREATE');
  }

  get canApproveRejectAppointment(): boolean {
    return this.authService.hasPermission('APPOINTMENT_UPDATE_STATUS');
  }

  get canDeleteAppointment(): boolean {
    return this.authService.hasPermission('APPOINTMENT_DELETE');
  }
  // --------------------------------------

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.expandedAppointment = null;
    this.cdr.markForCheck();

    this.appointmentService.getStaffAppointments().subscribe({
      next: (response: any) => {
        let appointments = Array.isArray(response?.data)
          ? response.data
          : (Array.isArray(response) ? response : []);

        this.appointments = appointments;
        this.filteredAppointments = [...appointments];
        this.isLoading = false;
        this.expandedAppointment = null;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('APPOINTMENT LIST ERROR:', error);
        this.isLoading = false;
        this.appointments = [];
        this.filteredAppointments = [];
        this.toastr.error(error?.error?.message || 'Failed to load appointments');
        this.cdr.markForCheck();
      },
    });
  }

  get statuses(): string[] {
    return ['ALL STATUS', 'PENDING', 'BOOKED', 'IN-PROCESS', 'COMPLETED', 'CANCELLED'];
  }

  get doctors(): string[] {
    const doctorList = this.appointments.map(a => a.doctorName).filter(Boolean);
    return ['ALL DOCTORS', ...new Set(doctorList)];
  }

  getStatusCount(status: string): number {
    return this.appointments.filter(a => a.status === status).length;
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    this.filteredAppointments = this.appointments.filter((a: any) => {
      const matchesSearch = !search ||
        a.appointmentId?.toLowerCase().includes(search) ||
        a.patientId?.toLowerCase().includes(search) ||
        a.patientName?.toLowerCase().includes(search) ||
        a.doctorEmployeeId?.toLowerCase().includes(search) ||
        a.doctorName?.toLowerCase().includes(search);

      const matchesStatus = this.selectedStatus === 'ALL STATUS' || a.status === this.selectedStatus;
      const matchesDoctor = this.selectedDoctor === 'ALL DOCTORS' || a.doctorName === this.selectedDoctor;
      const matchesDate = !this.selectedDate || new Date(a.date).toDateString() === new Date(this.selectedDate).toDateString();

      return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
    });

    this.expandedAppointment = null;
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'ALL STATUS';
    this.selectedDoctor = 'ALL DOCTORS';
    this.selectedDate = null;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilters();
  }

  toggleRow(appointment: any): void {
    this.expandedAppointment = this.expandedAppointment === appointment ? null : appointment;
    this.cdr.markForCheck();
  }

  openAddDialog(): void {
    const ref = this.dialog.open(AppointmentDialog, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAppointments();
    });
  }

  approveAppointment(appointment: any): void {
    if (!appointment?.appointmentId) return;
    if (!confirm(`Approve appointment ${appointment.appointmentId}?`)) return;

    this.appointmentService.approveAppointment(appointment.appointmentId).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || 'Appointment approved successfully');
        this.loadAppointments();
      },
      error: (err: any) => this.toastr.error(err?.error?.message || 'Failed to approve appointment')
    });
  }

  rejectAppointment(appointment: any): void {
    if (!appointment?.appointmentId) return;
    if (!confirm(`Reject appointment ${appointment.appointmentId}?`)) return;

    this.appointmentService.rejectAppointment(appointment.appointmentId).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || 'Appointment rejected successfully');
        this.loadAppointments();
      },
      error: (err: any) => this.toastr.error(err?.error?.message || 'Failed to reject appointment')
    });
  }

  deleteAppointment(appointment: any): void {
    if (!appointment?.appointmentId) return;
    if (!confirm(`Delete appointment ${appointment.appointmentId}?`)) return;

    this.appointmentService.deleteAppointment(appointment.appointmentId).subscribe({
      next: () => {
        this.toastr.success('Appointment deleted successfully');
        this.loadAppointments();
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Delete failed')
    });
  }
}