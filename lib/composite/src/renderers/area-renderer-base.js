"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererAreaBase = void 0;
const bitmap_coordinates_pane_renderer_1 = require("./bitmap-coordinates-pane-renderer");
const draw_line_1 = require("./draw-line");
const walk_line_1 = require("./walk-line");
function finishStyledArea(baseLevelCoordinate, scope, style, areaFirstItem, newAreaFirstItem) {
    const { context, horizontalPixelRatio, verticalPixelRatio } = scope;
    context.lineTo(newAreaFirstItem.x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.lineTo(areaFirstItem.x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.closePath();
    context.fillStyle = style;
    context.fill();
}
class PaneRendererAreaBase extends bitmap_coordinates_pane_renderer_1.BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
    }
    setData(data) {
        this._data = data;
    }
    _drawImpl(renderingScope) {
        var _a;
        if (this._data === null) {
            return;
        }
        const { items, visibleRange, barWidth, lineWidth, lineStyle, lineType } = this._data;
        const baseLevelCoordinate = (_a = this._data.baseLevelCoordinate) !== null && _a !== void 0 ? _a : (this._data.invertFilledArea ? 0 : renderingScope.mediaSize.height);
        if (visibleRange === null) {
            return;
        }
        const ctx = renderingScope.context;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;
        (0, draw_line_1.setLineStyle)(ctx, lineStyle);
        // walk lines with width=1 to have more accurate gradient's filling
        ctx.lineWidth = 1;
        (0, walk_line_1.walkLine)(renderingScope, items, lineType, visibleRange, barWidth, this._fillStyle.bind(this), finishStyledArea.bind(null, baseLevelCoordinate));
    }
}
exports.PaneRendererAreaBase = PaneRendererAreaBase;
