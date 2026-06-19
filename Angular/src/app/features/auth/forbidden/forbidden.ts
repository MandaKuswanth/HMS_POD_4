import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Component({
    selector: 'app-forbidden',
    standalone: true,
    template: `
    <div class="forbidden-container">
      <div class="forbidden-card">
        <div class="error-code">403</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p class="sub">Contact your administrator if you believe this is a mistake.</p>
        <button (click)="goBack()">Go to Dashboard</button>
      </div>
    </div>
  `,
    styles: [`
    .forbidden-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f5f5f5;
    }
    .forbidden-card {
      text-align: center;
      background: white;
      padding: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .error-code {
      font-size: 80px;
      font-weight: 700;
      color: #e53e3e;
      line-height: 1;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    p {
      color: #666;
      margin-bottom: 4px;
    }
    .sub {
      font-size: 13px;
      color: #999;
      margin-bottom: 32px;
    }
    button {
      background: #3182ce;
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 15px;
      cursor: pointer;
    }
    button:hover {
      background: #2b6cb0;
    }
  `]
})
export class Forbidden {
    private router = inject(Router);

    goBack() {
        this.router.navigate(['/dashboard']);
    }
}