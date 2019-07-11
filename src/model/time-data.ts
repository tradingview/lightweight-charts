import { lowerbound, upperbound } from '../helpers/algorithms';
import { Nominal } from '../helpers/nominal';

import { BarsRange } from './bars-range';
import { Coordinate } from './coordinate';

export type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;

export interface BusinessDay {
	year: number;
	month: number;
	day: number;
}

export interface TimePoint {
	timestamp: UTCTimestamp;
	businessDay?: BusinessDay;
}

export interface TimePointsRange {
	from: TimePoint;
	to: TimePoint;
}

export type TimePointIndex = Nominal<number, 'TimePointIndex'>;

export interface TickMark {
	index: TimePointIndex;
	span: number;
	time: TimePoint;
}

export interface TimedValue {
	time: TimePointIndex;
	x: Coordinate;
}

export interface SeriesItemsIndexesRange {
	from: number;
	to: number;
}

function lowerBoundItemsCompare(item: TimedValue, time: TimePointIndex): boolean {
	return item.time < time;
}

function upperBoundItemsCompare(time: TimePointIndex, item: TimedValue): boolean {
	return time < item.time;
}

export function visibleTimedValues(items: TimedValue[], range: BarsRange, extendedRange: boolean): SeriesItemsIndexesRange {
	const from = lowerbound<TimedValue, TimePointIndex>(items, range.firstBar(), lowerBoundItemsCompare);
	const to = upperbound<TimedValue, TimePointIndex>(items, range.lastBar(), upperBoundItemsCompare);

	if (!extendedRange) {
		return { from, to };
	}

	let extendedFrom = from;
	let extendedTo = to;

	if (from > 0 && items[from].time >= range.firstBar()) {
		extendedFrom = from - 1;
	}

	if (to < items.length && to > 0 && items[to - 1].time <= range.lastBar()) {
		extendedTo = to + 1;
	}

	return { from: extendedFrom, to: extendedTo };
}
