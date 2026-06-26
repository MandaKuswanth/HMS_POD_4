import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';

import { AppointmentService } from '../../../core/services/appointment';
import { EmployeeService } from '../../../core/services/employee';
import { PatientService } from '../../../core/services/patient';
import { SearchDropdownComponent } from '../../../shared/components/search-dropdown/search-dropdown';

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule,
    SearchDropdownComponent
  ],
  templateUrl: './appointment-dialog.html',
  styleUrl: './appointment-dialog.css'
})
export class AppointmentDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly dialogRef = inject(MatDialogRef<AppointmentDialog>);
  private readonly appointmentService = inject(AppointmentService);
  readonly employeeService = inject(EmployeeService);
  readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly data = inject<any>(MAT_DIALOG_DATA, { optional: true });

  availableSlots: string[] = [];
  minDate: Date = new Date();
  loading = false;

  form = this.fb.group({
    patientId: ['', Validators.required],
    doctorEmployeeId: ['', Validators.required],
    date: ['', Validators.required],
    timeSlot: [{ value: '', disabled: true }, Validators.required]
  });
  ngOnInit(): void {
    this.form.valueChanges.subscribe((values) => {
      if (values.doctorEmployeeId && values.date) {
        this.loadDoctorSlots(values.doctorEmployeeId, values.date);
      }
    });
    if (this.data?.mode === 'edit' && this.data?.appointment) {
      const appt = this.data.appointment;
      this.form.patchValue({
        patientId: appt.patientId || '',
        doctorEmployeeId: appt.doctorEmployeeId || '',
        date: appt.date ? new Date(appt.date) as any : '',
      });

      if (appt.doctorEmployeeId && appt.date) {
        this.loadDoctorSlots(appt.doctorEmployeeId, appt.date);
      }
    }
  }

  onPatientSelected(patient: any): void {
    this.cdr.detectChanges();
  }

  onDoctorSelected(doctor: any): void {
    this.form.get('timeSlot')?.reset();
    this.form.get('timeSlot')?.disable();
    this.cdr.detectChanges();
  }

  loadDoctorSlots(doctorId: string, dateObj: any): void {
    const formattedDate = formatDate(
      new Date(dateObj),
      'yyyy-MM-dd',
      'en-US'
    );
    this.appointmentService.getDoctorSlots(doctorId, formattedDate).subscribe({
      next: (res) => {
        const data = res?.data || {};
        const allSlots = data.allSlots || [];
        const bookedSlots = data.bookedSlots || [];
        const pastSlots = data.pastSlots || [];

        this.availableSlots = allSlots.filter((slot: string) => {
           // Allow currently selected slot in edit mode
           if (this.data?.mode === 'edit' && this.data.appointment?.timeSlot === slot && 
               formatDate(new Date(this.data.appointment.date), 'yyyy-MM-dd', 'en-US') === formattedDate) {
               return true;
           }
           return !bookedSlots.includes(slot) && !pastSlots.includes(slot);
        });

        if (this.availableSlots.length > 0) {
          this.form.get('timeSlot')?.enable();
        } else {
          this.form.get('timeSlot')?.disable();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.availableSlots = [];
        this.form.get('timeSlot')?.disable();
        this.cdr.detectChanges();
      }
    });
  }

  searchSlots = (query: string): Observable<any> => {
    const list = this.availableSlots
      .filter(slot => slot.toLowerCase().includes(query.toLowerCase()))
      .map(slot => ({ _id: slot, name: slot }));
    return of(list);
  };

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fill all required fields');
      return;
    }

    this.setLoading(true);
    const formValue = this.form.getRawValue();

    const payload = {
      patientId: formValue.patientId || '',
      doctorId: formValue.doctorEmployeeId || '',
      doctorEmployeeId: formValue.doctorEmployeeId || '',
      date: formatDate(
        new Date(formValue.date || ''),
        'yyyy-MM-dd',
        'en-US'
      ),
      timeSlot: formValue.timeSlot || ''
    };

    const request$ = this.data?.mode === 'edit'
      ? this.appointmentService.updateAppointment(this.data.appointment.appointmentId, payload)
      : this.appointmentService.createAppointment(payload);

    request$.subscribe({
      next: () => {
        this.toastr.success(
          this.data?.mode === 'edit'
            ? 'Appointment rescheduled successfully'
            : 'Appointment created successfully'
        );
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.setLoading(false);
        this.toastr.error(err?.error?.message || 'Failed to save appointment');
      }
    });
  }

  private setLoading(value: boolean): void {
    this.loading = value;
    this.cdr.detectChanges();
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
