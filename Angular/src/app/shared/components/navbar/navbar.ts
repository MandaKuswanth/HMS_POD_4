import { Component, inject, signal, ElementRef, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  // Profile dropdown open state
  readonly isProfileOpenSignal = signal(false);

  // Derived user details from signals
  readonly currentUser = this.authService.user;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isProfileOpenSignal.set(false);
    }
  }

  toggleProfileMenu(): void {
    this.isProfileOpenSignal.update(val => !val);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
      },
      error: () => {
        // Fallback clear auth state if backend logout fails
        this.authService.clearAuthState();
      }
    });
  }

  viewProfile(): void {
    this.isProfileOpenSignal.set(false);
    this.router.navigate(['/profile']);
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}