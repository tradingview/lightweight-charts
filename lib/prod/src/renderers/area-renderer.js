import { PaneRendererAreaBase } from './area-renderer-base';
import { GradientStyleCache } from './gradient-style-cache';
export class PaneRendererArea extends PaneRendererAreaBase {
    constructor() {
        super(...arguments);
        this._private__fillCache = new GradientStyleCache();
    }
    _internal__fillStyle(renderingScope, item) {
        return this._private__fillCache._internal_get(renderingScope, {
            _internal_topColor1: item._internal_topColor,
            _internal_topColor2: '',
            _internal_bottomColor1: '',
            _internal_bottomColor2: item._internal_bottomColor,
            _internal_bottom: renderingScope.bitmapSize.height,
        });
    }
}
