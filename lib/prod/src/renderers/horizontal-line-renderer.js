import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { drawHorizontalLine, setLineStyle } from './draw-line';
;
export class HorizontalLineRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal_hitTest(x, y) {
        var _a;
        if (!((_a = this._private__data) === null || _a === void 0 ? void 0 : _a._internal_visible)) {
            return null;
        }
        const { _internal_y: itemY, _internal_lineWidth: lineWidth, _internal_externalId: externalId } = this._private__data;
        // add a fixed area threshold around line (Y + width) for hit test
        if (y >= itemY - lineWidth - 7 /* Constants.HitTestThreshold */ && y <= itemY + lineWidth + 7 /* Constants.HitTestThreshold */) {
            return {
                _internal_hitTestData: this._private__data,
                _internal_externalId: externalId,
            };
        }
        return null;
    }
    _internal__drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null) {
            return;
        }
        if (this._private__data._internal_visible === false) {
            return;
        }
        const y = Math.round(this._private__data._internal_y * verticalPixelRatio);
        if (y < 0 || y > bitmapSize.height) {
            return;
        }
        ctx.lineCap = 'butt';
        ctx.strokeStyle = this._private__data._internal_color;
        ctx.lineWidth = Math.floor(this._private__data._internal_lineWidth * horizontalPixelRatio);
        setLineStyle(ctx, this._private__data._internal_lineStyle);
        drawHorizontalLine(ctx, y, 0, bitmapSize.width);
    }
}
