"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradientStyleCache = void 0;
const mathex_1 = require("../helpers/mathex");
class GradientStyleCache {
    get(scope, params) {
        const cachedParams = this._params;
        const { topColor1, topColor2, bottomColor1, bottomColor2, bottom, baseLevelCoordinate } = params;
        if (this._cachedValue === undefined ||
            cachedParams === undefined ||
            cachedParams.topColor1 !== topColor1 ||
            cachedParams.topColor2 !== topColor2 ||
            cachedParams.bottomColor1 !== bottomColor1 ||
            cachedParams.bottomColor2 !== bottomColor2 ||
            cachedParams.baseLevelCoordinate !== baseLevelCoordinate ||
            cachedParams.bottom !== bottom) {
            const gradient = scope.context.createLinearGradient(0, 0, 0, bottom);
            gradient.addColorStop(0, topColor1);
            if (baseLevelCoordinate != null) {
                const baselinePercent = (0, mathex_1.clamp)(baseLevelCoordinate * scope.verticalPixelRatio / bottom, 0, 1);
                gradient.addColorStop(baselinePercent, topColor2);
                gradient.addColorStop(baselinePercent, bottomColor1);
            }
            gradient.addColorStop(1, bottomColor2);
            this._cachedValue = gradient;
            this._params = params;
        }
        return this._cachedValue;
    }
}
exports.GradientStyleCache = GradientStyleCache;
