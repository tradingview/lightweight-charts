import { ensureDefined } from '../helpers/assertions';
const defaultReplacementRe = /[2-9]/g;
export class TextWidthCache {
    constructor(size = 50) {
        this._private__actualSize = 0;
        this._private__usageTick = 1;
        this._private__oldestTick = 1;
        this._private__tick2Labels = {};
        this._private__cache = new Map();
        this._private__maxSize = size;
    }
    _internal_reset() {
        this._private__actualSize = 0;
        this._private__cache.clear();
        this._private__usageTick = 1;
        this._private__oldestTick = 1;
        this._private__tick2Labels = {};
    }
    _internal_measureText(ctx, text, optimizationReplacementRe) {
        return this._private__getMetrics(ctx, text, optimizationReplacementRe).width;
    }
    _internal_yMidCorrection(ctx, text, optimizationReplacementRe) {
        const metrics = this._private__getMetrics(ctx, text, optimizationReplacementRe);
        // if actualBoundingBoxAscent/actualBoundingBoxDescent are not supported we use 0 as a fallback
        return ((metrics.actualBoundingBoxAscent || 0) - (metrics.actualBoundingBoxDescent || 0)) / 2;
    }
    _private__getMetrics(ctx, text, optimizationReplacementRe) {
        const re = optimizationReplacementRe || defaultReplacementRe;
        const cacheString = String(text).replace(re, '0');
        if (this._private__cache.has(cacheString)) {
            return ensureDefined(this._private__cache.get(cacheString))._internal_metrics;
        }
        if (this._private__actualSize === this._private__maxSize) {
            const oldestValue = this._private__tick2Labels[this._private__oldestTick];
            delete this._private__tick2Labels[this._private__oldestTick];
            this._private__cache.delete(oldestValue);
            this._private__oldestTick++;
            this._private__actualSize--;
        }
        ctx.save();
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(cacheString);
        ctx.restore();
        if (metrics.width === 0 && !!text.length) {
            // measureText can return 0 in FF depending on a canvas size, don't cache it
            return metrics;
        }
        this._private__cache.set(cacheString, { _internal_metrics: metrics, _internal_tick: this._private__usageTick });
        this._private__tick2Labels[this._private__usageTick] = cacheString;
        this._private__actualSize++;
        this._private__usageTick++;
        return metrics;
    }
}
