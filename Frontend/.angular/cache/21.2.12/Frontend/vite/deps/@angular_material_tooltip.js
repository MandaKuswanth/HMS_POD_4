import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_TOOLTIP_SCROLL_STRATEGY,
  MatTooltip,
  SCROLL_THROTTLE_MS,
  TOOLTIP_PANEL_CLASS,
  TooltipComponent,
  getMatTooltipInvalidPositionError
} from "./chunk-H5F2OD2F.js";
import {
  OverlayModule
} from "./chunk-Z6WFCT5D.js";
import {
  CdkScrollableModule
} from "./chunk-PZG7ITKJ.js";
import "./chunk-CDXO56XH.js";
import "./chunk-77RGRQME.js";
import {
  A11yModule
} from "./chunk-3J4UIZ3E.js";
import "./chunk-GWBU7KI5.js";
import "./chunk-PLJ2QXBA.js";
import "./chunk-3F5VAGHM.js";
import "./chunk-N4DOILP3.js";
import "./chunk-QSBR3ZYU.js";
import "./chunk-FBJKTYYR.js";
import "./chunk-GUGIMSVJ.js";
import "./chunk-URBRB3FA.js";
import "./chunk-ZVGVR3AY.js";
import "./chunk-FTGCW5VU.js";
import "./chunk-WZOTQR7I.js";
import "./chunk-EFQZFSF4.js";
import "./chunk-ZXGYWJMK.js";
import {
  BidiModule
} from "./chunk-FOZKJYTZ.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-FL7SXROJ.js";

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
