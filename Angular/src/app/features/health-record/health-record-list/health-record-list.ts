import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HealthRecordService, HealthRecord } from '../../../core/services/health-record';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-health-record-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    HasPermissionDirective
  ],
  templateUrl: './health-record-list.html',
  styleUrl: './health-record-list.css'
})
export class HealthRecordList implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly healthRecordService = inject(HealthRecordService);
  
  readonly PERMISSIONS = PERMISSIONS;
  dataSource = new MatTableDataSource<HealthRecord>([]);
  displayedColumns: string[] = ['date', 'patientId', 'symptoms', 'diagnosis', 'actions'];

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.healthRecordService.getAllRecords().subscribe({
      next: (res) => {
        this.dataSource.data = res.data || [];
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: (err) => console.error('Failed to load health records', err)
    });
  }
}
