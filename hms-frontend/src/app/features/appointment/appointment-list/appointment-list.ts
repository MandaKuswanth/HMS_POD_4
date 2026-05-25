import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AppointmentService } from '../../../core/services/appointment';
import { AuthService } from '../../../core/services/auth';
import { AppointmentDialog } from '../appointment-dialog/appointment-dialog';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    Navbar,
    Sidebar
  ],
  templateUrl: './appointment-list.html',
  styleUrls: ['./appointment-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentList implements OnInit {

  readonly appointmentService = inject(AppointmentService);
  readonly authService = inject(AuthService);
  readonly toastr = inject(ToastrService);
  readonly dialog = inject(MatDialog);
  readonly cdr = inject(ChangeDetectorRef);

  appointments: any[] = [];

  displayedColumns: string[] = [
    'appointmentId',
    'patientId',
    'doctorEmployeeId',
    'date',
    'timeSlot',
    'status',
    'actions'
  ];

  get isDoctor(): boolean {
    return this.authService.getRole() === 'DOCTOR';
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (response) => {
        this.appointments = response?.data || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastr.error('Failed to load appointments');
      }
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(AppointmentDialog, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadAppointments();
    });
  }

  deleteAppointment(appointment: any): void {
    if (!confirm(`Delete appointment ${appointment.appointmentId}?`)) return;

    this.appointmentService.deleteAppointment(appointment.appointmentId).subscribe({
      next: () => {
        this.toastr.success('Appointment deleted');
        this.loadAppointments();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Delete failed');
      }
    });
  }
}