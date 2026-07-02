import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MainComponent } from '../../../shared/components/maincomponent/maincomponent';
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
    MainComponent,
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
    HasPermissionDirective,
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

  selectedStatus = 'ALL';
  selectedDoctor = '';
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
    this.loadFilterOptions();
    this.loadAppointments();
  }

  get paginatedAppointments(): any[] {

    return this.filteredAppointments;
  }
  doctors: any[] = [];
  statuses: string[] = [];

  // get statuses(): string[] {
  //   return [
  //     'ALL STATUS',
  //     'PENDING',
  //     'BOOKED',
  //     'IN-PROCESS',
  //     'COMPLETED',
  //     'CANCELLED',
  //   ];
  // }

  // get doctors(): any[] {
  //   const doctorList = this.appointments
  //     .map((appointment: any) => appointment.doctorName)
  //     .filter(Boolean);

  //   return ['ALL DOCTORS', ...new Set(doctorList)];
  // }

  loadAppointments(): void {
  this.isLoading = true;
  this.expandedAppointment = null;
  this.cdr.markForCheck();

    const formattedDate = this.selectedDate
    ? this.selectedDate.toISOString().split('T')[0]
    : undefined;

  this.appointmentService
    .getAppointments(
      this.pageIndex + 1,
      this.pageSize,
      {
        doctorEmployeeId: this.selectedDoctor || undefined,
        status: this.selectedStatus,
        search: this.searchText,
        date: formattedDate,
      }
    )
    .subscribe({
      next: (response: any) => {
        const data = response?.data;

        this.appointments = Array.isArray(data?.records)
          ? data.records
          : [];

        this.filteredAppointments = [...this.appointments];

        this.totalRecords =
          data?.pagination?.totalRecords || this.appointments.length;

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('APPOINTMENT LIST ERROR:', error);

        this.isLoading = false;
        this.appointments = [];
        this.filteredAppointments = [];
        this.totalRecords = 0;

        this.toastr.error('Failed to load appointments');
        this.cdr.markForCheck();
      },
    });
}
  loadFilterOptions(): void {
    this.appointmentService.getAppointmentFilterOptions().subscribe({
      next: (response: any) => {
        this.doctors = response?.data?.doctors || [];
        this.statuses = response?.data?.statuses || ['ALL'];

        this.cdr.markForCheck();
      },
      error: () => {
        this.doctors = [];
        this.statuses = ['ALL'];

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
  this.pageIndex = 0;
  this.expandedAppointment = null;
  this.loadAppointments();
  this.cdr.markForCheck();
}

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'ALL';
    this.selectedDoctor = '';
    this.selectedDate = null;

    this.pageIndex = 0;
    this.expandedAppointment = null;

    this.loadAppointments();
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
