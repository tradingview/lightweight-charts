/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it, mock } from 'node:test';

import { timeScaleOptionsDefaults } from '../../src/api/options/time-scale-options-defaults';
import { ChartModel } from '../../src/model/chart-model';
import { Coordinate } from '../../src/model/coordinate';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { ITimeScaleAnimation } from '../../src/model/invalidate-mask';
import { LocalizationOptions } from '../../src/model/localization-options';
import { TickMarkWeightValue, TimePointIndex, TimeScalePoint } from '../../src/model/time-data';
import { TimeScale } from '../../src/model/time-scale';

function chartModelMock(): ChartModel<Time> {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		recalculateAllPanes: () => {},
		lightUpdate: () => {},
	} as ChartModel<Time>;
}

function tsUpdate(to: number): Parameters<TimeScale<Time>['update']> {
	const points: TimeScalePoint[] = [];

	const startIndex = 0;
	for (let i = startIndex; i <= to; ++i) {
		points.push({ time: { timestamp: i as UTCTimestamp } as unknown as InternalHorzScaleItem, timeWeight: 20 as TickMarkWeightValue, originalTime: i as UTCTimestamp });
	}

	return [points, 0];
}

const behavior = new HorzScaleBehaviorTime();

describe('TimeScale', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fakeLocalizationOptions: LocalizationOptions<Time> = {} as any;

	it('indexToCoordinate and coordinateToIndex inverse', () => {
		const lastIndex = 499 as TimePointIndex;

		const ts = new TimeScale<Time>(chartModelMock(), { ...timeScaleOptionsDefaults, barSpacing: 1, rightOffset: 0 }, fakeLocalizationOptions, behavior);
		ts.setWidth(500);
		ts.update(...tsUpdate(lastIndex));
		ts.setBaseIndex(lastIndex);

		expect(ts.indexToCoordinate(ts.coordinateToIndex(499.5 as Coordinate))).to.be.equal(499.5 as Coordinate);
	});

	it('all *ToCoordinate functions should return same coordinate for the same index', () => {
		const lastIndex = 499 as TimePointIndex;

		const ts = new TimeScale<Time>(chartModelMock(), { ...timeScaleOptionsDefaults, barSpacing: 1, rightOffset: 0 }, fakeLocalizationOptions, behavior);
		ts.setWidth(500);
		ts.update(...tsUpdate(lastIndex));
		ts.setBaseIndex(lastIndex);

		const index = 1 as TimePointIndex;
		const expectedValue = 0.5 as Coordinate;

		expect(ts.indexToCoordinate(index)).to.be.equal(expectedValue, 'indexToCoordinate');

		{
			const indexes = [{ time: index, x: 0 as Coordinate }];
			ts.indexesToCoordinates(indexes);
			expect(indexes[0].x).to.be.equal(expectedValue, 'indexesToCoordinates');
		}
	});

	describe('timeToIndex', () => {
		it('should return index for time on scale', () => {
			const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);

			ts.update(...tsUpdate(2));

			expect(ts.timeToIndex({ timestamp: 0 as UTCTimestamp } as unknown as InternalHorzScaleItem, false)).to.be.equal(0);
			expect(ts.timeToIndex({ timestamp: 1 as UTCTimestamp } as unknown as InternalHorzScaleItem, false)).to.be.equal(1);
			expect(ts.timeToIndex({ timestamp: 2 as UTCTimestamp } as unknown as InternalHorzScaleItem, false)).to.be.equal(2);
		});

		it('should return null for time not on scale', () => {
			const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);

			ts.update(...tsUpdate(2));

			expect(ts.timeToIndex({ timestamp: -1 as UTCTimestamp } as unknown as InternalHorzScaleItem, false)).to.be.equal(null);
			expect(ts.timeToIndex({ timestamp: 3 as UTCTimestamp } as unknown as InternalHorzScaleItem, false)).to.be.equal(null);
		});

		it('should return null if time scale is empty', () => {
			const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);

			expect(ts.timeToIndex({ timestamp: 123 as UTCTimestamp } as unknown as InternalHorzScaleItem, false)).to.be.equal(null);
		});

		it('should return null if timestamp is between two values on the scale', () => {
			const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);

			ts.update(...tsUpdate(1));

			expect(ts.timeToIndex({ timestamp: 0.5 as UTCTimestamp } as unknown as InternalHorzScaleItem, false)).to.be.equal(null);
		});

		it('should return last index if timestamp is greater than last timestamp and findNearest is parameter is true', () => {
			const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);

			ts.update(...tsUpdate(2));

			expect(ts.timeToIndex({ timestamp: 3 as UTCTimestamp } as unknown as InternalHorzScaleItem, true)).to.be.equal(2);
		});

		it('should return first index if timestamp is less than first timestamp and findNearest is parameter is true', () => {
			const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);

			ts.update(...tsUpdate(2));

			expect(ts.timeToIndex({ timestamp: -1 as UTCTimestamp } as unknown as InternalHorzScaleItem, true)).to.be.equal(0);
		});

		it('should return next index if timestamp is between two values on the scale and findNearest parameter is true', () => {
			const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);

			ts.update(...tsUpdate(1));

			expect(ts.timeToIndex({ timestamp: 0.5 as UTCTimestamp } as unknown as InternalHorzScaleItem, true)).to.be.equal(1);
		});
	});

	describe('scrollToOffsetAnimated', () => {
		const start = 1000;

		function animationOf(offset: number, duration: number): ITimeScaleAnimation {
			let animation: ITimeScaleAnimation | null = null;
			const model = {
				recalculateAllPanes: () => {},
				lightUpdate: () => {},
				setTimeScaleAnimation: (value: ITimeScaleAnimation) => { animation = value; },
			} as unknown as ChartModel<Time>;
			const ts = new TimeScale<Time>(model, { ...timeScaleOptionsDefaults, barSpacing: 1, rightOffset: 0 }, fakeLocalizationOptions, behavior);

			const now = mock.method(performance, 'now', () => start);
			try {
				ts.scrollToOffsetAnimated(offset, duration);
			} finally {
				now.mock.restore();
			}

			expect(animation).not.to.be.equal(null);
			return animation as unknown as ITimeScaleAnimation;
		}

		it('should be finished once the duration has passed', () => {
			const animation = animationOf(-200, 400);

			expect(animation.finished(start)).to.be.equal(false);
			expect(animation.finished(start + 399)).to.be.equal(false);
			expect(animation.finished(start + 1000)).to.be.equal(true);
		});

		it('should resolve to the exact target position on and after the final frame', () => {
			const animation = animationOf(-200, 400);

			expect(animation.getPosition(start + 400)).to.be.equal(-200);
			expect(animation.getPosition(start + 100000)).to.be.equal(-200);
		});

		it('should stay at the source position for frames timestamped before the start', () => {
			const animation = animationOf(-200, 400);

			expect(animation.finished(start - 1)).to.be.equal(false);
			expect(animation.getPosition(start - 1)).to.be.equal(0);
			expect(animation.getPosition(start - 100)).to.be.equal(0);
		});
	});
});
