import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { setLineStyle } from './draw-line';
import { drawSeriesPointMarkers } from './draw-series-point-markers';
import { walkLine } from './walk-line';
function finishStyledArea(scope, style) {
    const ctx = scope.context;
    ctx.strokeStyle = style;
    ctx.stroke();
}
export class PaneRendererLineBase extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._internal__data = null;
    }
    _internal_setData(data) {
        this._internal__data = data;
    }
    _internal__drawImpl(renderingScope) {
        if (this._internal__data === null) {
            return;
        }
        const { _internal_items: items, _internal_visibleRange: visibleRange, _internal_barWidth: barWidth, _internal_lineType: lineType, _internal_lineWidth: lineWidth, _internal_lineStyle: lineStyle, _internal_pointMarkersRadius: pointMarkersRadius } = this._internal__data;
        if (visibleRange === null) {
            return;
        }
        const ctx = renderingScope.context;
        ctx.lineCap = 'butt';
        ctx.lineWidth = lineWidth * renderingScope.verticalPixelRatio;
        setLineStyle(ctx, lineStyle);
        ctx.lineJoin = 'round';
        const styleGetter = this._internal__strokeStyle.bind(this);
        if (lineType !== undefined) {
            walkLine(renderingScope, items, lineType, visibleRange, barWidth, styleGetter, finishStyledArea);
        }
        if (pointMarkersRadius) {
            drawSeriesPointMarkers(renderingScope, items, pointMarkersRadius, visibleRange, styleGetter);
        }
    }
}
