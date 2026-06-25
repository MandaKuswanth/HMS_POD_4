import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnChanges,
  inject,
} from '@angular/core';

import { AuthService } from '../../core/services/auth';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnChanges {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  @Input('appHasPermission')
  permission = '';

  ngOnChanges(): void {
    this.viewContainer.clear();

    if (this.permission && this.authService.hasPermission(this.permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}