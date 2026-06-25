import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-account-inactive',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './account-inactive.html',
  styleUrl: './account-inactive.css'
})
export class AccountInactive {
  constructor(private readonly router: Router) { }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}