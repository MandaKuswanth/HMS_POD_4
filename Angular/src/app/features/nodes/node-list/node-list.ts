import { Component, OnInit, inject, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';

import { ToastrService } from 'ngx-toastr';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { NodeService } from '../../../core/services/node';
import { NodeDialog } from '../node-dialog/node-dialog';

@Component({
  selector: 'app-node-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './node-list.html',
  styleUrl: './node-list.css',
})
export class NodeList implements OnInit {
  private readonly nodeService = inject(NodeService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  readonly pageSizeOptions = [5, 10, 25, 50];

  displayedColumns: string[] = [
    'nodeId',
    'name',
    'path',
    'icon',
    'order',
    'status',
    'actions',
  ];

  // Signal States
  readonly nodesSignal = signal<any[]>([]);
  readonly totalSignal = signal(0);
  readonly pageSignal = signal(0); // 0-indexed
  readonly limitSignal = signal(5);
  readonly loadingSignal = signal(false);

  readonly searchTextSignal = signal('');
  readonly refreshSignal = signal(0);

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe((val) => {
      this.searchTextSignal.set(val);
      this.pageSignal.set(0);
    });

    // Reactive load effect
    effect(() => {
      const page = this.pageSignal() + 1;
      const limit = this.limitSignal();
      const search = this.searchTextSignal();
      const refresh = this.refreshSignal();

      this.loadNodes(page, limit, search);
    });
  }

  ngOnInit(): void {}

  loadNodes(page: number, limit: number, search: string): void {
    this.loadingSignal.set(true);
    this.nodeService
      .getNodes(page, limit, search)
      .subscribe({
        next: (response: any) => {
          this.loadingSignal.set(false);
          const nodes = Array.isArray(response?.data)
            ? response.data
            : (Array.isArray(response?.data?.records) ? response.data.records : []);

          this.nodesSignal.set(nodes);
          this.totalSignal.set(response?.pagination?.totalItems || response?.data?.pagination?.totalRecords || 0);
        },
        error: (err) => {
          this.loadingSignal.set(false);
          console.error('NODE LIST ERROR:', err);
          this.nodesSignal.set([]);
          this.totalSignal.set(0);
          this.toastr.error('Failed to load nodes');
        },
      });
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  clearSearch(): void {
    this.searchTextSignal.set('');
    this.pageSignal.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageSignal.set(event.pageIndex);
    this.limitSignal.set(event.pageSize);
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
        this.pageSignal.set(0);
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
        this.refreshSignal.update(v => v + 1);
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
        this.pageSignal.set(0);
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Failed to delete node'
        );
      },
    });
  }
}