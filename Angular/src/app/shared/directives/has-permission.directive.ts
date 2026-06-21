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

  @Input('appHasPermission') permission!: string | string[];
  @Input() appHasPermissionMode: 'any' | 'all' = 'any';

  ngOnChanges(): void {
    this.updateView();
  }

  private updateView(): void {
    if (!this.permission) {
      this.viewContainer.clear();
      return;
    }

    const permissions = Array.isArray(this.permission)
      ? this.permission
      : [this.permission];

    const allowed = this.appHasPermissionMode === 'all'
      ? this.authService.hasAllPermissions(permissions)
      : this.authService.hasAnyPermission(permissions);

    this.viewContainer.clear();

    if (allowed) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
