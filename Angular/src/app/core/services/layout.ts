import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  isSidebarOpen = signal<boolean>(true);

  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }
}
