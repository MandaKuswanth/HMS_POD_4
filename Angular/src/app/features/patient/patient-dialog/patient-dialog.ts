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

// 1. Added Interface to fix the "never" TypeScript error
interface PatientFormValue {
    name: string | null;
    email: string | null;
    phone: string | null;
    gender: string | null;
    dob: string | Date | null;
    address: string | null;
    emergencyName: string | null;
    emergencyRelation: string | null;
    emergencyPhone: string | null;
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
            null as string | null,
            [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(50),
                Validators.pattern(/^[A-Za-z ]+$/)
            ]
        ],
        email: [
            null as string | null,
            [
                Validators.required,
                Validators.email,
                Validators.maxLength(80)
            ]
        ],
        phone: [
            null as string | null,
            [
                Validators.required,
                Validators.pattern(/^[6-9]\d{9}$/)
            ]
        ],
        gender: [
            null as string | null,
            Validators.required
        ],
        dob: [
            null as string | Date | null,
            [
                Validators.required,
                (control: AbstractControl) => this.futureDateValidator(control)
            ]
        ],
        address: [
            null as string | null,
            Validators.maxLength(200)
        ],
        emergencyName: [
            null as string | null,
            [
                Validators.maxLength(50),
                Validators.pattern(/^[A-Za-z ]*$/)
            ]
        ],
        emergencyRelation: [
            null as string | null,
            Validators.maxLength(30)
        ],
        emergencyPhone: [
            null as string | null,
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
                address: typeof patient.address === 'object' && patient.address !== null
                    ? Object.values(patient.address).filter(Boolean).join(', ')
                    : (patient.address || ''),
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

    private futureDateValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) {
            return null;
        }

        const selectedDate = new Date(control.value);
        const today = new Date();

        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return selectedDate > today ? { futureDate: true } : null;
    }

    private resetForm(): void {
        this.form.reset();
        this.form.enable();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toastr.error('Please fill all required fields correctly');
            return;
        }

        this.loading = true;

        // 2. Explicitly cast the raw value to our interface
        const f = this.form.getRawValue() as PatientFormValue;

        const addressStr = typeof f.address === 'string' 
            ? f.address.trim() 
            : (f.address ? Object.values(f.address).filter(Boolean).join(', ') : '');

        const payload = {
            name: f.name?.trim() ?? '',
            email: f.email?.trim() ?? '',
            phone: f.phone?.trim() ?? '',
            gender: f.gender ?? '',
            dob: f.dob
                ? formatDate(new Date(f.dob), 'yyyy-MM-dd', 'en-US')
                : '',
            address: addressStr,
            emergencyContact: {
                name: f.emergencyName?.trim() ?? '',
                relation: f.emergencyRelation?.trim() ?? '',
                phone: f.emergencyPhone?.trim() ?? ''
            }
        };

        // 3. Consolidated API Call for both Edit and Add
        const action$ = this.data.mode === 'edit'
            ? this.patientService.updatePatient(this.data.patient.UHID, payload)
            : this.patientService.createPatient(payload);

        action$.subscribe({
            next: () => {
                this.loading = false;
                this.toastr.success(`Patient ${this.data.mode === 'edit' ? 'updated' : 'created'} successfully`);
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.loading = false;
                this.toastr.error(err?.error?.message || `Failed to ${this.data.mode} patient`);
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}