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

    private appointmentService = inject(AppointmentService);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);

    role: string | null = null;

    appointments: any[] = [];

    displayedColumns: string[] = [
        'appointmentId',
        'patientId',
        'doctorEmployeeId',
        'date',
        'timeSlot',
        'status'
    ];

    ngOnInit(): void {
        this.role = localStorage.getItem('role');

        if (this.role !== 'DOCTOR') {
            this.displayedColumns = [
                ...this.displayedColumns,
                'actions'
            ];
        }

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
        if (this.role === 'DOCTOR') {
            this.toastr.error('Doctors are not allowed to create appointments');
            return;
        }

        const ref = this.dialog.open(AppointmentDialog, {
            width: '900px',
            disableClose: true
        });

        ref.afterClosed().subscribe(result => {
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

        const confirmed = confirm(
            `Delete appointment ${appointment.appointmentId}?`
        );

        if (!confirmed) return;

        this.appointmentService
            .deleteAppointment(appointment.appointmentId)
            .subscribe({
                next: () => {
                    this.toastr.success('Appointment deleted');
                    this.loadAppointments();
                },
                error: (err) => {
                    this.toastr.error(
                        err?.error?.message || 'Delete failed'
                    );
                }
            });
    }
}