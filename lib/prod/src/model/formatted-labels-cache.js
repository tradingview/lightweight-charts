import { ensureDefined } from '../helpers/assertions';
export class FormattedLabelsCache {
    constructor(format, horzScaleBehavior, size = 50) {
        this._private__actualSize = 0;
        this._private__usageTick = 1;
        this._private__oldestTick = 1;
        this._private__cache = new Map();
        this._private__tick2Labels = new Map();
        this._private__format = format;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__maxSize = size;
    }
    _internal_format(tickMark) {
        const time = tickMark.time;
        const cacheKey = this._private__horzScaleBehavior.cacheKey(time);
        const tick = this._private__cache.get(cacheKey);
        if (tick !== undefined) {
            return tick._internal_string;
        }
        if (this._private__actualSize === this._private__maxSize) {
            const oldestValue = this._private__tick2Labels.get(this._private__oldestTick);
            this._private__tick2Labels.delete(this._private__oldestTick);
            this._private__cache.delete(ensureDefined(oldestValue));
            this._private__oldestTick++;
            this._private__actualSize--;
        }
        const str = this._private__format(tickMark);
        this._private__cache.set(cacheKey, { _internal_string: str, _internal_tick: this._private__usageTick });
        this._private__tick2Labels.set(this._private__usageTick, cacheKey);
        this._private__actualSize++;
        this._private__usageTick++;
        return str;
    }
}
