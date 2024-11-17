import { ensureNotNull } from '../helpers/assertions';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { setLineStyle, strokeInPixel } from './draw-line';
export class GridRenderer extends BitmapCoordinatesPaneRenderer {
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
        strokeInPixel(ctx, () => {
            const data = ensureNotNull(this._data);
            if (data.vertLinesVisible) {
                ctx.strokeStyle = data.vertLinesColor;
                setLineStyle(ctx, data.vertLineStyle);
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
                setLineStyle(ctx, data.horzLineStyle);
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
