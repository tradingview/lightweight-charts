import { TimeScalePoint, UTCTimestamp } from '../model/time-data';

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
	weight: number;
}

const intradayWeightDivisors: WeightDivisor[] = [
	// TODO: divisor=1 means 1ms and it's strange that weight for 1ms > weight for 1s
	{ divisor: 1, weight: 20 },
	{ divisor: seconds(1), weight: 19 },
	{ divisor: minutes(1), weight: 20 },
	{ divisor: minutes(5), weight: 21 },
	{ divisor: minutes(30), weight: 22 },
	{ divisor: hours(1), weight: 30 },
	{ divisor: hours(3), weight: 31 },
	{ divisor: hours(6), weight: 32 },
	{ divisor: hours(12), weight: 33 },
];

function weightByTime(time: UTCTimestamp, prevTime: UTCTimestamp | null): number {
	if (prevTime !== null) {
		const prevDate = new Date(prevTime * 1000);
		const currentDate = new Date(time * 1000);

		if (currentDate.getUTCFullYear() !== prevDate.getUTCFullYear()) {
			return 70;
		} else if (currentDate.getUTCMonth() !== prevDate.getUTCMonth()) {
			return 60;
		} else if (currentDate.getUTCDate() !== prevDate.getUTCDate()) {
			return 50;
		}

		for (let i = intradayWeightDivisors.length - 1; i >= 0; --i) {
			if (Math.floor(prevDate.getTime() / intradayWeightDivisors[i].divisor) !== Math.floor(currentDate.getTime() / intradayWeightDivisors[i].divisor)) {
				return intradayWeightDivisors[i].weight;
			}
		}
	}

	return 20;
}

export function fillWeightsForPoints(sortedTimePoints: TimeScalePoint[], startIndex: number = 0): void {
	let prevTime: UTCTimestamp | null = (startIndex === 0 || sortedTimePoints.length === 0)
		? null
		: sortedTimePoints[startIndex - 1].time.timestamp;

	let totalTimeDiff = 0;

	for (let index = startIndex; index < sortedTimePoints.length; ++index) {
		const currentPoint = sortedTimePoints[index];
		currentPoint.timeWeight = weightByTime(currentPoint.time.timestamp, prevTime);

		totalTimeDiff += currentPoint.time.timestamp - (prevTime || currentPoint.time.timestamp);
		prevTime = currentPoint.time.timestamp;
	}

	if (startIndex === 0 && sortedTimePoints.length > 1) {
		// let's guess a weight for the first point
		// let's say the previous point was average time back in the history
		const averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
		const approxPrevTime = (sortedTimePoints[0].time.timestamp - averageTimeDiff) as UTCTimestamp;
		sortedTimePoints[0].timeWeight = weightByTime(sortedTimePoints[0].time.timestamp, approxPrevTime);
	}
}
