import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  get primaryRole(): string {
    const user = this.authService.getUser();
    // Return the name of the first role, or 'USER' as a fallback
    return user?.roles?.[0]?.name ?? 'USER';
  }

  logout(): void {
    this.authService.logout();
    this.toast.success('Logged out successfully');
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}