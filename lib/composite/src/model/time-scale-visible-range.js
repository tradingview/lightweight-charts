"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeScaleVisibleRange = void 0;
const range_impl_1 = require("./range-impl");
class TimeScaleVisibleRange {
    constructor(logicalRange) {
        this._logicalRange = logicalRange;
    }
    strictRange() {
        if (this._logicalRange === null) {
            return null;
        }
        return new range_impl_1.RangeImpl(Math.floor(this._logicalRange.left()), Math.ceil(this._logicalRange.right()));
    }
    logicalRange() {
        return this._logicalRange;
    }
    static invalid() {
        return new TimeScaleVisibleRange(null);
    }
}
exports.TimeScaleVisibleRange = TimeScaleVisibleRange;
