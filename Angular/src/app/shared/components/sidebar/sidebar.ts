import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth';
import { NodeService, MenuNode } from '../../../core/services/node';
import { LayoutService } from '../../../core/services/layout';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    HasPermissionDirective
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    '[class.collapsed]': '!layoutService.isSidebarOpen()'
  }
})
export class Sidebar implements OnInit {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly nodeService = inject(NodeService);
  public readonly layoutService = inject(LayoutService);

  readonly menuNodes = signal<MenuNode[]>([]);
  readonly menuOpenState = signal<Record<string, boolean>>({});

  private readonly navEndEvent = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    )
  );

  readonly currentUrl = computed(() => {
    return this.navEndEvent()?.urlAfterRedirects || this.router.url;
  });

  ngOnInit() {
    this.nodeService.getMyMenu().subscribe({
      next: (res) => {
        const menu = res?.data?.menu || [];
        this.menuNodes.set(menu);
        
        // Initialize open state for all parent nodes to true initially for better UX, or closed if preferred.
        const state: Record<string, boolean> = {};
        menu.forEach((node: MenuNode) => {
           state[node.name] = true;
        });
        this.menuOpenState.set(state);
      },
      error: (err) => console.error('Failed to load menu nodes', err)
    });
  }

  toggleGroup(groupName: string): void {
    this.menuOpenState.update((state) => ({
      ...state,
      [groupName]: !state[groupName]
    }));
  }
}