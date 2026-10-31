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

const NANOS_PER_MILLI = 1_000_000;
const NANOS_PER_MICRO = 1_000;

interface TimeWithFraction {
	seconds: number;
	nanos: number;
}

function splitTime(time: TimePoint): TimeWithFraction {
	const wholeSeconds = Math.floor(time.timestamp);

	if (time.nanos !== undefined) {
		return { seconds: wholeSeconds, nanos: time.nanos };
	}

	// a fractional `UTCTimestamp` keeps its fraction in the timestamp itself
	const fraction = Math.round((time.timestamp - wholeSeconds) * 1_000_000_000);
	return { seconds: wholeSeconds, nanos: Math.max(0, Math.min(999_999_999, fraction)) };
}

function weightByTime(current: TimeWithFraction, prev: TimeWithFraction): TickMarkWeight {
	const currentDate = new Date(current.seconds * 1000);
	const prevDate = new Date(prev.seconds * 1000);

	if (currentDate.getUTCFullYear() !== prevDate.getUTCFullYear()) {
		return TickMarkWeight.Year;
	} else if (currentDate.getUTCMonth() !== prevDate.getUTCMonth()) {
		return TickMarkWeight.Month;
	} else if (currentDate.getUTCDate() !== prevDate.getUTCDate()) {
		return TickMarkWeight.Day;
	}

	const prevMilliseconds = prev.seconds * 1000;
	const currentMilliseconds = current.seconds * 1000;

	for (let i = intradayWeightDivisors.length - 1; i >= 0; --i) {
		const divisor = intradayWeightDivisors[i].divisor;
		if (Math.floor(prevMilliseconds / divisor) !== Math.floor(currentMilliseconds / divisor)) {
			return intradayWeightDivisors[i].weight;
		}
	}

	if (current.nanos !== prev.nanos) {
		if (Math.floor(current.nanos / NANOS_PER_MILLI) !== Math.floor(prev.nanos / NANOS_PER_MILLI)) {
			return TickMarkWeight.Milli;
		}

		if (Math.floor(current.nanos / NANOS_PER_MICRO) !== Math.floor(prev.nanos / NANOS_PER_MICRO)) {
			return TickMarkWeight.Micro;
		}

		return TickMarkWeight.Nano;
	}

	// the same instant (a duplicated time) - the weakest weight, so it is the first to be dropped
	return TickMarkWeight.LessThanSecond;
}

function cast(t: InternalHorzScaleItem): TimePoint {
	return t as unknown as TimePoint;
}

export function fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number = 0): void {
	if (sortedTimePoints.length === 0) {
		return;
	}

	let prevTime: TimeWithFraction | null = startIndex === 0 ? null : splitTime(cast(sortedTimePoints[startIndex - 1].time));

	let totalTimeDiff = 0;

	for (let index = startIndex; index < sortedTimePoints.length; ++index) {
		const currentPoint = sortedTimePoints[index];
		const currentTime = splitTime(cast(currentPoint.time));

		if (prevTime !== null) {
			currentPoint.timeWeight = weightByTime(currentTime, prevTime) as TickMarkWeightValue;
		}

		totalTimeDiff += currentTime.seconds - (prevTime !== null ? prevTime.seconds : currentTime.seconds);

		prevTime = currentTime;
	}

	if (startIndex === 0 && sortedTimePoints.length > 1) {
		// let's guess a weight for the first point
		// let's say the previous point was average time back in the history
		const averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
		const firstTime = splitTime(cast(sortedTimePoints[0].time));
		const approxPrevDate = new Date((firstTime.seconds - averageTimeDiff) * 1000);
		sortedTimePoints[0].timeWeight = weightByTime(
			firstTime,
			{ seconds: Math.floor(approxPrevDate.getTime() / 1000), nanos: firstTime.nanos }
		) as TickMarkWeightValue;
	}
}
