"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrosshairRenderer = void 0;
const bitmap_coordinates_pane_renderer_1 = require("./bitmap-coordinates-pane-renderer");
const draw_line_1 = require("./draw-line");
class CrosshairRenderer extends bitmap_coordinates_pane_renderer_1.BitmapCoordinatesPaneRenderer {
    constructor(data) {
        super();
        this._data = data;
    }
    _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._data === null) {
            return;
        }
        const vertLinesVisible = this._data.vertLine.visible;
        const horzLinesVisible = this._data.horzLine.visible;
        if (!vertLinesVisible && !horzLinesVisible) {
            return;
        }
        const x = Math.round(this._data.x * horizontalPixelRatio);
        const y = Math.round(this._data.y * verticalPixelRatio);
        ctx.lineCap = 'butt';
        if (vertLinesVisible && x >= 0) {
            ctx.lineWidth = Math.floor(this._data.vertLine.lineWidth * horizontalPixelRatio);
            ctx.strokeStyle = this._data.vertLine.color;
            ctx.fillStyle = this._data.vertLine.color;
            (0, draw_line_1.setLineStyle)(ctx, this._data.vertLine.lineStyle);
            (0, draw_line_1.drawVerticalLine)(ctx, x, 0, bitmapSize.height);
        }
        if (horzLinesVisible && y >= 0) {
            ctx.lineWidth = Math.floor(this._data.horzLine.lineWidth * verticalPixelRatio);
            ctx.strokeStyle = this._data.horzLine.color;
            ctx.fillStyle = this._data.horzLine.color;
            (0, draw_line_1.setLineStyle)(ctx, this._data.horzLine.lineStyle);
            (0, draw_line_1.drawHorizontalLine)(ctx, y, 0, bitmapSize.width);
        }
    }
}
exports.CrosshairRenderer = CrosshairRenderer;
