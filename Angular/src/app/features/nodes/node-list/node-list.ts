import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { ToastrService } from 'ngx-toastr';
import { NodeService } from '../../../core/services/node';
import { NodeDialog } from '../node-dialog/node-dialog';

@Component({
  selector: 'app-node-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,

  ],
  templateUrl: './node-list.html',
  styleUrl: './node-list.css',
})
export class NodeList implements OnInit {
  private readonly nodeService = inject(NodeService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'nodeId',
    'name',
    'path',
    'icon',
    'order',
    'status',
    'actions',
  ];

  nodes: any[] = [];
  dataSource = new MatTableDataSource<any>([]);

  searchText = '';

  pageIndex = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25];
  totalRecords = 0;

  ngOnInit(): void {
    this.loadNodes();
  }

  loadNodes(): void {
    this.nodeService
      .getNodes(this.pageIndex + 1, this.pageSize)
      .subscribe({
        next: (response: any) => {
          const nodes = Array.isArray(response?.data?.records)
            ? response.data.records
            : [];

          this.nodes = nodes;
          this.dataSource.data = nodes;

          this.totalRecords =
            response?.data?.pagination?.totalRecords || 0;
        },
        error: (err) => {
          console.error('NODE LIST ERROR:', err);
          this.nodes = [];
          this.dataSource.data = [];
          this.totalRecords = 0;
          this.toastr.error('Failed to load nodes');
        },
      });
  }

  applyFilter(): void {
    const search = this.searchText.trim().toLowerCase();

    this.dataSource.data = search
      ? this.nodes.filter((node) =>
        node.nodeId?.toLowerCase().includes(search) ||
        node.name?.toLowerCase().includes(search) ||
        node.path?.toLowerCase().includes(search) ||
        node.icon?.toLowerCase().includes(search)
      )
      : [...this.nodes];
  }

  clearSearch(): void {
    this.searchText = '';
    this.dataSource.data = [...this.nodes];
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadNodes();
  }

  openAddDialog(): void {
    const ref = this.dialog.open(NodeDialog, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        mode: 'add',
      },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.pageIndex = 0;
        this.loadNodes();
      }
    });
  }

  openEditDialog(node: any): void {
    const ref = this.dialog.open(NodeDialog, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        mode: 'edit',
        node,
      },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loadNodes();
      }
    });
  }

  deleteNode(node: any): void {
    if (!node?.nodeId) {
      this.toastr.error('Node ID missing');
      return;
    }

    const confirmed = confirm(`Delete node ${node.name}?`);

    if (!confirmed) {
      return;
    }

    this.nodeService.deleteNode(node.nodeId).subscribe({
      next: () => {
        this.toastr.success('Node deleted successfully');
        this.loadNodes();
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Failed to delete node'
        );
      },
    });
  }
}