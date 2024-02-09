"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridRenderer = void 0;
const assertions_1 = require("../helpers/assertions");
const bitmap_coordinates_pane_renderer_1 = require("./bitmap-coordinates-pane-renderer");
const draw_line_1 = require("./draw-line");
class GridRenderer extends bitmap_coordinates_pane_renderer_1.BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
    }
    setData(data) {
        this._data = data;
    }
    _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._data === null) {
            return;
        }
        const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        ctx.lineWidth = lineWidth;
        (0, draw_line_1.strokeInPixel)(ctx, () => {
            const data = (0, assertions_1.ensureNotNull)(this._data);
            if (data.vertLinesVisible) {
                ctx.strokeStyle = data.vertLinesColor;
                (0, draw_line_1.setLineStyle)(ctx, data.vertLineStyle);
                ctx.beginPath();
                for (const timeMark of data.timeMarks) {
                    const x = Math.round(timeMark.coord * horizontalPixelRatio);
                    ctx.moveTo(x, -lineWidth);
                    ctx.lineTo(x, bitmapSize.height + lineWidth);
                }
                ctx.stroke();
            }
            if (data.horzLinesVisible) {
                ctx.strokeStyle = data.horzLinesColor;
                (0, draw_line_1.setLineStyle)(ctx, data.horzLineStyle);
                ctx.beginPath();
                for (const priceMark of data.priceMarks) {
                    const y = Math.round(priceMark.coord * verticalPixelRatio);
                    ctx.moveTo(-lineWidth, y);
                    ctx.lineTo(bitmapSize.width + lineWidth, y);
                }
                ctx.stroke();
            }
        });
    }
}
exports.GridRenderer = GridRenderer;
