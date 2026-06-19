import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

import { AuthService } from '../../../core/services/auth';
import { NodeService, MenuNode } from '../../../core/services/node';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly nodeService = inject(NodeService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  menuItems: MenuNode[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.buildDynamicMenu();
  }

  private buildDynamicMenu(): void {
    this.nodeService.getMyMenu().subscribe({
      next: (res) => {
        // Backend already filters by permission and returns a sorted tree
        // res.menu is the nested array from your buildMenuTree() function
        this.menuItems = res.menu;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load menu', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}