import { Component, OnInit, inject, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ToastrService } from 'ngx-toastr';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AppointmentService } from '../../../core/services/appointment';
import { EmployeeService } from '../../../core/services/employee';
import { AppointmentDialog } from '../appointment-dialog/appointment-dialog';
import { AuthService } from '../../../core/services/auth';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';
import { UpdateStatusDialog } from '../appointment-dialog/update-status-dialog';
import { SearchDropdownComponent } from '../../../shared/components/search-dropdown/search-dropdown';

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    HasPermissionDirective,
    SearchDropdownComponent
  ],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css',
})
export class AppointmentList implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  readonly PERMISSIONS = PERMISSIONS;
  readonly pageSizeOptions = [5, 10, 25, 50];
  role: string | null = null;

  // Signal States
  readonly appointmentsSignal = signal<any[]>([]);
  readonly totalSignal = signal(0);
  readonly pageSignal = signal(0); // 0-indexed
  readonly limitSignal = signal(5);
  readonly loadingSignal = signal(false);

  readonly searchTextSignal = signal('');
  readonly statusSignal = signal('ALL STATUS');
  readonly doctorSignal = signal('ALL DOCTORS');
  readonly dateSignal = signal<Date | null>(null);
  readonly expandedAppointmentSignal = signal<any | null>(null);
  readonly refreshSignal = signal(0);

  private readonly searchSubject = new Subject<string>();

  displayedColumns: string[] = [
    'appointmentId',
    'patientId',
    'doctorEmployeeId',
    'date',
    'timeSlot',
    'status',
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
      const status = this.statusSignal();
      const doctor = this.doctorSignal();
      const dateVal = this.dateSignal();
      const dateStr = dateVal ? dateVal.toISOString().split('T')[0] : '';
      const refresh = this.refreshSignal();

      this.loadAppointments(page, limit, search, status, doctor, dateStr);
    });
  }

  ngOnInit(): void {
    const user = this.authService.user();
    this.role = user?.roles?.[0]?.name?.toUpperCase() || null;
  }

  loadAppointments(page: number, limit: number, search: string, status: string, doctor: string, date: string): void {
    this.loadingSignal.set(true);
    this.appointmentService
      .getAppointments(page, limit, search, status, doctor, date)
      .subscribe({
        next: (response: any) => {
          this.loadingSignal.set(false);
          const records = Array.isArray(response?.data)
            ? response.data
            : (Array.isArray(response?.data?.records) ? response.data.records : []);

          this.appointmentsSignal.set(records);
          this.totalSignal.set(response?.pagination?.totalItems || response?.data?.pagination?.totalRecords || 0);
          this.expandedAppointmentSignal.set(null);
        },
        error: (error) => {
          this.loadingSignal.set(false);
          console.error('APPOINTMENT LIST ERROR:', error);
          this.appointmentsSignal.set([]);
          this.totalSignal.set(0);
          this.expandedAppointmentSignal.set(null);
          this.toastr.error(error?.error?.message || 'Failed to load appointments');
        },
      });
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  searchStatus = (query: string) => {
    const statuses = [
      { name: 'All Statuses', value: 'ALL STATUS' },
      { name: 'Pending', value: 'PENDING' },
      { name: 'Booked', value: 'BOOKED' },
      { name: 'In-Process', value: 'IN-PROCESS' },
      { name: 'Completed', value: 'COMPLETED' },
      { name: 'Cancelled', value: 'CANCELLED' }
    ];
    return of(statuses.filter(s => s.name.toLowerCase().includes(query.toLowerCase())));
  };

  onStatusChange(val: any): void {
    this.statusSignal.set(val || 'ALL STATUS');
    this.pageSignal.set(0);
  }

  onDoctorChange(val: any): void {
    this.doctorSignal.set(val || 'ALL DOCTORS');
    this.pageSignal.set(0);
  }

  onDateChange(val: Date | null): void {
    this.dateSignal.set(val);
    this.pageSignal.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageSignal.set(event.pageIndex);
    this.limitSignal.set(event.pageSize);
    this.expandedAppointmentSignal.set(null);
  }

  toggleRow(appointment: any): void {
    const current = this.expandedAppointmentSignal();
    this.expandedAppointmentSignal.set(current?.appointmentId === appointment.appointmentId ? null : appointment);
  }

  openAddDialog(): void {
    const ref = this.dialog.open(AppointmentDialog, {
      width: '660px',
      disableClose: true,
      autoFocus: false,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshSignal.update(v => v + 1);
        this.pageSignal.set(0);
      }
    });
  }

  openRescheduleDialog(appointment: any): void {
    const ref = this.dialog.open(AppointmentDialog, {
      data: {
        mode: 'edit',
        appointment,
      },
      width: '660px',
      disableClose: true,
      autoFocus: false,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshSignal.update(v => v + 1);
      }
    });
  }

  openUpdateStatusDialog(appointment: any): void {
    const ref = this.dialog.open(UpdateStatusDialog, {
      data: {
        appointmentId: appointment.appointmentId,
        currentStatus: appointment.status,
        nextStatuses: appointment.allowedStatuses || []
      },
      width: '450px',
      disableClose: true,
      autoFocus: false,
    });

    ref.afterClosed().subscribe((result) => {
      if (result && result.status) {
        this.appointmentService.updateAppointmentStatus(appointment.appointmentId, result.status, result.cancellationReason).subscribe({
          next: () => {
            this.toastr.success('Status updated successfully');
            this.refreshSignal.update(v => v + 1);
          },
          error: (err) => {
            this.toastr.error(err?.error?.message || 'Failed to update status');
          }
        });
      }
    });
  }

  approveAppointment(appointment: any): void {
    if (!appointment?.appointmentId) return;

    const confirmed = confirm(`Approve appointment ${appointment.appointmentId}?`);
    if (!confirmed) return;

    this.appointmentService.approveAppointment(appointment.appointmentId).subscribe({
      next: () => {
        this.toastr.success('Appointment approved successfully');
        this.pageSignal.set(this.pageSignal());
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Approval failed');
      },
    });
  }

  rejectAppointment(appointment: any): void {
    if (!appointment?.appointmentId) return;

    const confirmed = confirm(`Reject appointment ${appointment.appointmentId}?`);
    if (!confirmed) return;

    this.appointmentService.rejectAppointment(appointment.appointmentId).subscribe({
      next: () => {
        this.toastr.success('Appointment rejected successfully');
        this.pageSignal.set(this.pageSignal());
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Rejection failed');
      },
    });
  }

  deleteAppointment(appointment: any): void {
    if (!appointment?.appointmentId) return;

    const confirmed = confirm(`Delete appointment ${appointment.appointmentId}?`);
    if (!confirmed) return;

    this.appointmentService.deleteAppointment(appointment.appointmentId).subscribe({
      next: () => {
        this.toastr.success('Appointment deleted successfully');
        this.expandedAppointmentSignal.set(null);
        this.pageSignal.set(0);
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Delete failed');
      },
    });
  }

  clearFilters(): void {
    this.searchTextSignal.set('');
    this.statusSignal.set('ALL STATUS');
    this.doctorSignal.set('ALL DOCTORS');
    this.dateSignal.set(null);
    this.pageSignal.set(0);
    this.expandedAppointmentSignal.set(null);
  }

  getStatusCount(status: string): number {
    return this.appointmentsSignal().filter(
      (a: any) => a.status?.toUpperCase() === status.toUpperCase()
    ).length;
  }
}