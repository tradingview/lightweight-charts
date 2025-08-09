/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { BarData } from '../../../src/model/data-consumer';
import { DataLayer } from '../../../src/model/data-layer';
import { HorzScaleBehaviorTime } from '../../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../../src/model/horz-scale-behavior-time/types';
import { Series } from '../../../src/model/series';
import { SeriesType } from '../../../src/model/series-options';

function createSeriesMock<T extends SeriesType = SeriesType>(seriesType: T): Series<T> {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		seriesType: () => seriesType,
		customSeriesPlotValuesBuilder: () => {},
		customSeriesWhitespaceCheck: () => {},
	} as Series<T>;
}

function candlestickDataAt(time: Time, open: number, high: number, low: number, close: number): BarData<Time> {
	return { time, open, high, low, close };
}

const behavior = new HorzScaleBehaviorTime();

describe('Series Popping', () => {
	it('should pop data from series and return popped items', () => {
		const dataLayer = new DataLayer<Time>(behavior);
		const series = createSeriesMock('Candlestick');

		// Set initial data
		const testData = [
			candlestickDataAt(1000 as UTCTimestamp, 75.16, 82.84, 36.16, 45.72),
			candlestickDataAt(2000 as UTCTimestamp, 45.12, 53.9, 45.12, 48.09),
			candlestickDataAt(3000 as UTCTimestamp, 60.71, 60.71, 53.39, 59.29),
			candlestickDataAt(4000 as UTCTimestamp, 68.26, 68.26, 59.04, 60.5),
			candlestickDataAt(5000 as UTCTimestamp, 67.71, 105.85, 66.67, 91.04),
			candlestickDataAt(6000 as UTCTimestamp, 91.04, 121.4, 82.7, 111.4),
		];

		dataLayer.setSeriesData(series, testData);

		const [popped1, updateResponse1] = dataLayer.popSeriesData(series, 1);
		expect(popped1).to.have.length(1);
		expect(updateResponse1.series.get(series)?.data).to.have.length(5);
		expect(updateResponse1.timeScale.baseIndex).to.equal(4);
		expect(popped1[0].time).to.deep.equal({ timestamp: 6000 });
		expect(popped1[0].value[0]).to.equal(91.04); // open
		expect(popped1[0].value[1]).to.equal(121.4); // high
		expect(popped1[0].value[2]).to.equal(82.7); // low
		expect(popped1[0].value[3]).to.equal(111.4); // close

		const [popped2, updateResponse2] = dataLayer.popSeriesData(series, 2);
		expect(popped2).to.have.length(2);
		expect(updateResponse2.series.get(series)?.data).to.have.length(3);
		expect(updateResponse2.timeScale.baseIndex).to.equal(2);
		expect(popped2[0].time).to.deep.equal({ timestamp: 5000 });
		expect(popped2[1].time).to.deep.equal({ timestamp: 4000 });

		const [popped3, updateResponse3] = dataLayer.popSeriesData(series, 10);
		expect(popped3).to.have.length(3);
		expect(updateResponse3.series.get(series)?.data).to.have.length(0);
		expect(updateResponse3.timeScale.baseIndex).to.equal(0);
		expect(popped3[0].time).to.deep.equal({ timestamp: 3000 });
		expect(popped3[1].time).to.deep.equal({ timestamp: 2000 });
		expect(popped3[2].time).to.deep.equal({ timestamp: 1000 });

		const [popped4, updateResponse4] = dataLayer.popSeriesData(series, 1);
		expect(popped4).to.have.length(0);
		expect(updateResponse4.series.get(series)?.data).to.have.length(0);
		expect(updateResponse4.timeScale.baseIndex).to.equal(0);

		const [popped5, updateResponse5] = dataLayer.popSeriesData(series, 0);
		expect(popped5).to.have.length(0);
		expect(updateResponse5.series.has(series)).to.equal(false);
		expect(updateResponse5.timeScale.baseIndex).to.equal(0);
	});
});
