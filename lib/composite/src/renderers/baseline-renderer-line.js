"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererBaselineLine = void 0;
const gradient_style_cache_1 = require("./gradient-style-cache");
const line_renderer_base_1 = require("./line-renderer-base");
class PaneRendererBaselineLine extends line_renderer_base_1.PaneRendererLineBase {
    constructor() {
        super(...arguments);
        this._strokeCache = new gradient_style_cache_1.GradientStyleCache();
    }
    _strokeStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._data;
        return this._strokeCache.get(renderingScope, {
            topColor1: item.topLineColor,
            topColor2: item.topLineColor,
            bottomColor1: item.bottomLineColor,
            bottomColor2: item.bottomLineColor,
            bottom: renderingScope.bitmapSize.height,
            baseLevelCoordinate: data.baseLevelCoordinate,
        });
    }
}
exports.PaneRendererBaselineLine = PaneRendererBaselineLine;
