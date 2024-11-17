import { ensureDefined } from '../helpers/assertions';
const defaultReplacementRe = /[2-9]/g;
export class TextWidthCache {
    constructor(size = 50) {
        this._actualSize = 0;
        this._usageTick = 1;
        this._oldestTick = 1;
        this._tick2Labels = {};
        this._cache = new Map();
        this._maxSize = size;
    }
    reset() {
        this._actualSize = 0;
        this._cache.clear();
        this._usageTick = 1;
        this._oldestTick = 1;
        this._tick2Labels = {};
    }
    measureText(ctx, text, optimizationReplacementRe) {
        return this._getMetrics(ctx, text, optimizationReplacementRe).width;
    }
    yMidCorrection(ctx, text, optimizationReplacementRe) {
        const metrics = this._getMetrics(ctx, text, optimizationReplacementRe);
        // if actualBoundingBoxAscent/actualBoundingBoxDescent are not supported we use 0 as a fallback
        return ((metrics.actualBoundingBoxAscent || 0) - (metrics.actualBoundingBoxDescent || 0)) / 2;
    }
    _getMetrics(ctx, text, optimizationReplacementRe) {
        const re = optimizationReplacementRe || defaultReplacementRe;
        const cacheString = String(text).replace(re, '0');
        if (this._cache.has(cacheString)) {
            return ensureDefined(this._cache.get(cacheString)).metrics;
        }
        if (this._actualSize === this._maxSize) {
            const oldestValue = this._tick2Labels[this._oldestTick];
            delete this._tick2Labels[this._oldestTick];
            this._cache.delete(oldestValue);
            this._oldestTick++;
            this._actualSize--;
        }
        ctx.save();
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(cacheString);
        ctx.restore();
        if (metrics.width === 0 && !!text.length) {
            // measureText can return 0 in FF depending on a canvas size, don't cache it
            return metrics;
        }
        this._cache.set(cacheString, { metrics: metrics, tick: this._usageTick });
        this._tick2Labels[this._usageTick] = cacheString;
        this._actualSize++;
        this._usageTick++;
        return metrics;
    }
}
