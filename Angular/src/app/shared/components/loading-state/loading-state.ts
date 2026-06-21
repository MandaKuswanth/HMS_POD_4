import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-state" [class.inline]="inline">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      @if (message) {
        <p>{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      gap: 16px;
      color: #666;
    }

    .loading-state.inline {
      padding: 24px;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class LoadingState {
  @Input() message = 'Loading...';
  @Input() diameter = 40;
  @Input() inline = false;
}
