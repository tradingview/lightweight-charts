import { expect } from 'chai';
import { describe, it } from 'mocha';

import { BarData, HistogramData, LineData } from '../../src/api/data-consumer';
import { convertTime, DataLayer, SeriesUpdatePacket, stringToBusinessDay, TimedData } from '../../src/api/data-layer';
import { ensureDefined } from '../../src/helpers/assertions';
import { Palette } from '../../src/model/palette';
import { Series } from '../../src/model/series';
import { SeriesData, SeriesPlotIndex } from '../../src/model/series-data';
import { SeriesType } from '../../src/model/series-options';
import { BusinessDay, TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

// TODO: add tests for marks spans

function createSeriesMock<T extends SeriesType = 'Line'>(seriesType?: T): Series<T> {
	const data = new SeriesData();
	// tslint:disable-next-line:no-object-literal-type-assertion
	return {
		data: () => data,
		palette: () => new Palette(),
		seriesType: () => seriesType || 'Line',
		clearData: () => data.clear(),
	} as Series<T>;
}

// just for tests
function dataItemAt(time: TimedData['time']): BarData & LineData & HistogramData {
	return { time, value: 0, open: 0, high: 0, low: 0, close: 0 };
}

describe('DataLayer', () => {
	it('should be able to append new series', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();

		const updateResult1 = dataLayer.setSeriesData(series1, [dataItemAt(1000 as UTCTimestamp), dataItemAt(3000 as UTCTimestamp)]);
		expect(updateResult1.timeScaleUpdate.index).to.be.equal(0 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.changes).to.have.deep.members([{ timestamp: 1000 }, { timestamp: 3000 }]);
		expect(updateResult1.timeScaleUpdate.seriesUpdates.size).to.be.equal(1);
		updateResult1.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			expect(series).to.be.equal(series1);
			expect(updatePacket.update.length).to.be.equal(2);

			expect(updatePacket.update[0].index).to.be.equal(0 as TimePointIndex);
			expect(updatePacket.update[0].time.timestamp).to.be.equal(1000 as UTCTimestamp);
			expect(updatePacket.update[1].index).to.be.equal(1 as TimePointIndex);
			expect(updatePacket.update[1].time.timestamp).to.be.equal(3000 as UTCTimestamp);
		});
		expect(updateResult1.timeScaleUpdate.marks.length).to.be.equal(2);
		expect(updateResult1.timeScaleUpdate.marks[0].index).to.be.equal(0 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.marks[0].time).to.be.deep.equal({ timestamp: 1000 });

		expect(updateResult1.timeScaleUpdate.marks[1].index).to.be.equal(1 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.marks[1].time).to.be.deep.equal({ timestamp: 3000 });

		const updateResult2 = dataLayer.setSeriesData(series2, [dataItemAt(2000 as UTCTimestamp), dataItemAt(4000 as UTCTimestamp)]);
		expect(updateResult2.timeScaleUpdate.index).to.be.equal(0 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.changes).to.have.deep.members(
			[{ timestamp: 1000 }, { timestamp: 2000 }, { timestamp: 3000 }, { timestamp: 4000 }]);
		expect(updateResult2.timeScaleUpdate.seriesUpdates.size).to.be.equal(2);
		updateResult2.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			if (series === series1) {
				expect(updatePacket.update.length).to.be.equal(2);

				expect(updatePacket.update[0].index).to.be.equal(0 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 1000 });
				expect(updatePacket.update[1].index).to.be.equal(2 as TimePointIndex);
				expect(updatePacket.update[1].time).to.be.deep.equal({ timestamp: 3000 });
			} else {
				expect(updatePacket.update[0].index).to.be.equal(1 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 2000 });
				expect(updatePacket.update[1].index).to.be.equal(3 as TimePointIndex);
				expect(updatePacket.update[1].time).to.be.deep.equal({ timestamp: 4000 });
			}
		});
		expect(updateResult2.timeScaleUpdate.marks.length).to.be.equal(4);
		expect(updateResult2.timeScaleUpdate.marks[0].index).to.be.equal(0 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[0].time).to.be.deep.equal({ timestamp: 1000 });

		expect(updateResult2.timeScaleUpdate.marks[1].index).to.be.equal(1 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[1].time).to.be.deep.equal({ timestamp: 2000 });

		expect(updateResult2.timeScaleUpdate.marks[2].index).to.be.equal(2 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[2].time).to.be.deep.equal({ timestamp: 3000 });

		expect(updateResult2.timeScaleUpdate.marks[3].index).to.be.equal(3 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[3].time).to.be.deep.equal({ timestamp: 4000 });
	});

	it('should be able to remove series', () => {
		const dataLayer = new DataLayer();

		// actually we don't need to use Series, so we just use new Object()
		const series1 = createSeriesMock();
		const series2 = createSeriesMock();
		const series3 = createSeriesMock();

		dataLayer.setSeriesData(series1, [dataItemAt(2000 as UTCTimestamp), dataItemAt(5000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series2, [dataItemAt(3000 as UTCTimestamp), dataItemAt(7000 as UTCTimestamp)]);
		dataLayer.setSeriesData(series3, [dataItemAt(4000 as UTCTimestamp), dataItemAt(6000 as UTCTimestamp)]);

		const updateResult = dataLayer.removeSeries(series3);

		expect(updateResult.timeScaleUpdate.index).to.be.equal(0 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.changes.length).to.be.equal(4);
		expect(updateResult.timeScaleUpdate.changes).to.have.deep.members(
			[{ timestamp: 2000 }, { timestamp: 3000 }, { timestamp: 5000 }, { timestamp: 7000 }]);
		expect(updateResult.timeScaleUpdate.seriesUpdates.size).to.be.equal(2);
		updateResult.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			if (series === series1) {
				expect(updatePacket.update.length).to.be.equal(2);

				expect(updatePacket.update[0].index).to.be.equal(0 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 2000 });
				expect(updatePacket.update[1].index).to.be.equal(2 as TimePointIndex);
				expect(updatePacket.update[1].time).to.be.deep.equal({ timestamp: 5000 });
			} else {
				expect(updatePacket.update[0].index).to.be.equal(1 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 3000 });
				expect(updatePacket.update[1].index).to.be.equal(3 as TimePointIndex);
				expect(updatePacket.update[1].time).to.be.deep.equal({ timestamp: 7000 });
			}
		});
		expect(updateResult.timeScaleUpdate.marks.length).to.be.equal(4);
		expect(updateResult.timeScaleUpdate.marks[0].index).to.be.equal(0 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.marks[0].time).to.be.deep.equal({ timestamp: 2000 });

		expect(updateResult.timeScaleUpdate.marks[1].index).to.be.equal(1 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.marks[1].time).to.be.deep.equal({ timestamp: 3000 });

		expect(updateResult.timeScaleUpdate.marks[2].index).to.be.equal(2 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.marks[2].time).to.be.deep.equal({ timestamp: 5000 });

		expect(updateResult.timeScaleUpdate.marks[3].index).to.be.equal(3 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.marks[3].time).to.be.deep.equal({ timestamp: 7000 });
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
		expect(updateResult1.timeScaleUpdate.index).to.be.equal(4 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.changes).to.have.deep.members([{ timestamp: 5000 }]);
		expect(updateResult1.timeScaleUpdate.seriesUpdates.size).to.be.equal(1);
		updateResult1.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			expect(series).to.be.equal(series1);
			expect(updatePacket.update.length).to.be.equal(1);
			expect(updatePacket.update[0].index).to.be.equal(4 as TimePointIndex);
			expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 5000 });
		});
		expect(updateResult1.timeScaleUpdate.marks.length).to.be.equal(1);
		expect(updateResult1.timeScaleUpdate.marks[0].index).to.be.equal(4 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.marks[0].time).to.be.deep.equal({ timestamp: 5000 });

		// add one more point
		const updateResult2 = dataLayer.updateSeriesData(series2, dataItemAt(6000 as UTCTimestamp));
		expect(updateResult2.timeScaleUpdate.index).to.be.equal(5 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.changes).to.have.deep.members([{ timestamp: 6000 }]);
		expect(updateResult2.timeScaleUpdate.seriesUpdates.size).to.be.equal(1);
		updateResult2.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			expect(series).to.be.equal(series2);
			expect(updatePacket.update.length).to.be.equal(1);
			expect(updatePacket.update[0].index).to.be.equal(5 as TimePointIndex);
			expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 6000 });
		});
		expect(updateResult2.timeScaleUpdate.marks.length).to.be.equal(1);
		expect(updateResult2.timeScaleUpdate.marks[0].index).to.be.equal(5 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[0].time).to.be.deep.equal({ timestamp: 6000 });
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
		expect(updateResult1.timeScaleUpdate.index).to.be.equal(2 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.changes.length).to.be.equal(0);
		expect(updateResult1.timeScaleUpdate.seriesUpdates.size).to.be.equal(1);
		updateResult1.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			expect(series).to.be.equal(series1);
			expect(updatePacket.update.length).to.be.equal(1);
			expect(updatePacket.update[0].index).to.be.equal(2 as TimePointIndex);
			expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 4000 });
		});
		expect(updateResult1.timeScaleUpdate.marks.length).to.be.equal(0);

		// change the last point of the second series
		const updateResult2 = dataLayer.updateSeriesData(series2, dataItemAt(4000 as UTCTimestamp));
		expect(updateResult2.timeScaleUpdate.index).to.be.equal(2 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.changes.length).to.be.equal(0);
		expect(updateResult2.timeScaleUpdate.seriesUpdates.size).to.be.equal(1);
		updateResult2.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			expect(series).to.be.equal(series2);
			expect(updatePacket.update.length).to.be.equal(1);
			expect(updatePacket.update[0].index).to.be.equal(2 as TimePointIndex);
			expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 4000 });
		});
		expect(updateResult2.timeScaleUpdate.marks.length).to.be.equal(0);
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
		expect(updateResult.timeScaleUpdate.index).to.be.equal(2 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.changes).to.have.deep.members(
			[{ timestamp: 4000 }, { timestamp: 5000 }, { timestamp: 6000 }]);
		expect(updateResult.timeScaleUpdate.seriesUpdates.size).to.be.equal(2);
		updateResult.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			if (series === series1) {
				expect(updatePacket.update.length).to.be.equal(2);
				expect(updatePacket.update[0].index).to.be.equal(3 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 5000 });
				expect(updatePacket.update[1].index).to.be.equal(4 as TimePointIndex);
				expect(updatePacket.update[1].time).to.be.deep.equal({ timestamp: 6000 });
			} else {
				expect(updatePacket.update.length).to.be.equal(1);
				expect(updatePacket.update[0].index).to.be.equal(2 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 4000 });
			}
		});
		expect(updateResult.timeScaleUpdate.marks.length).to.be.equal(3);
		expect(updateResult.timeScaleUpdate.marks[0].index).to.be.equal(2 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.marks[1].index).to.be.equal(3 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.marks[2].index).to.be.equal(4 as TimePointIndex);
		expect(updateResult.timeScaleUpdate.marks[0].time).to.be.deep.equal({ timestamp: 4000 });
		expect(updateResult.timeScaleUpdate.marks[1].time).to.be.deep.equal({ timestamp: 5000 });
		expect(updateResult.timeScaleUpdate.marks[2].time).to.be.deep.equal({ timestamp: 6000 });

		// add a new point before all points
		const updateResult2 = dataLayer.updateSeriesData(series2, dataItemAt(1000 as UTCTimestamp));
		expect(updateResult2.timeScaleUpdate.index).to.be.equal(0 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.changes).to.have.deep.members(
			[{ timestamp: 1000 }, { timestamp: 2000 }, { timestamp: 3000 }, { timestamp: 4000 }, { timestamp: 5000 }, { timestamp: 6000 }]);
		expect(updateResult2.timeScaleUpdate.seriesUpdates.size).to.be.equal(2);
		updateResult2.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			if (series === series1) {
				expect(updatePacket.update.length).to.be.equal(2);
				expect(updatePacket.update[0].index).to.be.equal(4 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 5000 });

				expect(updatePacket.update[1].index).to.be.equal(5 as TimePointIndex);
				expect(updatePacket.update[1].time).to.be.deep.equal({ timestamp: 6000 });
			} else {
				expect(updatePacket.update.length).to.be.equal(4);
				expect(updatePacket.update[0].index).to.be.equal(0 as TimePointIndex);
				expect(updatePacket.update[0].time).to.be.deep.equal({ timestamp: 1000 });

				expect(updatePacket.update[1].index).to.be.equal(1 as TimePointIndex);
				expect(updatePacket.update[1].time).to.be.deep.equal({ timestamp: 2000 });

				expect(updatePacket.update[2].index).to.be.equal(2 as TimePointIndex);
				expect(updatePacket.update[2].time).to.be.deep.equal({ timestamp: 3000 });

				expect(updatePacket.update[3].index).to.be.equal(3 as TimePointIndex);
				expect(updatePacket.update[3].time).to.be.deep.equal({ timestamp: 4000 });
			}
		});
		expect(updateResult2.timeScaleUpdate.marks.length).to.be.equal(6);
		expect(updateResult2.timeScaleUpdate.marks[0].index).to.be.equal(0 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[1].index).to.be.equal(1 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[2].index).to.be.equal(2 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[3].index).to.be.equal(3 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[4].index).to.be.equal(4 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[5].index).to.be.equal(5 as TimePointIndex);
		expect(updateResult2.timeScaleUpdate.marks[0].time).to.be.deep.equal({ timestamp: 1000 });
		expect(updateResult2.timeScaleUpdate.marks[1].time).to.be.deep.equal({ timestamp: 2000 });
		expect(updateResult2.timeScaleUpdate.marks[2].time).to.be.deep.equal({ timestamp: 3000 });
		expect(updateResult2.timeScaleUpdate.marks[3].time).to.be.deep.equal({ timestamp: 4000 });
		expect(updateResult2.timeScaleUpdate.marks[4].time).to.be.deep.equal({ timestamp: 5000 });
		expect(updateResult2.timeScaleUpdate.marks[5].time).to.be.deep.equal({ timestamp: 6000 });
	});

	it('allow business days', () => {
		const dataLayer = new DataLayer();
		const series1 = createSeriesMock();
		const date1: BusinessDay = { day: 1, month: 10, year: 2019 };
		const date2: BusinessDay = { day: 2, month: 10, year: 2019 };
		const updateResult1 = dataLayer.setSeriesData(series1, [dataItemAt(date1), dataItemAt(date2)]);

		expect(updateResult1.timeScaleUpdate.index).to.be.equal(0 as TimePointIndex);

		const timePoint1 = {
			businessDay: {
				day: 1,
				month: 10,
				year: 2019,
			},
			timestamp: 1569888000,
		};
		const timePoint2 = {
			businessDay: {
				day: 2,
				month: 10,
				year: 2019,
			},
			timestamp: 1569974400,
		};

		expect(updateResult1.timeScaleUpdate.changes).to.have.deep.members([timePoint1, timePoint2]);
		expect(updateResult1.timeScaleUpdate.seriesUpdates.size).to.be.equal(1);
		updateResult1.timeScaleUpdate.seriesUpdates.forEach((updatePacket: SeriesUpdatePacket, series: Series) => {
			expect(series).to.be.equal(series);
			expect(updatePacket.update.length).to.be.equal(2);

			expect(updatePacket.update[0].index).to.be.equal(0 as TimePointIndex);
			expect(updatePacket.update[0].time.timestamp).to.be.equal(1569888000 as UTCTimestamp);
			expect(updatePacket.update[1].index).to.be.equal(1 as TimePointIndex);
			expect(updatePacket.update[1].time.timestamp).to.be.equal(1569974400 as UTCTimestamp);
		});
		expect(updateResult1.timeScaleUpdate.marks.length).to.be.equal(2);
		expect(updateResult1.timeScaleUpdate.marks[0].index).to.be.equal(0 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.marks[0].time).to.be.deep.equal(timePoint1);

		expect(updateResult1.timeScaleUpdate.marks[1].index).to.be.equal(1 as TimePointIndex);
		expect(updateResult1.timeScaleUpdate.marks[1].time).to.be.deep.equal(timePoint2);
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
		const packet = dataLayer.setSeriesData(series, [dataItemAt({ day: 1, month: 10, year: 2019 })]);
		const update = ensureDefined(packet.timeScaleUpdate.seriesUpdates.get(series));
		series.data().bars().merge(update.update);
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
			const update = ensureDefined(packet.timeScaleUpdate.seriesUpdates.get(series));

			expect(update.update[0].value[SeriesPlotIndex.Open]).to.be.equal(item.open);
			expect(update.update[0].value[SeriesPlotIndex.High]).to.be.equal(item.high);
			expect(update.update[0].value[SeriesPlotIndex.Low]).to.be.equal(item.low);
			expect(update.update[0].value[SeriesPlotIndex.Close]).to.be.equal(item.close);
		}
	});
});
