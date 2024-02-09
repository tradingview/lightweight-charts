"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visibleTimedValues = void 0;
const algorithms_1 = require("../helpers/algorithms");
function lowerBoundItemsCompare(item, time) {
    return item.time < time;
}
function upperBoundItemsCompare(item, time) {
    return time < item.time;
}
function visibleTimedValues(items, range, extendedRange) {
    const firstBar = range.left();
    const lastBar = range.right();
    const from = (0, algorithms_1.lowerBound)(items, firstBar, lowerBoundItemsCompare);
    const to = (0, algorithms_1.upperBound)(items, lastBar, upperBoundItemsCompare);
    if (!extendedRange) {
        return { from, to };
    }
    let extendedFrom = from;
    let extendedTo = to;
    if (from > 0 && from < items.length && items[from].time >= firstBar) {
        extendedFrom = from - 1;
    }
    if (to > 0 && to < items.length && items[to - 1].time <= lastBar) {
        extendedTo = to + 1;
    }
    return { from: extendedFrom, to: extendedTo };
}
exports.visibleTimedValues = visibleTimedValues;
