import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  permission: string;
}

export interface MenuGroup {
  name: string;
  icon: string;
  items: MenuItem[];
  permission: string;
}

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
})
export class Sidebar {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  // Group open/close states
  readonly menuOpenState = signal<Record<string, boolean>>({
    'User & Staff': true,
    'Patient Care': true,
    'System Setup': false
  });

  // Track active URL reactively using signals
  private readonly navEndEvent = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    )
  );

  readonly currentUrl = computed(() => {
    return this.navEndEvent()?.urlAfterRedirects || this.router.url;
  });

  // Static structure of role-based menu items
  readonly menuGroups: MenuGroup[] = [
    {
      name: 'User & Staff',
      icon: 'groups',
      permission: 'EMPLOYEE_READ',
      items: [
        { name: 'All Employees', path: '/employees', icon: 'badge', permission: 'EMPLOYEE_READ' },
        { name: 'Pending Approvals', path: '/pending-employees', icon: 'rule', permission: 'EMPLOYEE_APPROVE' }
      ]
    },
    {
      name: 'Patient Care',
      icon: 'healing',
      permission: 'PATIENT_READ',
      items: [
        { name: 'All Patients', path: '/patients', icon: 'person_search', permission: 'PATIENT_READ' },
        { name: 'Appointments', path: '/appointments', icon: 'event', permission: 'APPOINTMENT_READ' },
        { name: 'Health Records', path: '/health-records', icon: 'description', permission: 'HEALTH_RECORD_READ' }
      ]
    },
    {
      name: 'System Setup',
      icon: 'settings',
      permission: 'ROLE_READ',
      items: [
        { name: 'Roles & RBAC', path: '/roles', icon: 'admin_panel_settings', permission: 'ROLE_READ' },
        { name: 'Menu Nodes', path: '/nodes', icon: 'account_tree', permission: 'NODE_READ' }
      ]
    }
  ];

  toggleGroup(groupName: string): void {
    this.menuOpenState.update((state) => ({
      ...state,
      [groupName]: !state[groupName]
    }));
  }
}