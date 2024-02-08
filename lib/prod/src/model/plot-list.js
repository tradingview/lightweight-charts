import { lowerBound, upperBound } from '../helpers/algorithms';
import { ensureNotNull } from '../helpers/assertions';
/**
 * Search direction if no data found at provided index
 */
export var MismatchDirection;
(function (MismatchDirection) {
    /**
     * Search the nearest left item
     */
    MismatchDirection[MismatchDirection["NearestLeft"] = -1] = "NearestLeft";
    /**
     * Do not search
     */
    MismatchDirection[MismatchDirection["None"] = 0] = "None";
    /**
     * Search the nearest right item
     */
    MismatchDirection[MismatchDirection["NearestRight"] = 1] = "NearestRight";
})(MismatchDirection || (MismatchDirection = {}));
// TODO: think about changing it dynamically
const CHUNK_SIZE = 30;
/**
 * PlotList is an array of plot rows
 * each plot row consists of key (index in timescale) and plot value map
 */
export class PlotList {
    constructor() {
        this._private__items = [];
        this._private__minMaxCache = new Map();
        this._private__rowSearchCache = new Map();
    }
    // @returns Last row
    _internal_last() {
        return this._internal_size() > 0 ? this._private__items[this._private__items.length - 1] : null;
    }
    _internal_firstIndex() {
        return this._internal_size() > 0 ? this._private__indexAt(0) : null;
    }
    _internal_lastIndex() {
        return this._internal_size() > 0 ? this._private__indexAt((this._private__items.length - 1)) : null;
    }
    _internal_size() {
        return this._private__items.length;
    }
    _internal_isEmpty() {
        return this._internal_size() === 0;
    }
    _internal_contains(index) {
        return this._private__search(index, 0 /* MismatchDirection.None */) !== null;
    }
    _internal_valueAt(index) {
        return this._internal_search(index);
    }
    _internal_search(index, searchMode = 0 /* MismatchDirection.None */) {
        const pos = this._private__search(index, searchMode);
        if (pos === null) {
            return null;
        }
        return Object.assign(Object.assign({}, this._private__valueAt(pos)), { _internal_index: this._private__indexAt(pos) });
    }
    _internal_rows() {
        return this._private__items;
    }
    _internal_minMaxOnRangeCached(start, end, plots) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this._internal_isEmpty()) {
            return null;
        }
        let result = null;
        for (const plot of plots) {
            const plotMinMax = this._private__minMaxOnRangeCachedImpl(start, end, plot);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    }
    _internal_setData(plotRows) {
        this._private__rowSearchCache.clear();
        this._private__minMaxCache.clear();
        this._private__items = plotRows;
    }
    _private__indexAt(offset) {
        return this._private__items[offset]._internal_index;
    }
    _private__valueAt(offset) {
        return this._private__items[offset];
    }
    _private__search(index, searchMode) {
        const exactPos = this._private__bsearch(index);
        if (exactPos === null && searchMode !== 0 /* MismatchDirection.None */) {
            switch (searchMode) {
                case -1 /* MismatchDirection.NearestLeft */:
                    return this._private__searchNearestLeft(index);
                case 1 /* MismatchDirection.NearestRight */:
                    return this._private__searchNearestRight(index);
                default:
                    throw new TypeError('Unknown search mode');
            }
        }
        return exactPos;
    }
    _private__searchNearestLeft(index) {
        let nearestLeftPos = this._private__lowerbound(index);
        if (nearestLeftPos > 0) {
            nearestLeftPos = nearestLeftPos - 1;
        }
        return (nearestLeftPos !== this._private__items.length && this._private__indexAt(nearestLeftPos) < index) ? nearestLeftPos : null;
    }
    _private__searchNearestRight(index) {
        const nearestRightPos = this._private__upperbound(index);
        return (nearestRightPos !== this._private__items.length && index < this._private__indexAt(nearestRightPos)) ? nearestRightPos : null;
    }
    _private__bsearch(index) {
        const start = this._private__lowerbound(index);
        if (start !== this._private__items.length && !(index < this._private__items[start]._internal_index)) {
            return start;
        }
        return null;
    }
    _private__lowerbound(index) {
        return lowerBound(this._private__items, index, (a, b) => a._internal_index < b);
    }
    _private__upperbound(index) {
        return upperBound(this._private__items, index, (a, b) => a._internal_index > b);
    }
    _private__plotMinMax(startIndex, endIndexExclusive, plotIndex) {
        let result = null;
        for (let i = startIndex; i < endIndexExclusive; i++) {
            const values = this._private__items[i]._internal_value;
            const v = values[plotIndex];
            if (Number.isNaN(v)) {
                continue;
            }
            if (result === null) {
                result = { _internal_min: v, _internal_max: v };
            }
            else {
                if (v < result._internal_min) {
                    result._internal_min = v;
                }
                if (v > result._internal_max) {
                    result._internal_max = v;
                }
            }
        }
        return result;
    }
    _private__minMaxOnRangeCachedImpl(start, end, plotIndex) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this._internal_isEmpty()) {
            return null;
        }
        let result = null;
        // assume that bar indexes only increase
        const firstIndex = ensureNotNull(this._internal_firstIndex());
        const lastIndex = ensureNotNull(this._internal_lastIndex());
        const s = Math.max(start, firstIndex);
        const e = Math.min(end, lastIndex);
        const cachedLow = Math.ceil(s / CHUNK_SIZE) * CHUNK_SIZE;
        const cachedHigh = Math.max(cachedLow, Math.floor(e / CHUNK_SIZE) * CHUNK_SIZE);
        {
            const startIndex = this._private__lowerbound(s);
            const endIndex = this._private__upperbound(Math.min(e, cachedLow, end)); // non-inclusive end
            const plotMinMax = this._private__plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        let minMaxCache = this._private__minMaxCache.get(plotIndex);
        if (minMaxCache === undefined) {
            minMaxCache = new Map();
            this._private__minMaxCache.set(plotIndex, minMaxCache);
        }
        // now go cached
        for (let c = Math.max(cachedLow + 1, s); c < cachedHigh; c += CHUNK_SIZE) {
            const chunkIndex = Math.floor(c / CHUNK_SIZE);
            let chunkMinMax = minMaxCache.get(chunkIndex);
            if (chunkMinMax === undefined) {
                const chunkStart = this._private__lowerbound(chunkIndex * CHUNK_SIZE);
                const chunkEnd = this._private__upperbound((chunkIndex + 1) * CHUNK_SIZE - 1);
                chunkMinMax = this._private__plotMinMax(chunkStart, chunkEnd, plotIndex);
                minMaxCache.set(chunkIndex, chunkMinMax);
            }
            result = mergeMinMax(result, chunkMinMax);
        }
        // tail
        {
            const startIndex = this._private__lowerbound(cachedHigh);
            const endIndex = this._private__upperbound(e); // non-inclusive end
            const plotMinMax = this._private__plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    }
}
function mergeMinMax(first, second) {
    if (first === null) {
        return second;
    }
    else {
        if (second === null) {
            return first;
        }
        else {
            // merge MinMax values
            const min = Math.min(first._internal_min, second._internal_min);
            const max = Math.max(first._internal_max, second._internal_max);
            return { _internal_min: min, _internal_max: max };
        }
    }
}
