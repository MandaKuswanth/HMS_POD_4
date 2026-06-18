import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';

// --- Validators ---
export function noFutureDateValidator(control: AbstractControl) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? { futureDate: true } : null;
}

// --- Data Mapping ---
export function getQualifications(value: unknown): string[] {
    return typeof value === 'string'
        ? value.split(',').map(s => s.trim()).filter(Boolean)
        : [];
}

export function getFormattedJoiningDate(value: unknown): string {
    return value ? formatDate(value as string | Date, 'yyyy-MM-dd', 'en-US') : '';
}

export function getCleanAvailabilitySlots(value: unknown, include: boolean): string[] {
    return (include && Array.isArray(value)) ? value.map(s => String(s).trim()).filter(Boolean) : [];
}

export function addDoctorPayloadFields(payload: any, formValue: any, shouldAdd: boolean): void {
    if (!shouldAdd) return;
    payload.medicalRegistrationNo = trimInputValue(formValue.medicalRegistrationNo);
    payload.specialization = trimInputValue(formValue.specialization);
    payload.consultationFee = Number(formValue.consultationFee) || 0;
}

// --- Constants & Patterns ---
export const EMPLOYEE_ROLES = ['OWNER', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST', 'TECHNICIAN'];
export const MEDICAL_STAFF_ROLES = ['DOCTOR', 'NURSE', 'LAB_TECH'];
export const NAME_PATTERN = /^[A-Za-z. ]+$/; // Relaxed to allow "Dr. Smith"
export const PHONE_PATTERN = /^[6-9]\d{9}$/;
export const MEDICAL_REGISTRATION_PATTERN = /^[A-Za-z\d/-]+$/;
export const CONSULTATION_FEE_PATTERN = /^\d+$/;

export function isDoctorRole(role: string): boolean { return role === 'DOCTOR'; }
export function isMedicalStaffRole(role: string): boolean { return MEDICAL_STAFF_ROLES.includes(role); }
export function trimInputValue(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }

// --- Validator Factories ---
export const getMedicalRegistrationValidators = () => [Validators.required, Validators.minLength(4), Validators.maxLength(30), Validators.pattern(MEDICAL_REGISTRATION_PATTERN)];
export const getSpecializationValidators = () => [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(NAME_PATTERN)];
export const getConsultationFeeValidators = () => [Validators.required, Validators.min(1), Validators.pattern(CONSULTATION_FEE_PATTERN)];
export const getQualificationValidators = () => [Validators.required, Validators.minLength(2), Validators.maxLength(100)];