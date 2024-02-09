"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlotList = exports.MismatchDirection = void 0;
const algorithms_1 = require("../helpers/algorithms");
const assertions_1 = require("../helpers/assertions");
/**
 * Search direction if no data found at provided index
 */
var MismatchDirection;
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
})(MismatchDirection = exports.MismatchDirection || (exports.MismatchDirection = {}));
// TODO: think about changing it dynamically
const CHUNK_SIZE = 30;
/**
 * PlotList is an array of plot rows
 * each plot row consists of key (index in timescale) and plot value map
 */
class PlotList {
    constructor() {
        this._items = [];
        this._minMaxCache = new Map();
        this._rowSearchCache = new Map();
    }
    // @returns Last row
    last() {
        return this.size() > 0 ? this._items[this._items.length - 1] : null;
    }
    firstIndex() {
        return this.size() > 0 ? this._indexAt(0) : null;
    }
    lastIndex() {
        return this.size() > 0 ? this._indexAt((this._items.length - 1)) : null;
    }
    size() {
        return this._items.length;
    }
    isEmpty() {
        return this.size() === 0;
    }
    contains(index) {
        return this._search(index, 0 /* MismatchDirection.None */) !== null;
    }
    valueAt(index) {
        return this.search(index);
    }
    search(index, searchMode = 0 /* MismatchDirection.None */) {
        const pos = this._search(index, searchMode);
        if (pos === null) {
            return null;
        }
        return Object.assign(Object.assign({}, this._valueAt(pos)), { index: this._indexAt(pos) });
    }
    rows() {
        return this._items;
    }
    minMaxOnRangeCached(start, end, plots) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this.isEmpty()) {
            return null;
        }
        let result = null;
        for (const plot of plots) {
            const plotMinMax = this._minMaxOnRangeCachedImpl(start, end, plot);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    }
    setData(plotRows) {
        this._rowSearchCache.clear();
        this._minMaxCache.clear();
        this._items = plotRows;
    }
    _indexAt(offset) {
        return this._items[offset].index;
    }
    _valueAt(offset) {
        return this._items[offset];
    }
    _search(index, searchMode) {
        const exactPos = this._bsearch(index);
        if (exactPos === null && searchMode !== 0 /* MismatchDirection.None */) {
            switch (searchMode) {
                case -1 /* MismatchDirection.NearestLeft */:
                    return this._searchNearestLeft(index);
                case 1 /* MismatchDirection.NearestRight */:
                    return this._searchNearestRight(index);
                default:
                    throw new TypeError('Unknown search mode');
            }
        }
        return exactPos;
    }
    _searchNearestLeft(index) {
        let nearestLeftPos = this._lowerbound(index);
        if (nearestLeftPos > 0) {
            nearestLeftPos = nearestLeftPos - 1;
        }
        return (nearestLeftPos !== this._items.length && this._indexAt(nearestLeftPos) < index) ? nearestLeftPos : null;
    }
    _searchNearestRight(index) {
        const nearestRightPos = this._upperbound(index);
        return (nearestRightPos !== this._items.length && index < this._indexAt(nearestRightPos)) ? nearestRightPos : null;
    }
    _bsearch(index) {
        const start = this._lowerbound(index);
        if (start !== this._items.length && !(index < this._items[start].index)) {
            return start;
        }
        return null;
    }
    _lowerbound(index) {
        return (0, algorithms_1.lowerBound)(this._items, index, (a, b) => a.index < b);
    }
    _upperbound(index) {
        return (0, algorithms_1.upperBound)(this._items, index, (a, b) => a.index > b);
    }
    _plotMinMax(startIndex, endIndexExclusive, plotIndex) {
        let result = null;
        for (let i = startIndex; i < endIndexExclusive; i++) {
            const values = this._items[i].value;
            const v = values[plotIndex];
            if (Number.isNaN(v)) {
                continue;
            }
            if (result === null) {
                result = { min: v, max: v };
            }
            else {
                if (v < result.min) {
                    result.min = v;
                }
                if (v > result.max) {
                    result.max = v;
                }
            }
        }
        return result;
    }
    _minMaxOnRangeCachedImpl(start, end, plotIndex) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this.isEmpty()) {
            return null;
        }
        let result = null;
        // assume that bar indexes only increase
        const firstIndex = (0, assertions_1.ensureNotNull)(this.firstIndex());
        const lastIndex = (0, assertions_1.ensureNotNull)(this.lastIndex());
        const s = Math.max(start, firstIndex);
        const e = Math.min(end, lastIndex);
        const cachedLow = Math.ceil(s / CHUNK_SIZE) * CHUNK_SIZE;
        const cachedHigh = Math.max(cachedLow, Math.floor(e / CHUNK_SIZE) * CHUNK_SIZE);
        {
            const startIndex = this._lowerbound(s);
            const endIndex = this._upperbound(Math.min(e, cachedLow, end)); // non-inclusive end
            const plotMinMax = this._plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        let minMaxCache = this._minMaxCache.get(plotIndex);
        if (minMaxCache === undefined) {
            minMaxCache = new Map();
            this._minMaxCache.set(plotIndex, minMaxCache);
        }
        // now go cached
        for (let c = Math.max(cachedLow + 1, s); c < cachedHigh; c += CHUNK_SIZE) {
            const chunkIndex = Math.floor(c / CHUNK_SIZE);
            let chunkMinMax = minMaxCache.get(chunkIndex);
            if (chunkMinMax === undefined) {
                const chunkStart = this._lowerbound(chunkIndex * CHUNK_SIZE);
                const chunkEnd = this._upperbound((chunkIndex + 1) * CHUNK_SIZE - 1);
                chunkMinMax = this._plotMinMax(chunkStart, chunkEnd, plotIndex);
                minMaxCache.set(chunkIndex, chunkMinMax);
            }
            result = mergeMinMax(result, chunkMinMax);
        }
        // tail
        {
            const startIndex = this._lowerbound(cachedHigh);
            const endIndex = this._upperbound(e); // non-inclusive end
            const plotMinMax = this._plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    }
}
exports.PlotList = PlotList;
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
            const min = Math.min(first.min, second.min);
            const max = Math.max(first.max, second.max);
            return { min: min, max: max };
        }
    }
}
