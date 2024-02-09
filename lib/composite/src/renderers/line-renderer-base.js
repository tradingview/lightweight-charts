"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererLineBase = void 0;
const bitmap_coordinates_pane_renderer_1 = require("./bitmap-coordinates-pane-renderer");
const draw_line_1 = require("./draw-line");
const draw_series_point_markers_1 = require("./draw-series-point-markers");
const walk_line_1 = require("./walk-line");
function finishStyledArea(scope, style) {
    const ctx = scope.context;
    ctx.strokeStyle = style;
    ctx.stroke();
}
class PaneRendererLineBase extends bitmap_coordinates_pane_renderer_1.BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
    }
    setData(data) {
        this._data = data;
    }
    _drawImpl(renderingScope) {
        if (this._data === null) {
            return;
        }
        const { items, visibleRange, barWidth, lineType, lineWidth, lineStyle, pointMarkersRadius } = this._data;
        if (visibleRange === null) {
            return;
        }
        const ctx = renderingScope.context;
        ctx.lineCap = 'butt';
        ctx.lineWidth = lineWidth * renderingScope.verticalPixelRatio;
        (0, draw_line_1.setLineStyle)(ctx, lineStyle);
        ctx.lineJoin = 'round';
        const styleGetter = this._strokeStyle.bind(this);
        if (lineType !== undefined) {
            (0, walk_line_1.walkLine)(renderingScope, items, lineType, visibleRange, barWidth, styleGetter, finishStyledArea);
        }
        if (pointMarkersRadius) {
            (0, draw_series_point_markers_1.drawSeriesPointMarkers)(renderingScope, items, pointMarkersRadius, visibleRange, styleGetter);
        }
    }
}
exports.PaneRendererLineBase = PaneRendererLineBase;
