import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

import { AuthService } from '../../../core/services/auth';
// Assuming you have an HTTP service to fetch the nodes from the backend
import { NodeService } from '../../../core/services/node';

export interface MenuNode {
  name: string;
  path: string;
  icon: string;
  permissions: string[];
  order: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatRippleModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly nodeService = inject(NodeService); // Your API service
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  menuItems: MenuNode[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.buildDynamicMenu();
  }


  private buildDynamicMenu(): void {
    this.nodeService.getActiveNodes().subscribe({
      next: (response: any) => {
        // FIX: Point directly to response.data, not response.data.menu
        const menuArray = response?.data || [];

        console.log("DEBUG - Corrected Menu Array:", menuArray);

        if (!Array.isArray(menuArray)) {
          console.error("Error: 'data' is not an array. Check your API response.");
          this.menuItems = [];
        } else {
          // Now filtering will work because menuArray is the actual array of nodes
          this.menuItems = menuArray
            .filter(node =>
              // Ensure node.permissions exists before checking
              node.permissions && node.permissions.some((p: string) => this.authService.hasPermission(p))
            )
            .sort((a: any, b: any) => a.order - b.order);
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load menu nodes', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}