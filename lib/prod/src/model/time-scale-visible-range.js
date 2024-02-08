import { RangeImpl } from './range-impl';
export class TimeScaleVisibleRange {
    constructor(logicalRange) {
        this._private__logicalRange = logicalRange;
    }
    _internal_strictRange() {
        if (this._private__logicalRange === null) {
            return null;
        }
        return new RangeImpl(Math.floor(this._private__logicalRange._internal_left()), Math.ceil(this._private__logicalRange._internal_right()));
    }
    _internal_logicalRange() {
        return this._private__logicalRange;
    }
    static _internal_invalid() {
        return new TimeScaleVisibleRange(null);
    }
}
