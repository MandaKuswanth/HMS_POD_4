import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';

import { EmployeeService } from '../../../core/services/employee';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  hidePassword = true;
  hideConfirmPassword = true;
  isSubmitting = false;
  statusMessage = '';

  readonly registerForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      role: ['RECEPTIONIST', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      medicalRegistrationNo: [''],
      specialization: [''],
      qualification: [''],
      consultationFee: [''],
      availabilitySlots: this.fb.array<string>([])
    },
    { validators: this.passwordsMatchValidator() }
  );

  readonly availabilitySlotOptions = [
    '09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'
  ];

  constructor() {
    this.updateRoleSpecificValidators();
    this.registerForm.get('role')?.valueChanges.subscribe(() => {
      this.updateRoleSpecificValidators();
    });
  }

  get isDoctor(): boolean { return this.registerForm.get('role')?.value === 'DOCTOR'; }
  get needsQualification(): boolean { return ['DOCTOR', 'NURSE'].includes(this.registerForm.get('role')?.value || ''); }
  get availabilitySlotsControl(): FormArray { return this.registerForm.get('availabilitySlots') as FormArray; }

  togglePasswordVisibility(): void { this.hidePassword = !this.hidePassword; }
  toggleConfirmPasswordVisibility(): void { this.hideConfirmPassword = !this.hideConfirmPassword; }

  fieldHasError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  fieldErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'This field is required.';
    if (control.errors['email']) return 'Please enter a valid email address.';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required.`;
    if (control.errors['pattern']) return 'Please enter a valid 10-digit phone number.';
    if (control.errors['min']) return `Value must be at least ${control.errors['min'].min}.`;
    if (control.errors['passwordMismatch']) return 'Passwords do not match.';

    return 'Please enter a valid value.';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.statusMessage = 'Please correct the highlighted fields before submitting.';
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = 'Submitting your registration request...';

    const payload = this.buildPayload();

    this.employeeService.registerEmployee(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.statusMessage = response?.message || 'Registration submitted successfully. Please wait for admin approval.';
        this.registerForm.reset({ role: 'RECEPTIONIST' });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.statusMessage = this.getRegistrationErrorMessage(error);
      }
    });
  }

  private getRegistrationErrorMessage(error: any): string {
    const status = error?.status;
    const backendMessage = error?.error?.message || error?.message || '';
    const validationErrors = error?.error?.errors;

    if (Array.isArray(validationErrors) && validationErrors.length > 0) return validationErrors[0]?.msg;
    if (status === 409 || /already exists/i.test(backendMessage) || /duplicate/i.test(backendMessage)) return 'Employee already exists. Kindly login.';

    return backendMessage || 'Registration failed. Please try again.';
  }

  private updateRoleSpecificValidators(): void {
    const role = this.registerForm.get('role')?.value || '';
    const controls = ['medicalRegistrationNo', 'specialization', 'qualification', 'consultationFee', 'availabilitySlots']
      .map(name => this.registerForm.get(name));

    controls.forEach(c => c?.clearValidators());
    this.availabilitySlotsControl.clear();

    if (role === 'DOCTOR') {
      controls[0]?.setValidators([Validators.required, Validators.minLength(4)]);
      controls[1]?.setValidators([Validators.required, Validators.minLength(2)]);
      controls[2]?.setValidators([Validators.required]);
      controls[3]?.setValidators([Validators.required, Validators.min(1)]);
      controls[4]?.setValidators([Validators.required]);
    } else if (role === 'NURSE') {
      controls[2]?.setValidators([Validators.required]);
    }

    controls.forEach(c => c?.updateValueAndValidity());
  }

  private buildPayload() {
    const raw = this.registerForm.getRawValue();
    const qualification = this.parseList(raw.qualification);
    const availabilitySlots = this.availabilitySlotsControl.value ?? [];

    // 1. Destructure 'role' out of the raw form data
    const { role, ...rest } = raw;

    // 2. Build the payload matching the EmployeeRequest interface
    return {
      ...rest,
      roles: [role], // FIX: Wrap the singular role in an array
      qualification: qualification.length ? qualification : undefined,
      availabilitySlots: availabilitySlots.length ? availabilitySlots : undefined,
      consultationFee: raw.consultationFee ? Number(raw.consultationFee) : undefined
    };
  }

  toggleAvailabilitySlot(slot: string, event: MatCheckboxChange): void {
    if (event.checked) {
      this.availabilitySlotsControl.push(new FormControl(slot));
    } else {
      const index = this.availabilitySlotsControl.controls.findIndex(c => c.value === slot);
      if (index >= 0) this.availabilitySlotsControl.removeAt(index);
    }
    this.availabilitySlotsControl.updateValueAndValidity();
  }

  isAvailabilitySlotSelected(slot: string): boolean {
    return this.availabilitySlotsControl.value?.includes(slot) ?? false;
  }

  private parseList(value: string): string[] {
    return value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
  }

  private passwordsMatchValidator() {
    return (form: any) => {
      const password = form.get('password')?.value;
      const confirmPassword = form.get('confirmPassword')?.value;
      return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
    };
  }
}