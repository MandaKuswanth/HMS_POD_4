import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  input
} from '@angular/core';
import { AuthService } from '../../core/services/auth';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  // Signal input for the permission name
  appHasPermission = input.required<string>();

  constructor() {
    effect(() => {
      const permission = this.appHasPermission();
      this.viewContainer.clear();
      
      if (permission && this.authService.hasPermission(permission)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}