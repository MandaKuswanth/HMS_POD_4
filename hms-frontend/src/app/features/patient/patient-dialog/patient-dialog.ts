import { Component, inject } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { PatientService } from '../../../core/services/patient';


@Component({
  selector: 'app-patient-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './patient-dialog.html',
  styleUrl: './patient-dialog.css'
})

export class PatientDialog {

  readonly fb = inject(FormBuilder);

  readonly patientService = inject(PatientService);

  readonly toastr = inject(ToastrService);

  readonly dialogRef = inject(MatDialogRef<PatientDialog>);

  loading = false;

  genders = [
    'male',
    'female',
    'others'
  ];

  form = this.fb.group({
    name: ['', Validators.required],

    email: ['', [Validators.required, Validators.email]],

    phone: [
      '',
      Validators.required
    ],

    gender: [
      '',
      Validators.required
    ],

    dob: [
      '',
      Validators.required
    ],

    address: [''],

    emergencyName: [''],

    emergencyRelation: [''],

    emergencyPhone: ['']

  });

  onSubmit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.toastr.error(
        'Please fill all required fields'
      );

      return;
    }

    this.loading = true;

    const formValue =
      this.form.value;

    const payload = {

      name:
        formValue.name || '',

      email:
        formValue.email || '',

      phone:
        formValue.phone || '',

      gender:
        formValue.gender || '',

      dob:
        formatDate(
          new Date(formValue.dob || ''),
          'yyyy-MM-dd',
          'en-US'
        ),

      address:
        formValue.address || '',

      emergencyContact: {

        name:
          formValue.emergencyName || '',

        relation:
          formValue.emergencyRelation || '',

        phone:
          formValue.emergencyPhone || ''
      }

    };

    this.patientService
      .createPatient(payload)
      .subscribe({
        next: () => {
          this.loading = false;

          this.toastr.success(
            'Patient created successfully'
          );

          this.dialogRef.close(true);
        },

        error: (err) => {

          this.loading = false;
          this.toastr.error(

            err?.error?.message ||

            'Failed to create patient'
          );
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

}