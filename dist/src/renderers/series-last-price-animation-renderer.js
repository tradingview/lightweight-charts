import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export class SeriesLastPriceAnimationRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
    }
    setData(data) {
        this._data = data;
    }
    data() {
        return this._data;
    }
    _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        const data = this._data;
        if (data === null) {
            return;
        }
        const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        const correction = (tickWidth % 2) / 2;
        const centerX = Math.round(data.center.x * horizontalPixelRatio) + correction; // correct x coordinate only
        const centerY = data.center.y * verticalPixelRatio;
        ctx.fillStyle = data.seriesLineColor;
        ctx.beginPath();
        // TODO: it is better to have different horizontal and vertical radii
        const centerPointRadius = Math.max(2, data.seriesLineWidth * 1.5) * horizontalPixelRatio;
        ctx.arc(centerX, centerY, centerPointRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.fillStyle = data.fillColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data.radius * horizontalPixelRatio, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = tickWidth;
        ctx.strokeStyle = data.strokeColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data.radius * horizontalPixelRatio + tickWidth / 2, 0, 2 * Math.PI, false);
        ctx.stroke();
    }
}
