import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
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
  readonly PERMISSIONS = PERMISSIONS;
  role: string | null = null;

  readonly appointments = signal<any[]>([]);
  readonly filteredAppointments = signal<any[]>([]);

  readonly searchText = signal('');
  readonly isLoading = signal(false);
  readonly expandedAppointment = signal<any>(null);

  readonly selectedStatus = signal('ALL');
  readonly selectedDoctor = signal('');
  readonly selectedDate = signal<Date | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);
  pageSizeOptions = [5, 10, 25];
  readonly totalRecords = signal(0);

  readonly doctors = signal<any[]>([]);
  readonly statuses = signal<string[]>([]);

  readonly paginatedAppointments = computed(() => this.filteredAppointments());

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

  loadAppointments(): void {
    this.isLoading.set(true);
    this.expandedAppointment.set(null);

    const selectedDate = this.selectedDate();
    const formattedDate = selectedDate
      ? selectedDate.toISOString().split('T')[0]
      : undefined;

    this.appointmentService
      .getAppointments(
        this.pageIndex() + 1,
        this.pageSize(),
        {
          doctorEmployeeId: this.selectedDoctor() || undefined,
          status: this.selectedStatus(),
          search: this.searchText(),
          date: formattedDate,
        }
      )
      .subscribe({
        next: (response: any) => {
          console.log('APPOINTMENT RESPONSE:', response);

          const data = response?.data;
          const records = Array.isArray(data?.records) ? data.records : [];

          this.appointments.set(records);
          this.filteredAppointments.set([...records]);
          this.totalRecords.set(data?.pagination?.totalRecords || records.length);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('APPOINTMENT LIST ERROR:', error);

          this.isLoading.set(false);
          this.appointments.set([]);
          this.filteredAppointments.set([]);
          this.totalRecords.set(0);

          this.toastr.error('Failed to load appointments');
        },
      });
  }

  loadFilterOptions(): void {
    this.appointmentService.getAppointmentFilterOptions().subscribe({
      next: (response: any) => {
        this.doctors.set(response?.data?.doctors || []);
        this.statuses.set(response?.data?.statuses || ['ALL']);
      },
      error: () => {
        this.doctors.set([]);
        this.statuses.set(['ALL']);
      },
    });
  }

  applySearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchText.set('');
    this.applyFilters();
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.expandedAppointment.set(null);
    this.loadAppointments();
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedStatus.set('ALL');
    this.selectedDoctor.set('');
    this.selectedDate.set(null);

    this.pageIndex.set(0);
    this.expandedAppointment.set(null);

    this.loadAppointments();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.loadAppointments();
  }

  toggleRow(appointment: any): void {
    this.expandedAppointment.set(
      this.expandedAppointment() === appointment ? null : appointment
    );
  }

  closeExpandedRow(): void {
    this.expandedAppointment.set(null);
  }

  getStatusCount(status: string): number {
    return this.appointments().filter(
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
          this.expandedAppointment.set(null);
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
          this.expandedAppointment.set(null);
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
          this.expandedAppointment.set(null);
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

            this.expandedAppointment.set(null);

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
