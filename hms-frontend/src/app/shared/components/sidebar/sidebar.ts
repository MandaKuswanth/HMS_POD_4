import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private authService = inject(AuthService);
  private router = inject(Router);

  role = this.authService.getRole();

  isAdminOrTechnician(): boolean {
    return this.authService.isAdminOrTechnician();
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}