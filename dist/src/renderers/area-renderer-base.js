import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { setLineStyle } from './draw-line';
import { walkLine } from './walk-line';
function finishStyledArea(baseLevelCoordinate, scope, style, areaFirstItem, newAreaFirstItem) {
    const { context, horizontalPixelRatio, verticalPixelRatio } = scope;
    context.lineTo(newAreaFirstItem.x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.lineTo(areaFirstItem.x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.closePath();
    context.fillStyle = style;
    context.fill();
}
export class PaneRendererAreaBase extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
    }
    setData(data) {
        this._data = data;
    }
    _drawImpl(renderingScope) {
        var _a;
        if (this._data === null) {
            return;
        }
        const { items, visibleRange, barWidth, lineWidth, lineStyle, lineType } = this._data;
        const baseLevelCoordinate = (_a = this._data.baseLevelCoordinate) !== null && _a !== void 0 ? _a : (this._data.invertFilledArea ? 0 : renderingScope.mediaSize.height);
        if (visibleRange === null) {
            return;
        }
        const ctx = renderingScope.context;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;
        setLineStyle(ctx, lineStyle);
        // walk lines with width=1 to have more accurate gradient's filling
        ctx.lineWidth = 1;
        walkLine(renderingScope, items, lineType, visibleRange, barWidth, this._fillStyle.bind(this), finishStyledArea.bind(null, baseLevelCoordinate));
    }
}
