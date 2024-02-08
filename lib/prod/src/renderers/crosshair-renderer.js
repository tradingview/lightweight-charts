import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { drawHorizontalLine, drawVerticalLine, setLineStyle } from './draw-line';
export class CrosshairRenderer extends BitmapCoordinatesPaneRenderer {
    constructor(data) {
        super();
        this._private__data = data;
    }
    _internal__drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null) {
            return;
        }
        const vertLinesVisible = this._private__data._internal_vertLine._internal_visible;
        const horzLinesVisible = this._private__data._internal_horzLine._internal_visible;
        if (!vertLinesVisible && !horzLinesVisible) {
            return;
        }
        const x = Math.round(this._private__data._internal_x * horizontalPixelRatio);
        const y = Math.round(this._private__data._internal_y * verticalPixelRatio);
        ctx.lineCap = 'butt';
        if (vertLinesVisible && x >= 0) {
            ctx.lineWidth = Math.floor(this._private__data._internal_vertLine._internal_lineWidth * horizontalPixelRatio);
            ctx.strokeStyle = this._private__data._internal_vertLine._internal_color;
            ctx.fillStyle = this._private__data._internal_vertLine._internal_color;
            setLineStyle(ctx, this._private__data._internal_vertLine._internal_lineStyle);
            drawVerticalLine(ctx, x, 0, bitmapSize.height);
        }
        if (horzLinesVisible && y >= 0) {
            ctx.lineWidth = Math.floor(this._private__data._internal_horzLine._internal_lineWidth * verticalPixelRatio);
            ctx.strokeStyle = this._private__data._internal_horzLine._internal_color;
            ctx.fillStyle = this._private__data._internal_horzLine._internal_color;
            setLineStyle(ctx, this._private__data._internal_horzLine._internal_lineStyle);
            drawHorizontalLine(ctx, y, 0, bitmapSize.width);
        }
    }
}
