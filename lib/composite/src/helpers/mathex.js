"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ceiledOdd = exports.ceiledEven = exports.min = exports.equal = exports.greaterOrEqual = exports.isBaseDecimal = exports.clamp = void 0;
function clamp(value, minVal, maxVal) {
    return Math.min(Math.max(value, minVal), maxVal);
}
exports.clamp = clamp;
function isBaseDecimal(value) {
    if (value < 0) {
        return false;
    }
    for (let current = value; current > 1; current /= 10) {
        if ((current % 10) !== 0) {
            return false;
        }
    }
    return true;
}
exports.isBaseDecimal = isBaseDecimal;
function greaterOrEqual(x1, x2, epsilon) {
    return (x2 - x1) <= epsilon;
}
exports.greaterOrEqual = greaterOrEqual;
function equal(x1, x2, epsilon) {
    return Math.abs(x1 - x2) < epsilon;
}
exports.equal = equal;
// We can't use Math.min(...arr) because that would only support arrays shorter than 65536 items.
function min(arr) {
    if (arr.length < 1) {
        throw Error('array is empty');
    }
    let minVal = arr[0];
    for (let i = 1; i < arr.length; ++i) {
        if (arr[i] < minVal) {
            minVal = arr[i];
        }
    }
    return minVal;
}
exports.min = min;
function ceiledEven(x) {
    const ceiled = Math.ceil(x);
    return (ceiled % 2 !== 0) ? ceiled - 1 : ceiled;
}
exports.ceiledEven = ceiledEven;
function ceiledOdd(x) {
    const ceiled = Math.ceil(x);
    return (ceiled % 2 === 0) ? ceiled - 1 : ceiled;
}
exports.ceiledOdd = ceiledOdd;
