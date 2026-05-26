import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_TOOLTIP_SCROLL_STRATEGY,
  MatTooltip,
  SCROLL_THROTTLE_MS,
  TOOLTIP_PANEL_CLASS,
  TooltipComponent,
  getMatTooltipInvalidPositionError
} from "./chunk-W2ILBXRT.js";
import {
  OverlayModule
} from "./chunk-VTXWG3TN.js";
import "./chunk-MFRXVG6Q.js";
import {
  A11yModule
} from "./chunk-CAZEPHEV.js";
import "./chunk-CWLUHQCR.js";
import "./chunk-GWBU7KI5.js";
import "./chunk-PLJ2QXBA.js";
import "./chunk-N4DOILP3.js";
import "./chunk-GNTJUIYF.js";
import "./chunk-WCERWHAK.js";
import {
  CdkScrollableModule
} from "./chunk-VMUZU7OH.js";
import "./chunk-EMZ5E5WN.js";
import "./chunk-GUGIMSVJ.js";
import {
  BidiModule
} from "./chunk-YYUC6QS3.js";
import "./chunk-NDDL2MTZ.js";
import "./chunk-IZCVRZB2.js";
import "./chunk-XZHTRGLQ.js";
import "./chunk-VZFU32IF.js";
import "./chunk-X6OMYMPU.js";
import "./chunk-EITXNJPM.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-A7HD4W5G.js";
import "./chunk-PJVWDKLX.js";

// node_modules/@angular/material/fesm2022/tooltip.mjs
var MatTooltipModule = class _MatTooltipModule {
  static ɵfac = function MatTooltipModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatTooltipModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatTooltipModule,
    imports: [A11yModule, OverlayModule, MatTooltip, TooltipComponent],
    exports: [MatTooltip, TooltipComponent, BidiModule, CdkScrollableModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [A11yModule, OverlayModule, BidiModule, CdkScrollableModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTooltipModule, [{
    type: NgModule,
    args: [{
      imports: [A11yModule, OverlayModule, MatTooltip, TooltipComponent],
      exports: [MatTooltip, TooltipComponent, BidiModule, CdkScrollableModule]
    }]
  }], null, null);
})();
export {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_TOOLTIP_SCROLL_STRATEGY,
  MatTooltip,
  MatTooltipModule,
  SCROLL_THROTTLE_MS,
  TOOLTIP_PANEL_CLASS,
  TooltipComponent,
  getMatTooltipInvalidPositionError
};
//# sourceMappingURL=@angular_material_tooltip.js.map
