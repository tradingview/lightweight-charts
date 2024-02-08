import { PaneRendererAreaBase } from './area-renderer-base';
import { GradientStyleCache } from './gradient-style-cache';
export class PaneRendererBaselineArea extends PaneRendererAreaBase {
    constructor() {
        super(...arguments);
        this._private__fillCache = new GradientStyleCache();
    }
    _internal__fillStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._internal__data;
        return this._private__fillCache._internal_get(renderingScope, {
            _internal_topColor1: item._internal_topFillColor1,
            _internal_topColor2: item._internal_topFillColor2,
            _internal_bottomColor1: item._internal_bottomFillColor1,
            _internal_bottomColor2: item._internal_bottomFillColor2,
            _internal_bottom: renderingScope.bitmapSize.height,
            _internal_baseLevelCoordinate: data._internal_baseLevelCoordinate,
        });
    }
}
