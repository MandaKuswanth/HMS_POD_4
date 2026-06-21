import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() totalRecords = 0;
  @Input() limit = 10;
  @Input() hasNextPage = false;
  @Input() hasPreviousPage = false;

  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();

  get startRecord(): number {
    if (this.totalRecords === 0) return 0;
    return (this.page - 1) * this.limit + 1;
  }

  get endRecord(): number {
    return Math.min(this.page * this.limit, this.totalRecords);
  }
}
