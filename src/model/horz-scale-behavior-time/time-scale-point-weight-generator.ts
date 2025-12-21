import { Mutable } from '../../helpers/mutable';

import { InternalHorzScaleItem } from '../ihorz-scale-behavior';
import { TickMarkWeightValue, TimeScalePoint } from '../time-data';
import { TickMarkWeight, TimePoint } from './types';

function hours(count: number): number {
	return count * 60 * 60 * 1000;
}

function minutes(count: number): number {
	return count * 60 * 1000;
}

function seconds(count: number): number {
	return count * 1000;
}

interface WeightDivisor {
	divisor: number;
	weight: TickMarkWeight;
}

const intradayWeightDivisors: WeightDivisor[] = [
	{ divisor: seconds(1), weight: TickMarkWeight.Second },
	{ divisor: minutes(1), weight: TickMarkWeight.Minute1 },
	{ divisor: minutes(5), weight: TickMarkWeight.Minute5 },
	{ divisor: minutes(30), weight: TickMarkWeight.Minute30 },
	{ divisor: hours(1), weight: TickMarkWeight.Hour1 },
	{ divisor: hours(3), weight: TickMarkWeight.Hour3 },
	{ divisor: hours(6), weight: TickMarkWeight.Hour6 },
	{ divisor: hours(12), weight: TickMarkWeight.Hour12 },
];

// OPTIMIZATION: Reusable Date objects to avoid allocations
const _reusableDateCurrent = new Date(0);
const _reusableDatePrev = new Date(0);

function weightByTime(currentDate: Date, prevDate: Date): TickMarkWeight {
	if (currentDate.getUTCFullYear() !== prevDate.getUTCFullYear()) {
		return TickMarkWeight.Year;
	} else if (currentDate.getUTCMonth() !== prevDate.getUTCMonth()) {
		return TickMarkWeight.Month;
	} else if (currentDate.getUTCDate() !== prevDate.getUTCDate()) {
		return TickMarkWeight.Day;
	}

	for (let i = intradayWeightDivisors.length - 1; i >= 0; --i) {
		if (Math.floor(prevDate.getTime() / intradayWeightDivisors[i].divisor) !== Math.floor(currentDate.getTime() / intradayWeightDivisors[i].divisor)) {
			return intradayWeightDivisors[i].weight;
		}
	}

	return TickMarkWeight.LessThanSecond;
}

/**
 * OPTIMIZATION: Timestamp-only version that avoids Date object allocations
 * for common intraday weight calculations.
 */
function weightByTimestamp(currentTs: number, prevTs: number): TickMarkWeight {
	// Fast path: check intraday weights using timestamps only (no Date objects needed)
	// This works because intraday divisors are based on millisecond intervals
	for (let i = intradayWeightDivisors.length - 1; i >= 0; --i) {
		const divisor = intradayWeightDivisors[i].divisor;
		if (Math.floor(prevTs / divisor) !== Math.floor(currentTs / divisor)) {
			// For day/month/year transitions, we need to use Date objects
			if (i >= intradayWeightDivisors.length - 1) {
				// Could be a day boundary - need to check with Date objects
				_reusableDateCurrent.setTime(currentTs);
				_reusableDatePrev.setTime(prevTs);
				return weightByTime(_reusableDateCurrent, _reusableDatePrev);
			}
			return intradayWeightDivisors[i].weight;
		}
	}

	// Check for day/month/year boundaries (requires Date objects)
	const currentDayStart = Math.floor(currentTs / 86400000);
	const prevDayStart = Math.floor(prevTs / 86400000);

	if (currentDayStart !== prevDayStart) {
		// Day changed - need to check month/year with Date objects
		_reusableDateCurrent.setTime(currentTs);
		_reusableDatePrev.setTime(prevTs);
		return weightByTime(_reusableDateCurrent, _reusableDatePrev);
	}

	return TickMarkWeight.LessThanSecond;
}

function cast(t: InternalHorzScaleItem): TimePoint {
	return t as unknown as TimePoint;
}

export function fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number = 0): void {
	if (sortedTimePoints.length === 0) {
		return;
	}

	// OPTIMIZATION: For single point updates (most common case), use fast path
	const isSinglePointUpdate = startIndex === sortedTimePoints.length - 1 && startIndex > 0;

	if (isSinglePointUpdate) {
		// Fast path: only calculate weight for the new point using timestamps
		const currentPoint = sortedTimePoints[startIndex];
		const prevPoint = sortedTimePoints[startIndex - 1];
		const currentTs = cast(currentPoint.time).timestamp * 1000;
		const prevTs = cast(prevPoint.time).timestamp * 1000;
		currentPoint.timeWeight = weightByTimestamp(currentTs, prevTs) as TickMarkWeightValue;
		return;
	}

	// Original path for bulk updates
	let prevTime = startIndex === 0 ? null : cast(sortedTimePoints[startIndex - 1].time).timestamp;
	let prevTs = prevTime !== null ? prevTime * 1000 : null;

	let totalTimeDiff = 0;

	for (let index = startIndex; index < sortedTimePoints.length; ++index) {
		const currentPoint = sortedTimePoints[index];
		const currentTs = cast(currentPoint.time).timestamp * 1000;

		if (prevTs !== null) {
			// Use timestamp-based calculation when possible
			currentPoint.timeWeight = weightByTimestamp(currentTs, prevTs) as TickMarkWeightValue;
		}

		totalTimeDiff += cast(currentPoint.time).timestamp - (prevTime || cast(currentPoint.time).timestamp);

		prevTime = cast(currentPoint.time).timestamp;
		prevTs = currentTs;
	}

	if (startIndex === 0 && sortedTimePoints.length > 1) {
		// let's guess a weight for the first point
		// let's say the previous point was average time back in the history
		const averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
		const firstTs = cast(sortedTimePoints[0].time).timestamp * 1000;
		const approxPrevTs = firstTs - averageTimeDiff * 1000;
		sortedTimePoints[0].timeWeight = weightByTimestamp(firstTs, approxPrevTs) as TickMarkWeightValue;
	}
}
