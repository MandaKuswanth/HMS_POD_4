import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

export interface UpdateStatusDialogData {
  appointmentId: string;
  currentStatus: string;
  nextStatuses: string[];
}

@Component({
  selector: 'app-update-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Update Appointment Status</h2>

    <mat-dialog-content>

      <div class="row">

        <mat-form-field appearance="outline">
          <mat-label>Appointment ID</mat-label>
          <input
            matInput
            [value]="data.appointmentId"
            readonly>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Current Status</mat-label>
          <input
            matInput
            [value]="data.currentStatus"
            readonly>
        </mat-form-field>

      </div>

      <div class="row">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select New Status</mat-label>

          <mat-select [(ngModel)]="selectedStatus">

            <mat-option
              *ngFor="let status of data.nextStatuses"
              [value]="status">

              {{ status }}

            </mat-option>

          </mat-select>

        </mat-form-field>

      </div>

    </mat-dialog-content>

    <mat-dialog-actions align="end">

      <button
        mat-stroked-button
        (click)="onCancel()">
        Cancel
      </button>

      <button
        mat-raised-button
        color="primary"
        [disabled]="!selectedStatus"
        (click)="onConfirm()">

        Update Status

      </button>

    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }

    .full-width {
      grid-column: span 2;
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-content {
      min-width: 700px;
      padding-top: 10px;
    }

    mat-dialog-actions {
      padding: 20px 0;
    }
  `]
})
export class UpdateStatusDialog {

  selectedStatus!: string;

  constructor(
    public dialogRef: MatDialogRef<UpdateStatusDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: UpdateStatusDialogData
  ) {
    this.selectedStatus = data.currentStatus;
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedStatus);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}