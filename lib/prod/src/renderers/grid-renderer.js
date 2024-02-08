import { ensureNotNull } from '../helpers/assertions';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { setLineStyle, strokeInPixel } from './draw-line';
export class GridRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal__drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null) {
            return;
        }
        const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        ctx.lineWidth = lineWidth;
        strokeInPixel(ctx, () => {
            const data = ensureNotNull(this._private__data);
            if (data._internal_vertLinesVisible) {
                ctx.strokeStyle = data._internal_vertLinesColor;
                setLineStyle(ctx, data._internal_vertLineStyle);
                ctx.beginPath();
                for (const timeMark of data._internal_timeMarks) {
                    const x = Math.round(timeMark._internal_coord * horizontalPixelRatio);
                    ctx.moveTo(x, -lineWidth);
                    ctx.lineTo(x, bitmapSize.height + lineWidth);
                }
                ctx.stroke();
            }
            if (data._internal_horzLinesVisible) {
                ctx.strokeStyle = data._internal_horzLinesColor;
                setLineStyle(ctx, data._internal_horzLineStyle);
                ctx.beginPath();
                for (const priceMark of data._internal_priceMarks) {
                    const y = Math.round(priceMark._internal_coord * verticalPixelRatio);
                    ctx.moveTo(-lineWidth, y);
                    ctx.lineTo(bitmapSize.width + lineWidth, y);
                }
                ctx.stroke();
            }
        });
    }
}
