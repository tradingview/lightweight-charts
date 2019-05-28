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

export function visibleTimedValues(items: TimedValue[], range: BarsRange): SeriesItemsIndexesRange {
	const from = lowerbound<TimedValue, TimePointIndex>(items, range.firstBar(), lowerBoundItemsCompare);
	const to = upperbound<TimedValue, TimePointIndex>(items, range.lastBar(), upperBoundItemsCompare);
	return { from, to };
}
