import { expect } from 'chai';
import { describe, it } from 'mocha';

import { timeScaleOptionsDefaults } from '../../src/api/options/time-scale-options-defaults';
import { ChartModel } from '../../src/model/chart-model';
import { Coordinate } from '../../src/model/coordinate';
import { LocalizationOptions } from '../../src/model/localization-options';
import {
	TimePointIndex,
	TimeScalePoint,
	UTCTimestamp,
} from '../../src/model/time-data';
import { TimeScale } from '../../src/model/time-scale';

function chartModelMock(): ChartModel {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		recalculateAllPanes: () => {},
		lightUpdate: () => {},
	} as ChartModel;
}

function tsUpdate(to: number): Parameters<TimeScale['update']> {
	const points: TimeScalePoint[] = [];

	const startIndex = 0;
	for (let i = startIndex; i <= to; ++i) {
		points.push({ time: { timestamp: i as UTCTimestamp }, timeWeight: 20 });
	}

	return [points, 0];
}

describe('TimeScale', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fakeLocalizationOptions: LocalizationOptions = {} as any;

	it('indexToCoordinate and coordinateToIndex inverse', () => {
		const lastIndex = 499 as TimePointIndex;

		const ts = new TimeScale(chartModelMock(), { ...timeScaleOptionsDefaults, barSpacing: 1, rightOffset: 0 }, fakeLocalizationOptions);
		ts.setWidth(500);
		ts.update(...tsUpdate(lastIndex));
		ts.setBaseIndex(lastIndex);

		expect(ts.indexToCoordinate(ts.coordinateToIndex(499.5 as Coordinate))).to.be.equal(499.5 as Coordinate);
	});

	it('all *ToCoordinate functions should return same coordinate for the same index', () => {
		const lastIndex = 499 as TimePointIndex;

		const ts = new TimeScale(chartModelMock(), { ...timeScaleOptionsDefaults, barSpacing: 1, rightOffset: 0 }, fakeLocalizationOptions);
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
});
