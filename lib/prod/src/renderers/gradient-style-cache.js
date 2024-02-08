import { clamp } from '../helpers/mathex';
export class GradientStyleCache {
    _internal_get(scope, params) {
        const cachedParams = this._private__params;
        const { _internal_topColor1: topColor1, _internal_topColor2: topColor2, _internal_bottomColor1: bottomColor1, _internal_bottomColor2: bottomColor2, _internal_bottom: bottom, _internal_baseLevelCoordinate: baseLevelCoordinate } = params;
        if (this._private__cachedValue === undefined ||
            cachedParams === undefined ||
            cachedParams._internal_topColor1 !== topColor1 ||
            cachedParams._internal_topColor2 !== topColor2 ||
            cachedParams._internal_bottomColor1 !== bottomColor1 ||
            cachedParams._internal_bottomColor2 !== bottomColor2 ||
            cachedParams._internal_baseLevelCoordinate !== baseLevelCoordinate ||
            cachedParams._internal_bottom !== bottom) {
            const gradient = scope.context.createLinearGradient(0, 0, 0, bottom);
            gradient.addColorStop(0, topColor1);
            if (baseLevelCoordinate != null) {
                const baselinePercent = clamp(baseLevelCoordinate * scope.verticalPixelRatio / bottom, 0, 1);
                gradient.addColorStop(baselinePercent, topColor2);
                gradient.addColorStop(baselinePercent, bottomColor1);
            }
            gradient.addColorStop(1, bottomColor2);
            this._private__cachedValue = gradient;
            this._private__params = params;
        }
        return this._private__cachedValue;
    }
}
