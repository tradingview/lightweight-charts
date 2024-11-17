import { PriceRangeImpl } from './price-range-impl';
const defLogFormula = {
    logicalOffset: 4,
    coordOffset: 0.0001,
};
export function fromPercent(value, baseValue) {
    if (baseValue < 0) {
        value = -value;
    }
    return (value / 100) * baseValue + baseValue;
}
export function toPercent(value, baseValue) {
    const result = 100 * (value - baseValue) / baseValue;
    return (baseValue < 0 ? -result : result);
}
export function toPercentRange(priceRange, baseValue) {
    const minPercent = toPercent(priceRange.minValue(), baseValue);
    const maxPercent = toPercent(priceRange.maxValue(), baseValue);
    return new PriceRangeImpl(minPercent, maxPercent);
}
export function fromIndexedTo100(value, baseValue) {
    value -= 100;
    if (baseValue < 0) {
        value = -value;
    }
    return (value / 100) * baseValue + baseValue;
}
export function toIndexedTo100(value, baseValue) {
    const result = 100 * (value - baseValue) / baseValue + 100;
    return (baseValue < 0 ? -result : result);
}
export function toIndexedTo100Range(priceRange, baseValue) {
    const minPercent = toIndexedTo100(priceRange.minValue(), baseValue);
    const maxPercent = toIndexedTo100(priceRange.maxValue(), baseValue);
    return new PriceRangeImpl(minPercent, maxPercent);
}
export function toLog(price, logFormula) {
    const m = Math.abs(price);
    if (m < 1e-15) {
        return 0;
    }
    const res = Math.log10(m + logFormula.coordOffset) + logFormula.logicalOffset;
    return ((price < 0) ? -res : res);
}
export function fromLog(logical, logFormula) {
    const m = Math.abs(logical);
    if (m < 1e-15) {
        return 0;
    }
    const res = Math.pow(10, m - logFormula.logicalOffset) - logFormula.coordOffset;
    return (logical < 0) ? -res : res;
}
export function convertPriceRangeToLog(priceRange, logFormula) {
    if (priceRange === null) {
        return null;
    }
    const min = toLog(priceRange.minValue(), logFormula);
    const max = toLog(priceRange.maxValue(), logFormula);
    return new PriceRangeImpl(min, max);
}
export function canConvertPriceRangeFromLog(priceRange, logFormula) {
    if (priceRange === null) {
        return false;
    }
    const min = fromLog(priceRange.minValue(), logFormula);
    const max = fromLog(priceRange.maxValue(), logFormula);
    return isFinite(min) && isFinite(max);
}
export function convertPriceRangeFromLog(priceRange, logFormula) {
    if (priceRange === null) {
        return null;
    }
    const min = fromLog(priceRange.minValue(), logFormula);
    const max = fromLog(priceRange.maxValue(), logFormula);
    return new PriceRangeImpl(min, max);
}
export function logFormulaForPriceRange(range) {
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
export function logFormulasAreSame(f1, f2) {
    return f1.logicalOffset === f2.logicalOffset && f1.coordOffset === f2.coordOffset;
}
