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
	const firstBar = range.firstBar();
	const lastBar = range.lastBar();

	const from = lowerbound<TimedValue, TimePointIndex>(items, firstBar, lowerBoundItemsCompare);
	const to = upperbound<TimedValue, TimePointIndex>(items, lastBar, upperBoundItemsCompare);

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
