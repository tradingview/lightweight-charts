import { GradientStyleCache } from './gradient-style-cache';
import { PaneRendererLineBase } from './line-renderer-base';
export class PaneRendererBaselineLine extends PaneRendererLineBase {
    constructor() {
        super(...arguments);
        this._strokeCache = new GradientStyleCache();
    }
    _strokeStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._data;
        return this._strokeCache.get(renderingScope, {
            topColor1: item.topLineColor,
            topColor2: item.topLineColor,
            bottomColor1: item.bottomLineColor,
            bottomColor2: item.bottomLineColor,
            bottom: renderingScope.bitmapSize.height,
            baseLevelCoordinate: data.baseLevelCoordinate,
        });
    }
}
