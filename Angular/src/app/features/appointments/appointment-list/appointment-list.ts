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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AppointmentService } from '../../../core/services/appointment';
import { AppointmentDialog } from '../appointment-dialog/appointment-dialog';
import { AuthService } from '../../../core/services/auth';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';
import { UpdateStatusDialog } from '../appointment-dialog/update-status-dialog';

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
    MatPaginatorModule,
    Navbar,
    Sidebar,
    HasPermissionDirective,
    UpdateStatusDialog,
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
  readonly PERMISSIONS = PERMISSIONS;
  role: string | null = null;

  appointments: any[] = [];
  filteredAppointments: any[] = [];

  searchText = '';
  isLoading = false;
  expandedAppointment: any = null;

  selectedStatus = 'ALL STATUS';
  selectedDoctor = 'ALL DOCTORS';
  selectedDate: Date | null = null;

  pageIndex = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25];
  totalRecords = 0;

  displayedColumns: string[] = [
    'appointmentId',
    'patientId',
    'doctorEmployeeId',
    'date',
    'timeSlot',
    'status',
  ];

  ngOnInit(): void {
    this.role = this.authService.getRole()?.toUpperCase() || null;
    this.loadAppointments();
  }

  get paginatedAppointments(): any[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredAppointments.slice(start, end);
  }

  get statuses(): string[] {
    return [
      'ALL STATUS',
      'PENDING',
      'BOOKED',
      'IN-PROCESS',
      'COMPLETED',
      'CANCELLED',
    ];
  }

  get doctors(): any[] {
    const doctorList = this.appointments
      .map((appointment: any) => appointment.doctorName)
      .filter(Boolean);

    return ['ALL DOCTORS', ...new Set(doctorList)];
  }

  loadAppointments(): void {
  this.isLoading = true;
  this.expandedAppointment = null;
  this.cdr.markForCheck();

  this.appointmentService
    .getAppointments(this.pageIndex + 1, this.pageSize)
    .subscribe({
      next: (response: any) => {

        this.appointments = Array.isArray(response?.data?.records)
          ? response.data.records
          : [];

        this.filteredAppointments = [...this.appointments];

        this.totalRecords =
          response?.data?.pagination?.totalRecords || 0;

        this.isLoading = false;
        this.expandedAppointment = null;

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('APPOINTMENT LIST ERROR:', error);

        this.isLoading = false;
        this.appointments = [];
        this.filteredAppointments = [];
        this.totalRecords = 0;
        this.expandedAppointment = null;

        this.toastr.error(
          error?.error?.message || 'Failed to load appointments'
        );

        this.cdr.markForCheck();
      },
    });
}
  applySearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilters();
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    this.filteredAppointments = this.appointments.filter((appointment: any) => {
      const matchesSearch =
        !search ||
        appointment.appointmentId?.toLowerCase().includes(search) ||
        appointment.patientId?.toLowerCase().includes(search) ||
        appointment.patientName?.toLowerCase().includes(search) ||
        appointment.doctorEmployeeId?.toLowerCase().includes(search) ||
        appointment.doctorName?.toLowerCase().includes(search) ||
        appointment.timeSlot?.toLowerCase().includes(search) ||
        appointment.status?.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'ALL STATUS' ||
        appointment.status === this.selectedStatus;

      const matchesDoctor =
        this.selectedDoctor === 'ALL DOCTORS' ||
        appointment.doctorName === this.selectedDoctor;

      const matchesDate =
        !this.selectedDate ||
        new Date(appointment.date).toDateString() ===
        new Date(this.selectedDate).toDateString();

      return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
    });

    this.pageIndex = 0;
    this.expandedAppointment = null;
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'ALL STATUS';
    this.selectedDoctor = 'ALL DOCTORS';
    this.selectedDate = null;

    this.filteredAppointments = [...this.appointments];
    this.pageIndex = 0;
    this.expandedAppointment = null;

    this.cdr.markForCheck();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.loadAppointments();
  }

  toggleRow(appointment: any): void {
    this.expandedAppointment =
      this.expandedAppointment === appointment ? null : appointment;

    this.cdr.markForCheck();
  }

  closeExpandedRow(): void {
    this.expandedAppointment = null;
    this.cdr.markForCheck();
  }

  getStatusCount(status: string): number {
    return this.appointments.filter(
      (appointment: any) => appointment.status === status
    ).length;
  }

  openAddDialog(): void {
    if (this.role === 'DOCTOR') {
      this.toastr.error('Doctors are not allowed to create appointments');
      return;
    }

    const ref = this.dialog.open(AppointmentDialog, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAppointments();
      }
    });
  }

  deleteAppointment(appointment: any): void {
    if (this.role === 'DOCTOR') {
      this.toastr.error('Doctors are not allowed to delete appointments');
      return;
    }

    if (!appointment?.appointmentId) {
      this.toastr.error('Appointment ID missing');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete appointment ${appointment.appointmentId}?`
    );

    if (!confirmed) {
      return;
    }

    this.appointmentService
      .deleteAppointment(appointment.appointmentId)
      .subscribe({
        next: () => {
          this.toastr.success('Appointment deleted successfully');
          this.expandedAppointment = null;
          this.loadAppointments();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || 'Delete failed');
        },
      });
  }

  approveAppointment(appointment: any): void {
    if (!appointment?.appointmentId) {
      this.toastr.error('Appointment ID missing');
      return;
    }

    const confirmed = confirm(
      `Approve appointment ${appointment.appointmentId}?`
    );

    if (!confirmed) {
      return;
    }

    this.appointmentService
      .approveAppointment(appointment.appointmentId)
      .subscribe({
        next: (response: any) => {
          this.toastr.success(
            response?.message || 'Appointment approved successfully'
          );
          this.expandedAppointment = null;
          this.loadAppointments();
        },
        error: (err: any) => {
          this.toastr.error(
            err?.error?.message || 'Failed to approve appointment'
          );
        },
      });
  }

  rejectAppointment(appointment: any): void {
    if (!appointment?.appointmentId) {
      this.toastr.error('Appointment ID missing');
      return;
    }

    const confirmed = confirm(
      `Reject appointment ${appointment.appointmentId}?`
    );

    if (!confirmed) {
      return;
    }

    this.appointmentService
      .rejectAppointment(appointment.appointmentId)
      .subscribe({
        next: (response: any) => {
          this.toastr.success(
            response?.message || 'Appointment rejected successfully'
          );
          this.expandedAppointment = null;
          this.loadAppointments();
        },
        error: (err: any) => {
          this.toastr.error(
            err?.error?.message || 'Failed to reject appointment'
          );
        },
      });
  }

// openUpdateStatusDialog(appointment: any): void {
//   const allowedTransitions: Record<string, string[]> = {
//     'BOOKED':     ['IN-PROCESS'],
//     'IN-PROCESS': ['COMPLETED'],
//   };

//   const nextStatuses = allowedTransitions[appointment.status];

//   if (!nextStatuses || nextStatuses.length === 0) {
//     this.toastr.info(`No status transitions available for "${appointment.status}"`);
//     return;
//   }

//   const ref = this.dialog.open(UpdateStatusDialog, {
//     width: '440px',
//     disableClose: true,
//     data: {
//       appointmentId: appointment.appointmentId,
//       currentStatus: appointment.status,
//       nextStatuses,
//     },
//   });

//   ref.afterClosed().subscribe((chosenStatus: string | null) => {
//     if (!chosenStatus) return;

//     this.appointmentService
//       .updateAppointmentStatus(appointment.appointmentId, chosenStatus)
//       .subscribe({
//         next: (response: any) => {
//           this.toastr.success(response?.message || `Appointment marked as ${chosenStatus}`);
//           this.expandedAppointment = null;
//           this.loadAppointments();
//         },
//         error: (err: any) => {
//           this.toastr.error(err?.error?.message || 'Failed to update appointment status');
//         },
//       });
//   });
// }

openUpdateStatusDialog(appointment: any): void {
  const ref = this.dialog.open(UpdateStatusDialog, {
    width: '900px',
    maxWidth: '95vw',
    disableClose: true,
    data: {
      appointmentId: appointment.appointmentId,
      currentStatus: appointment.status,
      nextStatuses: appointment.allowedStatuses || []
    }
  });

  ref.afterClosed().subscribe((selectedStatus: string) => {

    if (!selectedStatus ||
        selectedStatus === appointment.status) {
      return;
    }

    this.appointmentService
      .updateAppointmentStatus(
        appointment.appointmentId,
        selectedStatus
      )
      .subscribe({
        next: (response: any) => {

          this.toastr.success(
            response?.message ||
            'Status updated successfully'
          );

          this.expandedAppointment = null;

          this.loadAppointments();
        },

        error: (error: any) => {

          this.toastr.error(
            error?.error?.message ||
            'Failed to update appointment status'
          );

        }
      });

  });

}

  getPatientDisplayName(appointment: any): string {
    return appointment?.patientName || 'N/A';
  }

  getDoctorDisplayName(appointment: any): string {
    if (!appointment?.doctorName) {
      return 'N/A';
    }

    return appointment.doctorName.startsWith('Dr.')
      ? appointment.doctorName
      : `Dr. ${appointment.doctorName}`;
  }
}