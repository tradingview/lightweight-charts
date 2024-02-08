import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export class PaneRendererMarks extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._internal__data = null;
    }
    _internal_setData(data) {
        this._internal__data = data;
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._internal__data === null || this._internal__data._internal_visibleRange === null) {
            return;
        }
        const visibleRange = this._internal__data._internal_visibleRange;
        const data = this._internal__data;
        const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        const correction = (tickWidth % 2) / 2;
        const draw = (radiusMedia) => {
            ctx.beginPath();
            for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
                const point = data._internal_items[i];
                const centerX = Math.round(point._internal_x * horizontalPixelRatio) + correction; // correct x coordinate only
                const centerY = point._internal_y * verticalPixelRatio;
                const radius = radiusMedia * verticalPixelRatio + correction;
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            }
            ctx.fill();
        };
        if (data._internal_lineWidth > 0) {
            ctx.fillStyle = data._internal_backColor;
            draw(data._internal_radius + data._internal_lineWidth);
        }
        ctx.fillStyle = data._internal_lineColor;
        draw(data._internal_radius);
    }
}
