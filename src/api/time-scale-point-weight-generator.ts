import { TickMarkWeight, TimeScalePoint } from '../model/time-data';

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

export function fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number = 0): void {
	if (sortedTimePoints.length === 0) {
		return;
	}

	let prevTime = startIndex === 0 ? null : sortedTimePoints[startIndex - 1].time.timestamp;
	let prevDate = prevTime !== null ? new Date(prevTime * 1000) : null;

	let totalTimeDiff = 0;

	for (let index = startIndex; index < sortedTimePoints.length; ++index) {
		const currentPoint = sortedTimePoints[index];
		const currentDate = new Date(currentPoint.time.timestamp * 1000);

		if (prevDate !== null) {
			currentPoint.timeWeight = weightByTime(currentDate, prevDate);
		}

		totalTimeDiff += currentPoint.time.timestamp - (prevTime || currentPoint.time.timestamp);

		prevTime = currentPoint.time.timestamp;
		prevDate = currentDate;
	}

	if (startIndex === 0 && sortedTimePoints.length > 1) {
		// let's guess a weight for the first point
		// let's say the previous point was average time back in the history
		const averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
		const approxPrevDate = new Date((sortedTimePoints[0].time.timestamp - averageTimeDiff) * 1000);
		sortedTimePoints[0].timeWeight = weightByTime(new Date(sortedTimePoints[0].time.timestamp * 1000), approxPrevDate);
	}
}
