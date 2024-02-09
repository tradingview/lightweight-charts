"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFormulasAreSame = exports.logFormulaForPriceRange = exports.convertPriceRangeFromLog = exports.canConvertPriceRangeFromLog = exports.convertPriceRangeToLog = exports.fromLog = exports.toLog = exports.toIndexedTo100Range = exports.toIndexedTo100 = exports.fromIndexedTo100 = exports.toPercentRange = exports.toPercent = exports.fromPercent = void 0;
const price_range_impl_1 = require("./price-range-impl");
const defLogFormula = {
    logicalOffset: 4,
    coordOffset: 0.0001,
};
function fromPercent(value, baseValue) {
    if (baseValue < 0) {
        value = -value;
    }
    return (value / 100) * baseValue + baseValue;
}
exports.fromPercent = fromPercent;
function toPercent(value, baseValue) {
    const result = 100 * (value - baseValue) / baseValue;
    return (baseValue < 0 ? -result : result);
}
exports.toPercent = toPercent;
function toPercentRange(priceRange, baseValue) {
    const minPercent = toPercent(priceRange.minValue(), baseValue);
    const maxPercent = toPercent(priceRange.maxValue(), baseValue);
    return new price_range_impl_1.PriceRangeImpl(minPercent, maxPercent);
}
exports.toPercentRange = toPercentRange;
function fromIndexedTo100(value, baseValue) {
    value -= 100;
    if (baseValue < 0) {
        value = -value;
    }
    return (value / 100) * baseValue + baseValue;
}
exports.fromIndexedTo100 = fromIndexedTo100;
function toIndexedTo100(value, baseValue) {
    const result = 100 * (value - baseValue) / baseValue + 100;
    return (baseValue < 0 ? -result : result);
}
exports.toIndexedTo100 = toIndexedTo100;
function toIndexedTo100Range(priceRange, baseValue) {
    const minPercent = toIndexedTo100(priceRange.minValue(), baseValue);
    const maxPercent = toIndexedTo100(priceRange.maxValue(), baseValue);
    return new price_range_impl_1.PriceRangeImpl(minPercent, maxPercent);
}
exports.toIndexedTo100Range = toIndexedTo100Range;
function toLog(price, logFormula) {
    const m = Math.abs(price);
    if (m < 1e-15) {
        return 0;
    }
    const res = Math.log10(m + logFormula.coordOffset) + logFormula.logicalOffset;
    return ((price < 0) ? -res : res);
}
exports.toLog = toLog;
function fromLog(logical, logFormula) {
    const m = Math.abs(logical);
    if (m < 1e-15) {
        return 0;
    }
    const res = Math.pow(10, m - logFormula.logicalOffset) - logFormula.coordOffset;
    return (logical < 0) ? -res : res;
}
exports.fromLog = fromLog;
function convertPriceRangeToLog(priceRange, logFormula) {
    if (priceRange === null) {
        return null;
    }
    const min = toLog(priceRange.minValue(), logFormula);
    const max = toLog(priceRange.maxValue(), logFormula);
    return new price_range_impl_1.PriceRangeImpl(min, max);
}
exports.convertPriceRangeToLog = convertPriceRangeToLog;
function canConvertPriceRangeFromLog(priceRange, logFormula) {
    if (priceRange === null) {
        return false;
    }
    const min = fromLog(priceRange.minValue(), logFormula);
    const max = fromLog(priceRange.maxValue(), logFormula);
    return isFinite(min) && isFinite(max);
}
exports.canConvertPriceRangeFromLog = canConvertPriceRangeFromLog;
function convertPriceRangeFromLog(priceRange, logFormula) {
    if (priceRange === null) {
        return null;
    }
    const min = fromLog(priceRange.minValue(), logFormula);
    const max = fromLog(priceRange.maxValue(), logFormula);
    return new price_range_impl_1.PriceRangeImpl(min, max);
}
exports.convertPriceRangeFromLog = convertPriceRangeFromLog;
function logFormulaForPriceRange(range) {
    if (range === null) {
        return defLogFormula;
    }
    const diff = Math.abs(range.maxValue() - range.minValue());
    if (diff >= 1 || diff < 1e-15) {
        return defLogFormula;
    }
    const digits = Math.ceil(Math.abs(Math.log10(diff)));
    const logicalOffset = defLogFormula.logicalOffset + digits;
    const coordOffset = 1 / Math.pow(10, logicalOffset);
    return {
        logicalOffset,
        coordOffset,
    };
}
exports.logFormulaForPriceRange = logFormulaForPriceRange;
function logFormulasAreSame(f1, f2) {
    return f1.logicalOffset === f2.logicalOffset && f1.coordOffset === f2.coordOffset;
}
exports.logFormulasAreSame = logFormulasAreSame;
