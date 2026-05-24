import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


import { ToastrService } from 'ngx-toastr';
import { EmployeeService } from '../../../core/services/employee';

export interface EmployeeDialogData {
  mode: 'add' | 'edit';
  employee?: any;
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
  readonly employeeService = inject(EmployeeService);
  readonly toastr = inject(ToastrService);
  readonly dialogRef = inject(MatDialogRef<EmployeeDialog>);

  data: EmployeeDialogData = inject(MAT_DIALOG_DATA);

  loading = false;

  roles = [
    'OWNER', 'ADMIN', 'DOCTOR', 'RECEPTIONIST','CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST', 'TECHNICIAN'
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    department: ['', Validators.required],
    designation: ['', Validators.required],
    joiningDate: ['', Validators.required],
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

  showMedicalStaffFields(): boolean {
    return ['DOCTOR', 'NURSE', 'LAB_TECH'].includes(this.selectedRole);
  }

  showDoctorFields(): boolean {
    return this.selectedRole === 'DOCTOR';
  }

  ngOnInit(): void {
    // Prefill form if editing
    if (this.data.mode === 'edit' && this.data.employee) {
      const emp = this.data.employee;

      this.form.patchValue({
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        designation: emp.designation,
        joiningDate: emp.joiningDate,
        role: emp.role,
        status: emp.status,
        medicalRegistrationNo: emp.medicalRegistrationNo || '',
        specialization: emp.specialization || '',
        qualificationText: emp.qualification?.join(', ') || '',
        consultationFee: emp.consultationFee || ''
      });

      // Prefill availability slots
      if (emp.availabilitySlots?.length) {
        emp.availabilitySlots.forEach((slot: string) => {
          this.availabilitySlots.push(this.fb.control(slot, Validators.required));
        });
      }
    }
  }

  onRoleChange(): void {
    const qualCtrl = this.form.get('qualificationText');
    const feeCtrl = this.form.get('consultationFee');

    qualCtrl?.clearValidators();
    feeCtrl?.clearValidators();

    if (this.showMedicalStaffFields()) {
      qualCtrl?.setValidators([Validators.required]);
      if (this.availabilitySlots.length === 0) this.addSlot();
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
      ? formValue.qualificationText.split(',').map((s: string) => s.trim()).filter(Boolean)
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
      status: formValue.status
    };

    payload.qualification = qualification;

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
        next: (res) => {
          this.loading = false;
          const tempPassword = res?.data?.tempPassword;
          this.toastr.success(
            tempPassword
              ? `Employee created. Temp password: ${tempPassword}`
              : 'Employee created successfully'
          );
          this.dialogRef.close(true); // true = reload list
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error(err?.error?.message || 'Failed to create employee');
        }
      });
    } else {
      const employeeCode = this.data.employee.employeeCode;
      this.employeeService.updateEmployee(employeeCode, payload).subscribe({
        next: () => {
          this.loading = false;
          this.toastr.success('Employee updated successfully');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error(err?.error?.message || 'Failed to update employee');
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}