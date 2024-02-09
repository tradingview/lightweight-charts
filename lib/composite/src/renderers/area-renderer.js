"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererArea = void 0;
const area_renderer_base_1 = require("./area-renderer-base");
const gradient_style_cache_1 = require("./gradient-style-cache");
class PaneRendererArea extends area_renderer_base_1.PaneRendererAreaBase {
    constructor() {
        super(...arguments);
        this._fillCache = new gradient_style_cache_1.GradientStyleCache();
    }
    _fillStyle(renderingScope, item) {
        return this._fillCache.get(renderingScope, {
            topColor1: item.topColor,
            topColor2: '',
            bottomColor1: '',
            bottomColor2: item.bottomColor,
            bottom: renderingScope.bitmapSize.height,
        });
    }
}
exports.PaneRendererArea = PaneRendererArea;
