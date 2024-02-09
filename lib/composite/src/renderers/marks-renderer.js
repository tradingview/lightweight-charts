"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererMarks = void 0;
const bitmap_coordinates_pane_renderer_1 = require("./bitmap-coordinates-pane-renderer");
class PaneRendererMarks extends bitmap_coordinates_pane_renderer_1.BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
    }
    setData(data) {
        this._data = data;
    }
    _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._data === null || this._data.visibleRange === null) {
            return;
        }
        const visibleRange = this._data.visibleRange;
        const data = this._data;
        const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        const correction = (tickWidth % 2) / 2;
        const draw = (radiusMedia) => {
            ctx.beginPath();
            for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
                const point = data.items[i];
                const centerX = Math.round(point.x * horizontalPixelRatio) + correction; // correct x coordinate only
                const centerY = point.y * verticalPixelRatio;
                const radius = radiusMedia * verticalPixelRatio + correction;
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            }
            ctx.fill();
        };
        if (data.lineWidth > 0) {
            ctx.fillStyle = data.backColor;
            draw(data.radius + data.lineWidth);
        }
        ctx.fillStyle = data.lineColor;
        draw(data.radius);
    }
}
exports.PaneRendererMarks = PaneRendererMarks;
