import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth';  // FIX: removed extra /app/

@Directive({
    selector: '[appHasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit {
    private authService = inject(AuthService);
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);

    @Input('appHasPermission') permission!: string;

    ngOnInit() {
        if (this.authService.hasPermission(this.permission)) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
            this.viewContainer.clear();
        }
    }
}