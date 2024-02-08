import { isNumber } from '../helpers/strict-type-checks';
function computeFiniteResult(method, valueOne, valueTwo, fallback) {
    const firstFinite = Number.isFinite(valueOne);
    const secondFinite = Number.isFinite(valueTwo);
    if (firstFinite && secondFinite) {
        return method(valueOne, valueTwo);
    }
    return !firstFinite && !secondFinite ? fallback : (firstFinite ? valueOne : valueTwo);
}
export class PriceRangeImpl {
    constructor(minValue, maxValue) {
        this._private__minValue = minValue;
        this._private__maxValue = maxValue;
    }
    _internal_equals(pr) {
        if (pr === null) {
            return false;
        }
        return this._private__minValue === pr._private__minValue && this._private__maxValue === pr._private__maxValue;
    }
    _internal_clone() {
        return new PriceRangeImpl(this._private__minValue, this._private__maxValue);
    }
    _internal_minValue() {
        return this._private__minValue;
    }
    _internal_maxValue() {
        return this._private__maxValue;
    }
    _internal_length() {
        return this._private__maxValue - this._private__minValue;
    }
    _internal_isEmpty() {
        return this._private__maxValue === this._private__minValue || Number.isNaN(this._private__maxValue) || Number.isNaN(this._private__minValue);
    }
    _internal_merge(anotherRange) {
        if (anotherRange === null) {
            return this;
        }
        return new PriceRangeImpl(computeFiniteResult(Math.min, this._internal_minValue(), anotherRange._internal_minValue(), -Infinity), computeFiniteResult(Math.max, this._internal_maxValue(), anotherRange._internal_maxValue(), Infinity));
    }
    _internal_scaleAroundCenter(coeff) {
        if (!isNumber(coeff)) {
            return;
        }
        const delta = this._private__maxValue - this._private__minValue;
        if (delta === 0) {
            return;
        }
        const center = (this._private__maxValue + this._private__minValue) * 0.5;
        let maxDelta = this._private__maxValue - center;
        let minDelta = this._private__minValue - center;
        maxDelta *= coeff;
        minDelta *= coeff;
        this._private__maxValue = center + maxDelta;
        this._private__minValue = center + minDelta;
    }
    _internal_shift(delta) {
        if (!isNumber(delta)) {
            return;
        }
        this._private__maxValue += delta;
        this._private__minValue += delta;
    }
    _internal_toRaw() {
        return {
            minValue: this._private__minValue,
            maxValue: this._private__maxValue,
        };
    }
    static _internal_fromRaw(raw) {
        return (raw === null) ? null : new PriceRangeImpl(raw.minValue, raw.maxValue);
    }
}
