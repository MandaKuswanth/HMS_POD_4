import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [Navbar, Sidebar],
  template: `
    <app-navbar></app-navbar>
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="content">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styleUrl: './page-shell.scss',
})
export class PageShell {}
