import { lowerBound, upperBound } from '../helpers/algorithms';
function lowerBoundItemsCompare(item, time) {
    return item._internal_time < time;
}
function upperBoundItemsCompare(item, time) {
    return time < item._internal_time;
}
export function visibleTimedValues(items, range, extendedRange) {
    const firstBar = range._internal_left();
    const lastBar = range._internal_right();
    const from = lowerBound(items, firstBar, lowerBoundItemsCompare);
    const to = upperBound(items, lastBar, upperBoundItemsCompare);
    if (!extendedRange) {
        return { from, to };
    }
    let extendedFrom = from;
    let extendedTo = to;
    if (from > 0 && from < items.length && items[from]._internal_time >= firstBar) {
        extendedFrom = from - 1;
    }
    if (to > 0 && to < items.length && items[to - 1]._internal_time <= lastBar) {
        extendedTo = to + 1;
    }
    return { from: extendedFrom, to: extendedTo };
}
