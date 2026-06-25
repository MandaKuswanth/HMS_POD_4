import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import {
    AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from '@angular/forms';

import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { ToastrService } from 'ngx-toastr';

import { PatientService } from '../../../core/services/patient';

export interface PatientDialogData {
    mode: 'add' | 'edit' | 'view';
    patient?: any;
}

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
export class PatientDialog implements OnInit {

    readonly fb = inject(FormBuilder);
    readonly patientService = inject(PatientService);
    readonly toastr = inject(ToastrService);
    readonly dialogRef = inject(MatDialogRef<PatientDialog>);
    readonly data = inject<PatientDialogData>(MAT_DIALOG_DATA);

    loading = false;

    genders = ['male', 'female', 'others'];

    form = this.fb.group({
        name: [
            null,
            [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(50),
                Validators.pattern(/^[A-Za-z ]+$/)
            ]
        ],

        email: [
            null,
            [
                Validators.required,
                Validators.email,
                Validators.maxLength(80)
            ]
        ],

        phone: [
            null,
            [
                Validators.required,
                Validators.pattern(/^[6-9]\d{9}$/)
            ]
        ],

        gender: [
            null,
            Validators.required
        ],

        dob: [
            null,
            [
                Validators.required,
                this.futureDateValidator
            ]
        ],

        address: [
            null,
            Validators.maxLength(200)
        ],

        emergencyName: [
            null,
            [
                Validators.maxLength(50),
                Validators.pattern(/^[A-Za-z ]*$/)
            ]
        ],

        emergencyRelation: [
            null,
            Validators.maxLength(30)
        ],

        emergencyPhone: [
            null,
            Validators.pattern(/^[6-9]\d{9}$/)
        ]
    });

    get isViewMode(): boolean {
        return this.data.mode === 'view';
    }

    ngOnInit(): void {

        this.resetForm();

        if (this.data?.patient) {

            const patient = this.data.patient;

            this.form.patchValue({
                name: patient.name || '',
                email: patient.email || '',
                phone: patient.phone || '',
                gender: patient.gender || '',
                dob: patient.dob || '',
                address: patient.address || '',
                emergencyName: patient.emergencyContact?.name || '',
                emergencyRelation: patient.emergencyContact?.relation || '',
                emergencyPhone: patient.emergencyContact?.phone || ''
            });

            if (this.isViewMode) {
                this.form.disable();
            }
        }

        if (this.data?.mode === 'add') {
            this.form.enable();
        }
    }

    private futureDateValidator(
        control: AbstractControl
    ): ValidationErrors | null {

        if (!control.value) {
            return null;
        }

        const selectedDate = new Date(control.value);
        const today = new Date();

        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return selectedDate > today
            ? { futureDate: true }
            : null;
    }

    private resetForm(): void {

        this.form.reset({
            name: null,
            email: null,
            phone: null,
            gender: null,
            dob: null,
            address: null,
            emergencyName: null,
            emergencyRelation: null,
            emergencyPhone: null
        });

        this.form.enable();
    }

    onSubmit(): void {

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toastr.error(
                'Please fill all required fields correctly'
            );
            return;
        }

        this.loading = true;

        const formValue = this.form.getRawValue();

        const payload = {
            name: formValue.name ?? '',
            email: formValue.email ?? '',
            phone: formValue.phone ?? '',
            gender: formValue.gender ?? '',
            dob: formValue.dob
                ? formatDate(
                    new Date(formValue.dob),
                    'yyyy-MM-dd',
                    'en-US'
                )
                : '',
            address: formValue.address ?? '',
            emergencyContact: {
                name: formValue.emergencyName ?? '',
                relation: formValue.emergencyRelation ?? '',
                phone: formValue.emergencyPhone ?? ''
            }
        };

        // EDIT MODE
        if (this.data.mode === 'edit') {

            this.patientService
                .updatePatient(
                    this.data.patient.UHID,
                    payload
                )
                .subscribe({

                    next: () => {
                        this.loading = false;

                        this.toastr.success(
                            'Patient updated successfully'
                        );

                        this.dialogRef.close(true);
                    },

                    error: (err) => {
                        this.loading = false;

                        this.toastr.error(
                            err?.error?.message ||
                            'Failed to update patient'
                        );
                    }
                });

            return;
        }

        // ADD MODE
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