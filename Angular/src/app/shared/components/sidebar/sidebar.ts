import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { MenuNode, NodeService } from '../../../core/services/node';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  private readonly nodeService = inject(NodeService);
  private readonly authService = inject(AuthService);

  // Signal — template re-renders automatically when this changes
  readonly menuItems = signal<MenuNode[]>([]);

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.nodeService.getMyMenu().subscribe({
      next: (res) => {
        this.menuItems.set(res?.data?.menu || []);
        this.authService.savePermissions(res?.data?.permissions || []);
      },
      error: (error) => {
        console.error('Failed to load menu', error);
        this.menuItems.set([]);
      },
    });
  }
}