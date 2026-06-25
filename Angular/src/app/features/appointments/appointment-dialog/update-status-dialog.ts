import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, of } from 'rxjs';
import { SearchDropdownComponent } from '../../../shared/components/search-dropdown/search-dropdown';

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
    MatInputModule,
    SearchDropdownComponent
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

      <div class="row full-width-row">
        <div class="form-field-wrapper">
          <label class="field-label">Select New Status</label>
          <app-search-dropdown
            [searchFn]="searchNextStatuses"
            [displayField]="'name'"
            [valueField]="'_id'"
            [initialDisplay]="selectedStatus"
            [(ngModel)]="selectedStatus"
            placeholder="Choose new status..."
          ></app-search-dropdown>
        </div>
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
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }

    .full-width-row {
      grid-template-columns: 1fr;
    }

    .form-field-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-content {
      min-width: 450px;
      padding-top: 10px;
    }

    mat-dialog-actions {
      padding: 20px 0 0 0;
    }
  `]
})
export class UpdateStatusDialog {
  selectedStatus!: string;

  constructor(
    public dialogRef: MatDialogRef<UpdateStatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateStatusDialogData
  ) {
    this.selectedStatus = data.currentStatus;
  }

  searchNextStatuses = (query: string): Observable<any> => {
    const list = (this.data.nextStatuses || [])
      .filter(s => s.toLowerCase().includes(query.toLowerCase()))
      .map(s => ({ _id: s, name: s }));
    return of(list);
  };

  onConfirm(): void {
    this.dialogRef.close(this.selectedStatus);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}