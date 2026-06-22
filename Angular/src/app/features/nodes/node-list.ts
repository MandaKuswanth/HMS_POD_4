import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { NodeService } from '../../core/services/node';

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
    Navbar,
    Sidebar,
  ],
  templateUrl: './node-list.html',
  styleUrl: './node-list.css',
})
export class NodeList implements OnInit {
  private readonly nodeService = inject(NodeService);
  private readonly toastr = inject(ToastrService);

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  displayedColumns = [
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
          this.nodes = response?.data?.records || [];
          this.dataSource.data = this.nodes;

          this.totalRecords =
            response?.data?.pagination?.totalRecords || 0;
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to load nodes');
        },
      });
  }

  applyFilter(): void {
    const search = this.searchText.trim().toLowerCase();

    this.dataSource.data = this.nodes.filter(
      (node) =>
        node.nodeId?.toLowerCase().includes(search) ||
        node.name?.toLowerCase().includes(search) ||
        node.path?.toLowerCase().includes(search)
    );
  }

  clearSearch(): void {
    this.searchText = '';
    this.dataSource.data = this.nodes;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.loadNodes();
  }

  openAddDialog(): void {}

  openEditDialog(node: any): void {}

  deleteNode(node: any): void {}
}