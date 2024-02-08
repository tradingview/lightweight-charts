import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { setLineStyle } from './draw-line';
import { walkLine } from './walk-line';
function finishStyledArea(baseLevelCoordinate, scope, style, areaFirstItem, newAreaFirstItem) {
    const { context, horizontalPixelRatio, verticalPixelRatio } = scope;
    context.lineTo(newAreaFirstItem._internal_x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.lineTo(areaFirstItem._internal_x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.closePath();
    context.fillStyle = style;
    context.fill();
}
export class PaneRendererAreaBase extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._internal__data = null;
    }
    _internal_setData(data) {
        this._internal__data = data;
    }
    _internal__drawImpl(renderingScope) {
        var _a;
        if (this._internal__data === null) {
            return;
        }
        const { _internal_items: items, _internal_visibleRange: visibleRange, _internal_barWidth: barWidth, _internal_lineWidth: lineWidth, _internal_lineStyle: lineStyle, _internal_lineType: lineType } = this._internal__data;
        const baseLevelCoordinate = (_a = this._internal__data._internal_baseLevelCoordinate) !== null && _a !== void 0 ? _a : (this._internal__data._internal_invertFilledArea ? 0 : renderingScope.mediaSize.height);
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
        walkLine(renderingScope, items, lineType, visibleRange, barWidth, this._internal__fillStyle.bind(this), finishStyledArea.bind(null, baseLevelCoordinate));
    }
}
