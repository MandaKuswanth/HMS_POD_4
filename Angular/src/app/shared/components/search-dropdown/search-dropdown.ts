import {
  Component,
  Input,
  forwardRef,
  signal,
  effect,
  ElementRef,
  HostListener,
  inject,
  ChangeDetectionStrategy,
  output
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, of, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search-dropdown',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-dropdown-container">
      <div class="input-wrapper">
        <input
          type="text"
          [placeholder]="placeholder"
          [formControl]="inputControl"
          (focus)="onFocus()"
          (keydown)="onKeyDown($event)"
          [disabled]="disabledSignal()"
          class="dropdown-input"
        />
        <div class="spinner-wrapper" *ngIf="loadingSignal()">
          <mat-spinner diameter="18"></mat-spinner>
        </div>
      </div>

      <div class="dropdown-list" *ngIf="isOpenSignal() && !disabledSignal()">
        <ng-container *ngIf="resultsSignal().length > 0; else noResults">
          <div
            *ngFor="let item of resultsSignal(); let i = index; trackBy: trackById"
            class="dropdown-item"
            [ngClass]="{ 'highlighted': i === highlightedIndexSignal() }"
            (click)="selectItem(item)"
            (mouseenter)="highlightedIndexSignal.set(i)"
          >
            {{ item[displayField] }}
          </div>
        </ng-container>
        <ng-template #noResults>
          <div class="no-results" *ngIf="!loadingSignal()">
            No results found
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }
    .search-dropdown-container {
      position: relative;
      width: 100%;
    }
    .input-wrapper {
      position: relative;
      width: 100%;
    }
    .dropdown-input {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 36px 10px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
      background-color: #fff;
    }
    .dropdown-input:focus {
      border-color: #3f51b5;
    }
    .dropdown-input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
    .spinner-wrapper {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
    }
    .dropdown-list {
      position: absolute;
      top: 105%;
      left: 0;
      width: 100%;
      max-height: 200px;
      overflow-y: auto;
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    .dropdown-item {
      padding: 10px 12px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
    }
    .dropdown-item.highlighted {
      background-color: #f5f5f5;
      color: #3f51b5;
    }
    .no-results {
      padding: 10px 12px;
      font-size: 14px;
      color: #888;
      font-style: italic;
    }
  `]
})
export class SearchDropdownComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  @Input() searchFn!: (query: string) => Observable<any>;
  @Input() displayField: string = 'name';
  @Input() valueField: string = '_id';
  @Input() placeholder: string = 'Search...';
  
  private _initialDisplay: string = '';
  @Input() set initialDisplay(val: string) {
    this._initialDisplay = val;
    if (val !== undefined && val !== null) {
      this.inputControl.setValue(val, { emitEvent: false });
    }
  }
  get initialDisplay(): string {
    return this._initialDisplay;
  }

  readonly selectionChange = output<any>();

  // Signals
  readonly resultsSignal = signal<any[]>([]);
  readonly loadingSignal = signal(false);
  readonly isOpenSignal = signal(false);
  readonly highlightedIndexSignal = signal(-1);
  readonly disabledSignal = signal(false);

  inputControl = new FormControl('');
  private readonly searchSubject = new Subject<string>();
  private selectedValue: any = null;

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingSignal.set(true)),
      switchMap((query) => {
        if (!this.isOpenSignal()) return of({ data: [] });
        return this.searchFn(query).pipe(
          catchError(() => of({ data: [] }))
        );
      }),
      takeUntilDestroyed()
    ).subscribe((res: any) => {
      this.loadingSignal.set(false);
      const items = res?.data || res || [];
      this.resultsSignal.set(items);
      this.highlightedIndexSignal.set(items.length > 0 ? 0 : -1);
    });

    // Reactive input changes
    this.inputControl.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe((val) => {
      const query = val || '';
      // Only trigger backend query if user is typing (i.e. selectItem was not just called)
      if (this.selectedValue && this.selectedValue[this.displayField] === query) {
        return;
      }
      this.searchSubject.next(query);
    });
  }

  // Click outside to close dropdown
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  onFocus(): void {
    this.isOpenSignal.set(true);
    this.searchSubject.next(this.inputControl.value || '');
  }

  closeDropdown(): void {
    this.isOpenSignal.set(false);
    this.highlightedIndexSignal.set(-1);
    // If closed without selection, restore previous label
    if (this.selectedValue) {
      this.inputControl.setValue(this.selectedValue[this.displayField], { emitEvent: false });
    } else {
      this.inputControl.setValue('', { emitEvent: false });
    }
  }

  selectItem(item: any): void {
    this.selectedValue = item;
    const label = item ? item[this.displayField] : '';
    const val = item ? item[this.valueField] : null;

    this.inputControl.setValue(label, { emitEvent: false });
    this.isOpenSignal.set(false);
    this.onChange(val);
    this.onTouched();
    this.selectionChange.emit(item);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpenSignal()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        this.isOpenSignal.set(true);
      }
      return;
    }

    const items = this.resultsSignal();
    const index = this.highlightedIndexSignal();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (items.length > 0) {
          const next = (index + 1) % items.length;
          this.highlightedIndexSignal.set(next);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (items.length > 0) {
          const prev = (index - 1 + items.length) % items.length;
          this.highlightedIndexSignal.set(prev);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (index >= 0 && index < items.length) {
          this.selectItem(items[index]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  trackById(index: number, item: any): any {
    return item[this.valueField] || index;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (!value) {
      this.selectedValue = null;
      this.inputControl.setValue('', { emitEvent: false });
      return;
    }

    if (this.selectedValue && this.selectedValue[this.valueField] === value) {
      return;
    }

    const found = this.resultsSignal().find((item) => item[this.valueField] === value);
    if (found) {
      this.selectedValue = found;
      this.inputControl.setValue(found[this.displayField], { emitEvent: false });
    } else {
      if (this.initialDisplay) {
        this.inputControl.setValue(this.initialDisplay, { emitEvent: false });
      }
      this.onChange(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledSignal.set(isDisabled);
    if (isDisabled) {
      this.inputControl.disable({ emitEvent: false });
    } else {
      this.inputControl.enable({ emitEvent: false });
    }
  }
}
