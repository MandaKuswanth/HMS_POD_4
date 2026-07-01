import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maincomponent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maincomponent.html',
  styleUrl: './maincomponent.css',
  encapsulation: ViewEncapsulation.None
})
export class MainComponent {
  @Input() title = '';
  @Input() recordCount: number | string = 0;
  @Input() toolbarColumns = 'minmax(260px, 1fr) auto';
}