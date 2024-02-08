import { GradientStyleCache } from './gradient-style-cache';
import { PaneRendererLineBase } from './line-renderer-base';
export class PaneRendererBaselineLine extends PaneRendererLineBase {
    constructor() {
        super(...arguments);
        this._private__strokeCache = new GradientStyleCache();
    }
    _internal__strokeStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._internal__data;
        return this._private__strokeCache._internal_get(renderingScope, {
            _internal_topColor1: item._internal_topLineColor,
            _internal_topColor2: item._internal_topLineColor,
            _internal_bottomColor1: item._internal_bottomLineColor,
            _internal_bottomColor2: item._internal_bottomLineColor,
            _internal_bottom: renderingScope.bitmapSize.height,
            _internal_baseLevelCoordinate: data._internal_baseLevelCoordinate,
        });
    }
}
