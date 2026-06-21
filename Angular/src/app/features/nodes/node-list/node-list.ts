import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';

import { NodeService, NodeItem } from '../../../core/services/node';
import { ToastService } from '../../../shared/services/toast.service';
import { PageShell } from '../../../shared/components/page-shell/page-shell';
import { LoadingState } from '../../../shared/components/loading-state/loading-state';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-node-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    PageShell,
    LoadingState,
    EmptyState,
  ],
  templateUrl: './node-list.html',
  styleUrl: './node-list.scss',
})
export class NodeList implements OnInit {
  private readonly nodeService = inject(NodeService);
  private readonly toast = inject(ToastService);

  nodes: NodeItem[] = [];
  isLoading = false;
  displayedColumns = ['name', 'path', 'icon', 'permissions', 'order', 'status'];

  ngOnInit(): void {
    this.loadNodes();
  }

  loadNodes(): void {
    this.isLoading = true;
    this.nodeService.getNodes().subscribe({
      next: (res) => {
        this.nodes = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load menu nodes');
        this.isLoading = false;
      },
    });
  }
}
