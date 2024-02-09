"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceRangeImpl = void 0;
const strict_type_checks_1 = require("../helpers/strict-type-checks");
function computeFiniteResult(method, valueOne, valueTwo, fallback) {
    const firstFinite = Number.isFinite(valueOne);
    const secondFinite = Number.isFinite(valueTwo);
    if (firstFinite && secondFinite) {
        return method(valueOne, valueTwo);
    }
    return !firstFinite && !secondFinite ? fallback : (firstFinite ? valueOne : valueTwo);
}
class PriceRangeImpl {
    constructor(minValue, maxValue) {
        this._minValue = minValue;
        this._maxValue = maxValue;
    }
    equals(pr) {
        if (pr === null) {
            return false;
        }
        return this._minValue === pr._minValue && this._maxValue === pr._maxValue;
    }
    clone() {
        return new PriceRangeImpl(this._minValue, this._maxValue);
    }
    minValue() {
        return this._minValue;
    }
    maxValue() {
        return this._maxValue;
    }
    length() {
        return this._maxValue - this._minValue;
    }
    isEmpty() {
        return this._maxValue === this._minValue || Number.isNaN(this._maxValue) || Number.isNaN(this._minValue);
    }
    merge(anotherRange) {
        if (anotherRange === null) {
            return this;
        }
        return new PriceRangeImpl(computeFiniteResult(Math.min, this.minValue(), anotherRange.minValue(), -Infinity), computeFiniteResult(Math.max, this.maxValue(), anotherRange.maxValue(), Infinity));
    }
    scaleAroundCenter(coeff) {
        if (!(0, strict_type_checks_1.isNumber)(coeff)) {
            return;
        }
        const delta = this._maxValue - this._minValue;
        if (delta === 0) {
            return;
        }
        const center = (this._maxValue + this._minValue) * 0.5;
        let maxDelta = this._maxValue - center;
        let minDelta = this._minValue - center;
        maxDelta *= coeff;
        minDelta *= coeff;
        this._maxValue = center + maxDelta;
        this._minValue = center + minDelta;
    }
    shift(delta) {
        if (!(0, strict_type_checks_1.isNumber)(delta)) {
            return;
        }
        this._maxValue += delta;
        this._minValue += delta;
    }
    toRaw() {
        return {
            minValue: this._minValue,
            maxValue: this._maxValue,
        };
    }
    static fromRaw(raw) {
        return (raw === null) ? null : new PriceRangeImpl(raw.minValue, raw.maxValue);
    }
}
exports.PriceRangeImpl = PriceRangeImpl;
