import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export class SeriesLastPriceAnimationRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal_data() {
        return this._private__data;
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        const data = this._private__data;
        if (data === null) {
            return;
        }
        const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        const correction = (tickWidth % 2) / 2;
        const centerX = Math.round(data._internal_center.x * horizontalPixelRatio) + correction; // correct x coordinate only
        const centerY = data._internal_center.y * verticalPixelRatio;
        ctx.fillStyle = data._internal_seriesLineColor;
        ctx.beginPath();
        // TODO: it is better to have different horizontal and vertical radii
        const centerPointRadius = Math.max(2, data._internal_seriesLineWidth * 1.5) * horizontalPixelRatio;
        ctx.arc(centerX, centerY, centerPointRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.fillStyle = data._internal_fillColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data._internal_radius * horizontalPixelRatio, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = tickWidth;
        ctx.strokeStyle = data._internal_strokeColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data._internal_radius * horizontalPixelRatio + tickWidth / 2, 0, 2 * Math.PI, false);
        ctx.stroke();
    }
}
