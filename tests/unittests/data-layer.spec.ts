import * as chai from 'chai';
import { expect } from 'chai';
import chaiExclude from 'chai-exclude';
import { describe, it } from 'mocha';

import { BarData, HistogramData, LineData, WhitespaceData } from '../../src/api/data-consumer';
import { convertTime, DataLayer, SeriesChanges, stringToBusinessDay } from '../../src/api/data-layer';
import { ensureDefined } from '../../src/helpers/assertions';
import { PlotRowValueIndex } from '../../src/model/plot-data';
import { PlotList } from '../../src/model/plot-list';
import { Series } from '../../src/model/series';
import { SeriesType } from '../../src/model/series-options';
import { BusinessDay, Time, TimePoint, TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

chai.use(chaiExclude);

function createSeriesMock<T extends SeriesType = SeriesType>(seriesType?: T): Series<T> {
	const data = new PlotList();

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		bars: () => data,
		seriesType: () => seriesType || 'Line',
	} as Series<T>;
}

// just for tests
function dataItemAt(time: Time): BarData & LineData & HistogramData {
	return { time, value: 0, open: 0, high: 0, low: 0, close: 0 };
}

function whitespaceItemAt(time: Time): WhitespaceData {
	return { time };
}

describe('DataLayer', () => {
	it('should be able to append new series with updating time scale', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();

		const updateResult1 = dataLayer.setSeriesData(series1, [dataItemAt(1000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);
		expect(updateResult1.timeScale.baseIndex).to.be.equal(1 as TimePointIndex);
		expect(updateResult1.timeScale.points).excludingEvery('pointData').to.have.deep.members([
			{ time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
			{ time: { timestamp: 3000 }, timeWeight: 22, originalTime: 3000 },
		]);
		expect(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(0);
		expect(updateResult1.series.size).to.be.equal(1);
		updateResult1.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			expect(series).to.be.equal(series1);
			expect(updatePacket.data.length).to.be.equal(2);

			expect(updatePacket.data[0].index).to.be.equal(0 as TimePointIndex);
			expect(updatePacket.data[0].time.timestamp).to.be.equal(1000 as UTCTimestamp);
			expect(updatePacket.data[1].index).to.be.equal(1 as TimePointIndex);
			expect(updatePacket.data[1].time.timestamp).to.be.equal(3000 as UTCTimestamp);
		});

		const updateResult2 = dataLayer.setSeriesData(series2, [dataItemAt(2000 as UTCTimestamp), dataItemAt(4000 as UTCTimestamp)]);
		expect(updateResult2.timeScale.baseIndex).to.be.equal(3 as TimePointIndex);
		expect(updateResult2.timeScale.points).excludingEvery('pointData').to.have.deep.members([
			{ time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
			{ time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
			{ time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
			{ time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
		]);
		expect(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(1);
		expect(updateResult2.series.size).to.be.equal(2);
		updateResult2.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			if (series === series1) {
				expect(updatePacket.data.length).to.be.equal(2);

				expect(updatePacket.data[0].index).to.be.equal(0 as TimePointIndex);
				expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 1000 });
				expect(updatePacket.data[1].index).to.be.equal(2 as TimePointIndex);
				expect(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 3000 });
			} else {
				expect(updatePacket.data[0].index).to.be.equal(1 as TimePointIndex);
				expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 2000 });
				expect(updatePacket.data[1].index).to.be.equal(3 as TimePointIndex);
				expect(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 4000 });
			}
		});
	});

	it('should be able to append new series WITHOUT updating time scale', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();

		dataLayer.setSeriesData(series1, [dataItemAt(1000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);
		const updateResult = dataLayer.setSeriesData(series2, [dataItemAt(1000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);
		expect(updateResult.timeScale.baseIndex).to.be.equal(1 as TimePointIndex);
		expect(updateResult.timeScale.points).to.be.equal(undefined);
		expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
		expect(updateResult.series.size).to.be.equal(1);

		const series2Updates = updateResult.series.get(series2);
		expect(series2Updates).not.to.be.equal(undefined);
		expect(series2Updates?.data.length).to.be.equal(2);

		const series2UpdatesData = series2Updates?.data || [];
		expect(series2UpdatesData[0].index).to.be.equal(0 as TimePointIndex);
		expect(series2UpdatesData[0].time).to.be.deep.equal({ timestamp: 1000 });
		expect(series2UpdatesData[1].index).to.be.equal(1 as TimePointIndex);
		expect(series2UpdatesData[1].time).to.be.deep.equal({ timestamp: 3000 });
	});

	it('should be able to remove series if time scale is changed', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();
		const series3 = createSeriesMock();

		dataLayer.setSeriesData(series1, [dataItemAt(2000 as UTCTimestamp), dataItemAt(5000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series2, [dataItemAt(3000 as UTCTimestamp), dataItemAt(7000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series3, [dataItemAt(4000 as UTCTimestamp), dataItemAt(6000 as UTCTimestamp)]);

		const updateResult = dataLayer.removeSeries(series3);

		expect(updateResult.timeScale.baseIndex).to.be.equal(3 as TimePointIndex);
		expect(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
			{ time: { timestamp: 2000 }, timeWeight: 70, originalTime: 2000 },
			{ time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
			{ time: { timestamp: 5000 }, timeWeight: 30, originalTime: 5000 },
			{ time: { timestamp: 7000 }, timeWeight: 22, originalTime: 7000 },
		]);
		expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(2);
		expect(updateResult.series.size).to.be.equal(3);

		const series1Update = updateResult.series.get(series1);
		expect(series1Update).not.to.be.equal(undefined);
		expect(series1Update?.data.length).to.be.equal(2);
		expect(series1Update?.data[0].index).to.be.equal(0 as TimePointIndex);
		expect(series1Update?.data[0].time).to.be.deep.equal({ timestamp: 2000 });
		expect(series1Update?.data[1].index).to.be.equal(2 as TimePointIndex);
		expect(series1Update?.data[1].time).to.be.deep.equal({ timestamp: 5000 });

		const series2Update = updateResult.series.get(series2);
		expect(series2Update).not.to.be.equal(undefined);
		expect(series2Update?.data.length).to.be.equal(2);
		expect(series2Update?.data[0].index).to.be.equal(1 as TimePointIndex);
		expect(series2Update?.data[0].time).to.be.deep.equal({ timestamp: 3000 });
		expect(series2Update?.data[1].index).to.be.equal(3 as TimePointIndex);
		expect(series2Update?.data[1].time).to.be.deep.equal({ timestamp: 7000 });

		const series3Update = updateResult.series.get(series3);
		expect(series3Update).not.to.be.equal(undefined);
		expect(series3Update?.data.length).to.be.equal(0);
	});

	it('should be able to remove series if time scale is NOT changed', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();
		const series3 = createSeriesMock();

		dataLayer.setSeriesData(series1, [dataItemAt(2000 as UTCTimestamp), dataItemAt(5000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series2, [dataItemAt(3000 as UTCTimestamp), dataItemAt(7000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series3, [dataItemAt(2000 as UTCTimestamp), dataItemAt(7000 as UTCTimestamp)]);

		const updateResult = dataLayer.removeSeries(series3);

		expect(updateResult.timeScale.points).to.be.equal(undefined);
		expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
		expect(updateResult.timeScale.baseIndex).to.be.equal(3 as TimePointIndex);
		expect(updateResult.series.size).to.be.equal(1);

		const series3Updates = updateResult.series.get(series3);
		expect(series3Updates).not.to.be.equal(undefined);
		expect(series3Updates?.data.length).to.be.equal(0);
	});

	it('should be able to add new point in the end', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();

		dataLayer.setSeriesData(series1, [dataItemAt(1000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series2, [dataItemAt(2000 as UTCTimestamp), dataItemAt(4000 as UTCTimestamp)]);

		// add a new point
		const updateResult1 = dataLayer.updateSeriesData(series1, dataItemAt(5000 as UTCTimestamp));
		expect(updateResult1.timeScale.baseIndex).to.be.equal(4 as TimePointIndex);
		expect(updateResult1.timeScale.points).excludingEvery('pointData').to.have.deep.members([
			{ time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
			{ time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
			{ time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
			{ time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
			{ time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
		]);
		expect(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(4);

		/* TODO: uncomment after make perf improvements in data layer
		expect(updateResult1.series.size).to.be.equal(1);
		updateResult1.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			expect(series).to.be.equal(series1);
			expect(updatePacket.data.length).to.be.equal(1);
			expect(updatePacket.data[0].index).to.be.equal(4 as TimePointIndex);
			expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 5000 });
		});
		*/

		// add one more point
		const updateResult2 = dataLayer.updateSeriesData(series2, dataItemAt(6000 as UTCTimestamp));
		expect(updateResult2.timeScale.baseIndex).to.be.equal(5 as TimePointIndex);
		expect(updateResult2.timeScale.points).excludingEvery('pointData').to.have.deep.members([
			{ time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
			{ time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
			{ time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
			{ time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
			{ time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
			{ time: { timestamp: 6000 }, timeWeight: 22, originalTime: 6000 },
		]);
		expect(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(5);

		/* TODO: uncomment after make perf improvements in data layer
		expect(updateResult2.series.size).to.be.equal(1);
		updateResult2.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			expect(series).to.be.equal(series2);
			expect(updatePacket.data.length).to.be.equal(1);
			expect(updatePacket.data[0].index).to.be.equal(5 as TimePointIndex);
			expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 6000 });
		});
		*/
	});

	it('should be able to change last existing point', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();

		dataLayer.setSeriesData(series1, [dataItemAt(1000 as UTCTimestamp), dataItemAt(4000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series2, [dataItemAt(2000 as UTCTimestamp), dataItemAt(4000 as UTCTimestamp)]);

		// change the last point of the first series
		const updateResult1 = dataLayer.updateSeriesData(series1, dataItemAt(4000 as UTCTimestamp));
		expect(updateResult1.timeScale.baseIndex).to.be.equal(2 as TimePointIndex);
		expect(updateResult1.timeScale.points).to.be.equal(undefined);
		expect(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(undefined);
		expect(updateResult1.series.size).to.be.equal(1);
		updateResult1.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			expect(series).to.be.equal(series1);
			expect(updatePacket.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
				{ index: 0, time: { timestamp: 1000 } },
				{ index: 2, time: { timestamp: 4000 } },
			]);
		});

		// change the last point of the second series
		const updateResult2 = dataLayer.updateSeriesData(series2, dataItemAt(4000 as UTCTimestamp));
		expect(updateResult2.timeScale.baseIndex).to.be.equal(2 as TimePointIndex);
		expect(updateResult2.timeScale.points).to.be.equal(undefined);
		expect(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(undefined);
		expect(updateResult2.series.size).to.be.equal(1);
		updateResult2.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			expect(series).to.be.equal(series2);
			expect(updatePacket.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
				{ index: 1, time: { timestamp: 2000 } },
				{ index: 2, time: { timestamp: 4000 } },
			]);
		});
	});

	it('should be able to add new point in the middle', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();

		dataLayer.setSeriesData(series1, [dataItemAt(5000 as UTCTimestamp), dataItemAt(6000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series2, [dataItemAt(2000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);

		// add a new point in the end of one series but not in the end of all points
		const updateResult = dataLayer.updateSeriesData(series2, dataItemAt(4000 as UTCTimestamp));
		expect(updateResult.timeScale.baseIndex).to.be.equal(4 as TimePointIndex);
		expect(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
			{ time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
			{ time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
			{ time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
			{ time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
			{ time: { timestamp: 6000 }, timeWeight: 22, originalTime: 6000 },
		]);
		expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(2);
		expect(updateResult.series.size).to.be.equal(2);
		updateResult.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			if (series === series1) {
				expect(updatePacket.data.length).to.be.equal(2);

				expect(updatePacket.data[0].index).to.be.equal(3 as TimePointIndex);
				expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 5000 });

				expect(updatePacket.data[1].index).to.be.equal(4 as TimePointIndex);
				expect(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 6000 });
			} else {
				expect(updatePacket.data.length).to.be.equal(3);

				expect(updatePacket.data[0].index).to.be.equal(0 as TimePointIndex);
				expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 2000 });

				expect(updatePacket.data[1].index).to.be.equal(1 as TimePointIndex);
				expect(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 3000 });

				expect(updatePacket.data[2].index).to.be.equal(2 as TimePointIndex);
				expect(updatePacket.data[2].time).to.be.deep.equal({ timestamp: 4000 });
			}
		});
	});

	it('allow business days', () => {
		const dataLayer = new DataLayer();
		const series1 = createSeriesMock();
		const date1: BusinessDay = { day: 1, month: 10, year: 2019 };
		const date2: BusinessDay = { day: 2, month: 10, year: 2019 };
		const updateResult1 = dataLayer.setSeriesData(series1, [dataItemAt(date1), dataItemAt(date2)]);

		expect(updateResult1.timeScale.baseIndex).to.be.equal(1 as TimePointIndex);

		const timePoint1: TimePoint = {
			businessDay: {
				day: 1,
				month: 10,
				year: 2019,
			},
			timestamp: 1569888000 as UTCTimestamp,
		};
		const timePoint2: TimePoint = {
			businessDay: {
				day: 2,
				month: 10,
				year: 2019,
			},
			timestamp: 1569974400 as UTCTimestamp,
		};

		expect(updateResult1.timeScale.points).excludingEvery('pointData').to.have.deep.members([
			{ time: timePoint1, timeWeight: 60, originalTime: { day: 1, month: 10, year: 2019 } },
			{ time: timePoint2, timeWeight: 50, originalTime: { day: 2, month: 10, year: 2019 } },
		]);
		expect(updateResult1.series.size).to.be.equal(1);
		updateResult1.series.forEach((updatePacket: SeriesChanges, series: Series) => {
			expect(series).to.be.equal(series);
			expect(updatePacket.data.length).to.be.equal(2);

			expect(updatePacket.data[0].index).to.be.equal(0 as TimePointIndex);
			expect(updatePacket.data[0].time.timestamp).to.be.equal(1569888000 as UTCTimestamp);
			expect(updatePacket.data[1].index).to.be.equal(1 as TimePointIndex);
			expect(updatePacket.data[1].time.timestamp).to.be.equal(1569974400 as UTCTimestamp);
		});
	});

	it('all points should have same time type', () => {
		const dataLayer = new DataLayer();
		const series = createSeriesMock();
		expect(() => dataLayer.setSeriesData(series, [dataItemAt(5000 as UTCTimestamp), dataItemAt({ day: 1, month: 10, year: 2019 })]))
			.to.throw();
	});

	it('all points should have same time type on updating', () => {
		const dataLayer = new DataLayer();
		const series = createSeriesMock();
		dataLayer.setSeriesData(series, [dataItemAt({ day: 1, month: 10, year: 2019 })]);
		expect(() => dataLayer.updateSeriesData(series, dataItemAt(5000 as UTCTimestamp)))
			.to.throw();
	});

	it('convertTime', () => {
		expect(convertTime(1554792010 as UTCTimestamp)).to.be.deep.equal({ timestamp: 1554792010 });
		const bd: BusinessDay = { day: 1, month: 10, year: 2018 };
		expect(convertTime(bd)).to.be.deep.equal({ timestamp: 1538352000, businessDay: bd });
	});

	it('stringToBusinessDay', () => {
		expect(stringToBusinessDay('2019-05-01')).to.be.deep.equal({ day: 1, month: 5, year: 2019 });
		expect(() => stringToBusinessDay('2019-15-01')).to.throw();
	});

	it('stringToBusinessDay', () => {
		expect(stringToBusinessDay('2019-05-01')).to.be.deep.equal({ day: 1, month: 5, year: 2019 });
		expect(() => stringToBusinessDay('2019-15-01')).to.throw();
	});

	it('should ignore "value" fields on OHLC-based series update', () => {
		const ohlcBasedTypes: SeriesType[] = ['Bar', 'Candlestick'];

		for (const seriesType of ohlcBasedTypes) {
			const dataLayer = new DataLayer();
			const series = createSeriesMock(seriesType);

			const item: BarData & LineData = {
				time: '2017-01-01',
				open: 10,
				high: 15,
				low: 5,
				close: 11,
				value: 100,
			};

			const packet = dataLayer.setSeriesData(series, [item]);
			const update = ensureDefined(packet.series.get(series));

			expect(update.data[0].value[PlotRowValueIndex.Open]).to.be.equal(item.open);
			expect(update.data[0].value[PlotRowValueIndex.High]).to.be.equal(item.high);
			expect(update.data[0].value[PlotRowValueIndex.Low]).to.be.equal(item.low);
			expect(update.data[0].value[PlotRowValueIndex.Close]).to.be.equal(item.close);
		}
	});

	it('should update removed series data gh#752', () => {
		function generateData(): LineData[] {
			const res = [];
			const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));

			for (let i = 0; i < 10; ++i) {
				const timestamp = time.getTime() / 1000;
				res.push(dataItemAt(timestamp as UTCTimestamp));
				time.setUTCDate(time.getUTCDate() + 1);
			}

			return res;
		}

		const dataLayer = new DataLayer();
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();
		const data1 = generateData();
		const data2 = generateData();
		dataLayer.setSeriesData(series1, data1);
		dataLayer.setSeriesData(series2, data2);

		const updateResult1 = dataLayer.setSeriesData(series1, []);

		expect(updateResult1.timeScale.baseIndex).to.be.equal(9, 'expected base index to be 9');
		expect(updateResult1.timeScale.points).to.be.equal(undefined, 'expected updated time scale points to be undefined');
		expect(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(undefined);
		expect(updateResult1.series.has(series1)).to.be.equal(true, 'expected to contain series1');
		expect(updateResult1.series.get(series1)?.data.length).to.be.equal(0, 'expected series1 data to be empty');

		const updateResult2 = dataLayer.setSeriesData(series2, []);

		expect(updateResult2.timeScale.baseIndex).to.be.equal(null, 'expected base index to be null');
		expect(updateResult2.timeScale.points?.length).to.be.equal(0, 'expected updated time scale points length to equal 0');
		expect(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(0);
		expect(updateResult2.series.has(series2)).to.be.equal(true, 'expected to contain series2');
		expect(updateResult2.series.get(series2)?.data.length).to.be.equal(0, 'expected series2 data to be empty');

		const updateResult3 = dataLayer.setSeriesData(series1, data1);

		expect(updateResult3.timeScale.baseIndex).to.be.equal(9, 'expected base index to be 9');
		expect(updateResult3.timeScale.points?.length).to.be.equal(10, 'expected updated time scale points length to equal 10');
		expect(updateResult3.timeScale.firstChangedPointIndex).to.be.equal(0);
		expect(updateResult3.series.has(series1)).to.be.equal(true, 'expected to contain series1');
		expect(updateResult3.series.get(series1)?.data.length).to.be.equal(data1.length, 'expected series1 data to be non-empty');

		const updateResult4 = dataLayer.setSeriesData(series2, data2);

		expect(updateResult4.timeScale.baseIndex).to.be.equal(9, 'expected base index to be 9');
		expect(updateResult4.timeScale.points).to.be.equal(undefined, 'expected updated time scale points to be undefined');
		expect(updateResult4.timeScale.firstChangedPointIndex).to.be.equal(undefined);
		expect(updateResult4.series.has(series2)).to.be.equal(true, 'expected to contain series2');
		expect(updateResult4.series.get(series2)?.data.length).to.be.equal(data2.length, 'expected series1 data to be non-empty');
	});

	it('should correctly update indexes of series data if times are not changed', () => {
		const dataLayer = new DataLayer();

		const series = createSeriesMock();

		dataLayer.setSeriesData(series, [dataItemAt(1000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);

		const updateResult = dataLayer.setSeriesData(series, [dataItemAt(1000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);
		expect(updateResult.timeScale.baseIndex).to.be.equal(1 as TimePointIndex);
		expect(updateResult.timeScale.points).to.be.equal(undefined);
		expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
		expect(updateResult.series.size).to.be.equal(1);

		const seriesUpdate = updateResult.series.get(series);
		expect(seriesUpdate).not.to.be.equal(undefined);

		expect(seriesUpdate?.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
			{ index: 0, time: { timestamp: 1000 } },
			{ index: 1, time: { timestamp: 3000 } },
		]);
	});

	describe('should update base index to null when all series data is cleared gh#757', () => {
		const data: LineData[] = [
			{
				time: 1609459200 as UTCTimestamp,
				value: 31.533026412262345,
			},
			{
				time: 1609545600 as UTCTimestamp,
				value: 6.568118452269189,
			},
			{
				time: 1609632000 as UTCTimestamp,
				value: 98.62539451897008,
			},
			{
				time: 1609718400 as UTCTimestamp,
				value: 46.767718860541606,
			},
			{
				time: 1609804800 as UTCTimestamp,
				value: 36.955748002496655,
			},
			{
				time: 1609891200 as UTCTimestamp,
				value: 85.96192548047124,
			},
			{
				time: 1609977600 as UTCTimestamp,
				value: 72.75990512152876,
			},
			{
				time: 1610064000 as UTCTimestamp,
				value: 2.993469032310503,
			},
			{
				time: 1610150400 as UTCTimestamp,
				value: 4.258319318756176,
			},
			{
				time: 1610236800 as UTCTimestamp,
				value: 60.0150296893859,
			},
		];

		it('single series', () => {
			const dataLayer = new DataLayer();
			const series = createSeriesMock();

			dataLayer.setSeriesData(series, data);

			const updateResult = dataLayer.setSeriesData(series, []);

			expect(updateResult.timeScale.baseIndex).to.be.equal(null);
		});

		it('multiple series', () => {
			const seriesCount = 5;
			const dataLayer = new DataLayer();
			const series = [];

			for (let i = 0; i < seriesCount; i++) {
				series[i] = createSeriesMock();
				dataLayer.setSeriesData(series[i], data);
			}

			for (let i = 0; i < series.length; i++) {
				const updateResult = dataLayer.setSeriesData(series[i], []);

				if (i === series.length - 1) {
					// the last series was cleared so we expect a null base index
					expect(updateResult.timeScale.baseIndex).to.be.equal(null);
				} else {
					// some series still have data so we expected a non-null base index
					expect(updateResult.timeScale.baseIndex).not.to.be.equal(null);
				}
			}
		});
	});

	describe('should be able to remove series and generate full update to other series if time scale is changed gh#355', () => {
		const barsCount = 10;
		function generateData(startTime: number, step: number): LineData[] {
			const res = [];
			let time = startTime;
			for (let i = 0; i < barsCount; ++i) {
				res.push(dataItemAt(time as UTCTimestamp));
				time += step;
			}

			return res;
		}

		it('remove first series', () => {
			const dataLayer = new DataLayer();

			const series1 = createSeriesMock();
			const series2 = createSeriesMock();

			dataLayer.setSeriesData(series1, generateData(1, 3));
			dataLayer.setSeriesData(series2, generateData(4, 1));

			const updateResult = dataLayer.removeSeries(series1);
			expect(updateResult.timeScale.points).not.to.be.equal(undefined);
			expect(updateResult.timeScale.firstChangedPointIndex).not.to.be.equal(undefined);
			expect(updateResult.timeScale.baseIndex).to.be.equal(barsCount - 1);

			expect(updateResult.series.size).to.be.equal(2);

			const series1Update = updateResult.series.get(series1);
			expect(series1Update).not.to.be.equal(undefined);
			expect(series1Update?.data.length).to.be.equal(0);

			const series2Update = updateResult.series.get(series2);
			expect(series2Update).not.to.be.equal(undefined);
			expect(series2Update?.data.length).to.be.equal(barsCount);
		});

		it('remove second series', () => {
			const dataLayer = new DataLayer();

			const series1 = createSeriesMock();
			const series2 = createSeriesMock();

			dataLayer.setSeriesData(series1, generateData(1, 3));
			dataLayer.setSeriesData(series2, generateData(4, 1));

			const updateResult = dataLayer.removeSeries(series2);
			expect(updateResult.timeScale.points).not.to.be.equal(undefined);
			expect(updateResult.timeScale.firstChangedPointIndex).not.to.be.equal(undefined);
			expect(updateResult.timeScale.baseIndex).to.be.equal(barsCount - 1);

			expect(updateResult.series.size).to.be.equal(2);

			const series1Update = updateResult.series.get(series1);
			expect(series1Update).not.to.be.equal(undefined);
			expect(series1Update?.data.length).to.be.equal(barsCount);

			const series2Update = updateResult.series.get(series2);
			expect(series2Update).not.to.be.equal(undefined);
			expect(series2Update?.data.length).to.be.equal(0);
		});
	});

	describe('whitespaces', () => {
		it('should allow to set whitespaces to series', () => {
			const dataLayer = new DataLayer();

			const series = createSeriesMock();

			const updateResult = dataLayer.setSeriesData(series, [
				dataItemAt(1000 as UTCTimestamp),
				whitespaceItemAt(2000 as UTCTimestamp),
				whitespaceItemAt(3000 as UTCTimestamp),
				dataItemAt(4000 as UTCTimestamp),
			]);

			expect(updateResult.timeScale.baseIndex).to.be.equal(3 as TimePointIndex);
			expect(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
				{ time: { timestamp: 1000 }, timeWeight: 21, originalTime: 1000 },
				{ time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
				{ time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
				{ time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
			]);
			expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(0);

			expect(updateResult.series.size).to.be.equal(1);

			const seriesUpdate = updateResult.series.get(series) as SeriesChanges;
			expect(seriesUpdate).not.to.be.equal(undefined);
			expect(seriesUpdate.data.length).to.be.equal(2);

			expect(seriesUpdate.data[0].index).to.be.equal(0 as TimePointIndex);
			expect(seriesUpdate.data[0].time.timestamp).to.be.equal(1000 as UTCTimestamp);

			expect(seriesUpdate.data[1].index).to.be.equal(3 as TimePointIndex);
			expect(seriesUpdate.data[1].time.timestamp).to.be.equal(4000 as UTCTimestamp);
		});

		it('should allow to append whitespace via update', () => {
			const dataLayer = new DataLayer();

			const series = createSeriesMock();

			dataLayer.setSeriesData(series, [
				dataItemAt(1000 as UTCTimestamp),
				dataItemAt(4000 as UTCTimestamp),
			]);

			const updateResult = dataLayer.updateSeriesData(series, whitespaceItemAt(5000 as UTCTimestamp));

			expect(updateResult.timeScale.baseIndex).to.be.equal(1 as TimePointIndex);
			expect(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
				{ time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
				{ time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
				{ time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
			]);
			expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(2);

			expect(updateResult.series.size).to.be.equal(1);

			const seriesUpdate = updateResult.series.get(series) as SeriesChanges;
			expect(seriesUpdate).not.to.be.equal(undefined);
			expect(seriesUpdate.data.length).to.be.equal(2);

			expect(seriesUpdate.data[0].index).to.be.equal(0 as TimePointIndex);
			expect(seriesUpdate.data[0].time.timestamp).to.be.equal(1000 as UTCTimestamp);

			expect(seriesUpdate.data[1].index).to.be.equal(1 as TimePointIndex);
			expect(seriesUpdate.data[1].time.timestamp).to.be.equal(4000 as UTCTimestamp);
		});

		it('should allow to replace whitespace with bar', () => {
			const dataLayer = new DataLayer();

			const series = createSeriesMock();

			dataLayer.setSeriesData(series, [
				dataItemAt(1000 as UTCTimestamp),
				dataItemAt(4000 as UTCTimestamp),
				whitespaceItemAt(5000 as UTCTimestamp),
			]);

			const updateResult = dataLayer.updateSeriesData(series, dataItemAt(5000 as UTCTimestamp));

			expect(updateResult.timeScale.baseIndex).to.be.equal(2 as TimePointIndex);
			expect(updateResult.timeScale.points).to.be.equal(undefined);
			expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);

			expect(updateResult.series.size).to.be.equal(1);

			const seriesUpdate = updateResult.series.get(series) as SeriesChanges;
			expect(seriesUpdate).not.to.be.equal(undefined);

			expect(seriesUpdate.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
				{ index: 0, time: { timestamp: 1000 } },
				{ index: 1, time: { timestamp: 4000 } },
				{ index: 2, time: { timestamp: 5000 } },
			]);
		});

		it('should allow to replace bar with whitespace', () => {
			const dataLayer = new DataLayer();

			const series = createSeriesMock();

			dataLayer.setSeriesData(series, [
				dataItemAt(1000 as UTCTimestamp),
				dataItemAt(4000 as UTCTimestamp),
				dataItemAt(5000 as UTCTimestamp),
			]);

			const updateResult = dataLayer.updateSeriesData(series, whitespaceItemAt(5000 as UTCTimestamp));

			expect(updateResult.timeScale.baseIndex).to.be.equal(1 as TimePointIndex);
			expect(updateResult.timeScale.points).to.be.equal(undefined);
			expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);

			expect(updateResult.series.size).to.be.equal(1);

			const seriesUpdate = updateResult.series.get(series) as SeriesChanges;
			expect(seriesUpdate).not.to.be.equal(undefined);
			expect(seriesUpdate.data.length).to.be.equal(2);

			expect(seriesUpdate.data[0].index).to.be.equal(0 as TimePointIndex);
			expect(seriesUpdate.data[0].time.timestamp).to.be.equal(1000 as UTCTimestamp);

			expect(seriesUpdate.data[1].index).to.be.equal(1 as TimePointIndex);
			expect(seriesUpdate.data[1].time.timestamp).to.be.equal(4000 as UTCTimestamp);
		});

		it('should generate full update if whitespace extends timescale', () => {
			const dataLayer = new DataLayer();

			const series1 = createSeriesMock();
			const series2 = createSeriesMock();

			dataLayer.setSeriesData(series1, [
				dataItemAt(1000 as UTCTimestamp),
				dataItemAt(5000 as UTCTimestamp),
			]);

			dataLayer.setSeriesData(series2, [
				dataItemAt(2000 as UTCTimestamp),
				dataItemAt(3000 as UTCTimestamp),
			]);

			const updateResult = dataLayer.updateSeriesData(series2, whitespaceItemAt(4000 as UTCTimestamp));

			expect(updateResult.timeScale.baseIndex).to.be.equal(4 as TimePointIndex);
			expect(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
				{ time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
				{ time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
				{ time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
				{ time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
				{ time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
			]);
			expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(3);

			expect(updateResult.series.size).to.be.equal(2);

			updateResult.series.forEach((seriesUpdate: SeriesChanges, series: Series) => {
				expect(seriesUpdate.data.length).to.be.equal(2);

				if (series === series1) {
					expect(seriesUpdate.data[0].index).to.be.equal(0 as TimePointIndex);
					expect(seriesUpdate.data[0].time.timestamp).to.be.equal(1000 as UTCTimestamp);

					expect(seriesUpdate.data[1].index).to.be.equal(4 as TimePointIndex);
					expect(seriesUpdate.data[1].time.timestamp).to.be.equal(5000 as UTCTimestamp);
				} else {
					expect(seriesUpdate.data[0].index).to.be.equal(1 as TimePointIndex);
					expect(seriesUpdate.data[0].time.timestamp).to.be.equal(2000 as UTCTimestamp);

					expect(seriesUpdate.data[1].index).to.be.equal(2 as TimePointIndex);
					expect(seriesUpdate.data[1].time.timestamp).to.be.equal(3000 as UTCTimestamp);
				}
			});
		});

		it('should remove old whitespaces while setting new data', () => {
			const dataLayer = new DataLayer();

			const series1 = createSeriesMock();
			const series2 = createSeriesMock();

			dataLayer.setSeriesData(series1, [
				dataItemAt(1000 as UTCTimestamp),
				dataItemAt(5000 as UTCTimestamp),
			]);

			dataLayer.setSeriesData(series2, [
				dataItemAt(2000 as UTCTimestamp),
				dataItemAt(3000 as UTCTimestamp),
				whitespaceItemAt(4000 as UTCTimestamp),
			]);

			const updateResult = dataLayer.setSeriesData(series2, [
				dataItemAt(2000 as UTCTimestamp),
				dataItemAt(3000 as UTCTimestamp),
				whitespaceItemAt(6000 as UTCTimestamp),
			]);

			expect(updateResult.timeScale.baseIndex).to.be.equal(3 as TimePointIndex);
			expect(updateResult.timeScale.points).excludingEvery(['pointData', 'originalTime']).to.have.deep.members([
				{ time: { timestamp: 1000 }, timeWeight: 70 },
				{ time: { timestamp: 2000 }, timeWeight: 22 },
				{ time: { timestamp: 3000 }, timeWeight: 21 },
				{ time: { timestamp: 5000 }, timeWeight: 30 },
				{ time: { timestamp: 6000 }, timeWeight: 22 },
			]);
			expect(updateResult.timeScale.firstChangedPointIndex).to.be.equal(3);

			expect(updateResult.series.size).to.be.equal(2);

			updateResult.series.forEach((seriesUpdate: SeriesChanges, series: Series) => {
				expect(seriesUpdate.data.length).to.be.equal(2);

				if (series === series1) {
					expect(seriesUpdate.data[0].index).to.be.equal(0 as TimePointIndex);
					expect(seriesUpdate.data[0].time.timestamp).to.be.equal(1000 as UTCTimestamp);

					expect(seriesUpdate.data[1].index).to.be.equal(3 as TimePointIndex);
					expect(seriesUpdate.data[1].time.timestamp).to.be.equal(5000 as UTCTimestamp);
				} else {
					expect(seriesUpdate.data[0].index).to.be.equal(1 as TimePointIndex);
					expect(seriesUpdate.data[0].time.timestamp).to.be.equal(2000 as UTCTimestamp);

					expect(seriesUpdate.data[1].index).to.be.equal(2 as TimePointIndex);
					expect(seriesUpdate.data[1].time.timestamp).to.be.equal(3000 as UTCTimestamp);
				}
			});
		});
	});
});
