import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { ToastrService } from 'ngx-toastr';
import { Employee } from '../../../core/services/employee';

/* Employee object type for table/dialog data */
export interface EmployeeData {
  _id?: string;
  employeeCode?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate?: string;
  role: string;
  status: boolean;
  medicalRegistrationNo?: string | null;
  specialization?: string | null;
  qualification?: string[];
  consultationFee?: number | null;
  availabilitySlots?: string[];
  userId?: string;
  userStatus?: boolean;
  mustResetPassword?: boolean;
}

export interface EmployeeDialogData {
  mode: 'add' | 'edit';
  employee?: EmployeeData;
}

@Component({
  selector: 'app-employee-dialog',
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
  templateUrl: './employee-dialog.html',
  styleUrl: './employee-dialog.css'
})
export class EmployeeDialog implements OnInit {
  readonly fb = inject(FormBuilder);
  readonly employeeService = inject(Employee);
  readonly toastr = inject(ToastrService);
  readonly dialogRef = inject(MatDialogRef<EmployeeDialog>);
  readonly data = inject<EmployeeDialogData>(MAT_DIALOG_DATA);

  loading = false;

  roles = [
    'OWNER',
    'ADMIN',
    'DOCTOR',
    'RECEPTIONIST',
    'CASHIER',
    'NURSE',
    'LAB_TECH',
    'PHARMACIST',
    'TECHNICIAN'
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    department: ['', Validators.required],
    designation: ['', Validators.required],
    joiningDate: [''],
    role: ['', Validators.required],
    status: [true],
    medicalRegistrationNo: [''],
    specialization: [''],
    qualificationText: [''],
    consultationFee: [''],
    availabilitySlots: this.fb.array([])
  });

  get availabilitySlots(): FormArray {
    return this.form.get('availabilitySlots') as FormArray;
  }

  get selectedRole(): string {
    return this.form.get('role')?.value || '';
  }

  showDoctorFields(): boolean {
    return this.selectedRole === 'DOCTOR';
  }

  showMedicalStaffFields(): boolean {
    return ['DOCTOR', 'NURSE', 'LAB_TECH'].includes(this.selectedRole);
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.employee) {
      const emp = this.data.employee;

      this.form.patchValue({
        name: emp.name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        department: emp.department || '',
        designation: emp.designation || '',
        joiningDate: emp.joiningDate || '',
        role: emp.role || '',
        status: emp.status ?? true,
        medicalRegistrationNo: emp.medicalRegistrationNo || '',
        specialization: emp.specialization || '',
        qualificationText: emp.qualification?.join(', ') || '',
        consultationFee: emp.consultationFee ? String(emp.consultationFee) : ''
      });

      this.availabilitySlots.clear();

      if (emp.availabilitySlots?.length) {
        emp.availabilitySlots.forEach((slot: string) => {
          this.availabilitySlots.push(this.fb.control(slot, Validators.required));
        });
      }

      this.onRoleChange();
    }
  }

  onRoleChange(): void {
    const qualCtrl = this.form.get('qualificationText');
    const feeCtrl = this.form.get('consultationFee');

    qualCtrl?.clearValidators();
    feeCtrl?.clearValidators();

    if (this.showMedicalStaffFields()) {
      qualCtrl?.setValidators([Validators.required]);

      if (this.availabilitySlots.length === 0) {
        this.addSlot();
      }
    } else {
      this.availabilitySlots.clear();
    }

    if (this.showDoctorFields()) {
      feeCtrl?.setValidators([Validators.required]);
    }

    qualCtrl?.updateValueAndValidity();
    feeCtrl?.updateValueAndValidity();
  }

  addSlot(): void {
    this.availabilitySlots.push(this.fb.control('', Validators.required));
  }

  removeSlot(index: number): void {
    this.availabilitySlots.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fill all required fields');
      return;
    }

    const formValue = this.form.value;

    const qualification = formValue.qualificationText
      ? formValue.qualificationText
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      : [];

    const joiningDate = formValue.joiningDate
      ? formatDate(formValue.joiningDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const payload: any = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      department: formValue.department,
      designation: formValue.designation,
      joiningDate,
      role: formValue.role,
      status: formValue.status,
      qualification
    };

    if (this.showMedicalStaffFields()) {
      payload.availabilitySlots = formValue.availabilitySlots || [];
    }

    if (this.showDoctorFields()) {
      payload.medicalRegistrationNo = formValue.medicalRegistrationNo;
      payload.specialization = formValue.specialization;
      payload.consultationFee = Number(formValue.consultationFee);
    }

    this.loading = true;

    if (this.data.mode === 'add') {
      this.employeeService.adminAddEmployee(payload).subscribe({
        next: (res: any) => {
          this.loading = false;

          const tempPassword = res?.data?.tempPassword;

          this.toastr.success(
            tempPassword
              ? `Employee created. Temp password: ${tempPassword}`
              : 'Employee created successfully'
          );

          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.loading = false;
          this.toastr.error(err?.error?.message || 'Failed to create employee');
        }
      });

      return;
    }

    const employeeCode = this.data.employee?.employeeCode;

    if (!employeeCode) {
      this.loading = false;
      this.toastr.error('Employee code missing');
      return;
    }

    this.employeeService.updateEmployee(employeeCode, payload).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('Employee updated successfully');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading = false;
        this.toastr.error(err?.error?.message || 'Failed to update employee');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}