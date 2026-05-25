import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';

@Component({
  selector: 'app-account-inactive',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './account-inactive.html',
  styleUrls: ['./account-inactive.css']
})
export class AccountInactive {
  constructor(readonly router: Router) { }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
