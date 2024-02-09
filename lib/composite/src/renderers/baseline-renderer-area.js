"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererBaselineArea = void 0;
const area_renderer_base_1 = require("./area-renderer-base");
const gradient_style_cache_1 = require("./gradient-style-cache");
class PaneRendererBaselineArea extends area_renderer_base_1.PaneRendererAreaBase {
    constructor() {
        super(...arguments);
        this._fillCache = new gradient_style_cache_1.GradientStyleCache();
    }
    _fillStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._data;
        return this._fillCache.get(renderingScope, {
            topColor1: item.topFillColor1,
            topColor2: item.topFillColor2,
            bottomColor1: item.bottomFillColor1,
            bottomColor2: item.bottomFillColor2,
            bottom: renderingScope.bitmapSize.height,
            baseLevelCoordinate: data.baseLevelCoordinate,
        });
    }
}
exports.PaneRendererBaselineArea = PaneRendererBaselineArea;
