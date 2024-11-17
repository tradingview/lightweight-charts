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
        this._data = null;
    }
    setData(data) {
        this._data = data;
    }
    _drawImpl(renderingScope) {
        if (this._data === null) {
            return;
        }
        const { items, visibleRange, barWidth, lineType, lineWidth, lineStyle, pointMarkersRadius } = this._data;
        if (visibleRange === null) {
            return;
        }
        const ctx = renderingScope.context;
        ctx.lineCap = 'butt';
        ctx.lineWidth = lineWidth * renderingScope.verticalPixelRatio;
        setLineStyle(ctx, lineStyle);
        ctx.lineJoin = 'round';
        const styleGetter = this._strokeStyle.bind(this);
        if (lineType !== undefined) {
            walkLine(renderingScope, items, lineType, visibleRange, barWidth, styleGetter, finishStyledArea);
        }
        if (pointMarkersRadius) {
            drawSeriesPointMarkers(renderingScope, items, pointMarkersRadius, visibleRange, styleGetter);
        }
    }
}
