import { RangeImpl } from './range-impl';
export class TimeScaleVisibleRange {
    constructor(logicalRange) {
        this._logicalRange = logicalRange;
    }
    strictRange() {
        if (this._logicalRange === null) {
            return null;
        }
        return new RangeImpl(Math.floor(this._logicalRange.left()), Math.ceil(this._logicalRange.right()));
    }
    logicalRange() {
        return this._logicalRange;
    }
    static invalid() {
        return new TimeScaleVisibleRange(null);
    }
}
