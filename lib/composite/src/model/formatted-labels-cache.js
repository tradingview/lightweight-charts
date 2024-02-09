"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormattedLabelsCache = void 0;
const assertions_1 = require("../helpers/assertions");
class FormattedLabelsCache {
    constructor(format, horzScaleBehavior, size = 50) {
        this._actualSize = 0;
        this._usageTick = 1;
        this._oldestTick = 1;
        this._cache = new Map();
        this._tick2Labels = new Map();
        this._format = format;
        this._horzScaleBehavior = horzScaleBehavior;
        this._maxSize = size;
    }
    format(tickMark) {
        const time = tickMark.time;
        const cacheKey = this._horzScaleBehavior.cacheKey(time);
        const tick = this._cache.get(cacheKey);
        if (tick !== undefined) {
            return tick.string;
        }
        if (this._actualSize === this._maxSize) {
            const oldestValue = this._tick2Labels.get(this._oldestTick);
            this._tick2Labels.delete(this._oldestTick);
            this._cache.delete((0, assertions_1.ensureDefined)(oldestValue));
            this._oldestTick++;
            this._actualSize--;
        }
        const str = this._format(tickMark);
        this._cache.set(cacheKey, { string: str, tick: this._usageTick });
        this._tick2Labels.set(this._usageTick, cacheKey);
        this._actualSize++;
        this._usageTick++;
        return str;
    }
}
exports.FormattedLabelsCache = FormattedLabelsCache;
