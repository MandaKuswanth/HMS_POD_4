import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { EmployeeService } from '../../../core/services/employee';
import * as utils from '../../../shared/utils/employee-form-utils';

@Component({
  selector: 'app-employee-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatIconModule],
  templateUrl: './employee-dialog.html',
  styleUrl: './employee-dialog.css'
})
export class EmployeeDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EmployeeService);
  private readonly toastr = inject(ToastrService);
  private readonly dialogRef = inject(MatDialogRef<EmployeeDialog>);
  readonly data = inject(MAT_DIALOG_DATA, { optional: true });

  loading = false;
  readonly roles = utils.EMPLOYEE_ROLES;
  readonly timeSlots = [
    '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM', '12:30 PM - 01:00 PM', '01:00 PM - 01:30 PM',
    '01:30 PM - 02:00 PM', '02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM', '03:30 PM - 04:00 PM', '04:00 PM - 04:30 PM', '04:30 PM - 05:00 PM'
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(utils.NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(utils.PHONE_PATTERN)]],
    department: ['', Validators.required],
    designation: ['', Validators.required],
    joiningDate: ['', [Validators.required, utils.noFutureDateValidator]],
    role: ['', Validators.required],
    status: [true],
    medicalRegistrationNo: [''],
    specialization: [''],
    qualificationText: [''],
    consultationFee: [''],
    availabilitySlots: this.fb.array([])
  });

  get availabilitySlots(): FormArray { return this.form.get('availabilitySlots') as FormArray; }

  // --- ADDED THESE MISSING HELPERS TO FIX ts(2339) ---
  showMedicalStaffFields(): boolean {
    return utils.isMedicalStaffRole(this.form.get('role')?.value || '');
  }

  showDoctorFields(): boolean {
    return utils.isDoctorRole(this.form.get('role')?.value || '');
  }
  // ----------------------------------------------------

  ngOnInit() {
    if (this.data?.mode === 'edit' && this.data.employee) {
      this.form.patchValue({
        ...this.data.employee,
        role: this.data.employee.roles?.[0]
      });
    }
  }


  toggleSlot(slot: string, event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.availabilitySlots.push(this.fb.control(slot));
    } else {
      const index = this.availabilitySlots.value.indexOf(slot);
      if (index > -1) this.availabilitySlots.removeAt(index);
    }

    // FIX: Make the control touched so the validation error appears/disappears immediately
    this.availabilitySlots.markAsTouched();
    this.availabilitySlots.updateValueAndValidity();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Invalid Form');
      return 
    }

    const val = this.form.value;
    const payload = {
      name: (val.name ?? '') as string,
      email: (val.email ?? '') as string,
      phone: (val.phone ?? '') as string,
      department: (val.department ?? '') as string,
      designation: (val.designation ?? '') as string,
      joiningDate: utils.getFormattedJoiningDate(val.joiningDate),
      roles: [val.role ?? ''],
      status: val.status ?? true,
      ...(this.showMedicalStaffFields() && {
        medicalRegistrationNo: val.medicalRegistrationNo ?? '',
        specialization: val.specialization ?? '',
        qualification: utils.getQualifications(val.qualificationText),
        consultationFee: Number(val.consultationFee) || 0,
        availabilitySlots: utils.getCleanAvailabilitySlots(val.availabilitySlots, true)
      })
    };

    this.loading = true;
    const action$ = this.data.mode === 'add'
      ? this.service.adminAddEmployee(payload)
      : this.service.updateEmployee(this.data.employee.employeeCode, payload);

    action$.subscribe({
      next: () => { this.toastr.success('Success'); this.dialogRef.close(true); },
      error: (err) => { this.toastr.error(err.error?.message || 'Action failed'); this.loading = false; }
    });
  }

  onCancel() { this.dialogRef.close(); }
  onRoleChange() { /* Triggered by UI to update form validity */ }
}