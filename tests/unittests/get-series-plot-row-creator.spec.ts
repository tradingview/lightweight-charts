import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getSeriesPlotRowCreator } from '../../src/api/get-series-plot-row-creator';
import { OriginalTime, TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

describe('getSeriesPlotRowCreator', () => {
	it('Line', () => {
		expect(getSeriesPlotRowCreator('Line')(
			{ timestamp: 1649931070 as UTCTimestamp },
			0 as TimePointIndex,
			{
				value: 4,
				time: 1649931070 as UTCTimestamp,
				color: '#FF0000',
			},
			1649931070 as unknown as OriginalTime
		)).to.deep.equal({
			index: 0 as TimePointIndex,
			time: { timestamp: 1649931070 as UTCTimestamp },
			value: [4, 4, 4, 4],
			originalTime: 1649931070 as unknown as OriginalTime,
			color: '#FF0000',
		});
	});

	it('Area', () => {
		expect(getSeriesPlotRowCreator('Area')(
			{ timestamp: 1649931070 as UTCTimestamp },
			0 as TimePointIndex,
			{
				value: 4,
				time: 1649931070 as UTCTimestamp,
				lineColor: '#FF0000',
				topColor: '#00FF00',
				bottomColor: '#0000FF',
			},
			1649931070 as unknown as OriginalTime
		)).to.deep.equal({
			index: 0 as TimePointIndex,
			time: { timestamp: 1649931070 as UTCTimestamp },
			value: [4, 4, 4, 4],
			originalTime: 1649931070 as unknown as OriginalTime,
			lineColor: '#FF0000',
			topColor: '#00FF00',
			bottomColor: '#0000FF',
		});
	});

	it('Baseline', () => {
		expect(getSeriesPlotRowCreator('Baseline')(
			{ timestamp: 1649931070 as UTCTimestamp },
			0 as TimePointIndex,
			{
				value: 4,
				time: 1649931070 as UTCTimestamp,
				topFillColor1: '#000001',
				topFillColor2: '#000002',
				topLineColor: '#000003',
				bottomFillColor1: '#000004',
				bottomFillColor2: '#000005',
				bottomLineColor: '#000006',
			},
			1649931070 as unknown as OriginalTime
		)).to.deep.equal({
			index: 0 as TimePointIndex,
			time: { timestamp: 1649931070 as UTCTimestamp },
			value: [4, 4, 4, 4],
			originalTime: 1649931070 as unknown as OriginalTime,
			topFillColor1: '#000001',
			topFillColor2: '#000002',
			topLineColor: '#000003',
			bottomFillColor1: '#000004',
			bottomFillColor2: '#000005',
			bottomLineColor: '#000006',
		});
	});

	it('Histogram', () => {
		expect(getSeriesPlotRowCreator('Histogram')(
			{ timestamp: 1649931070 as UTCTimestamp },
			0 as TimePointIndex,
			{
				value: 4,
				time: 1649931070 as UTCTimestamp,
				color: '#FF0000',
			},
			1649931070 as unknown as OriginalTime
		)).to.deep.equal({
			index: 0 as TimePointIndex,
			time: { timestamp: 1649931070 as UTCTimestamp },
			value: [4, 4, 4, 4],
			originalTime: 1649931070 as unknown as OriginalTime,
			color: '#FF0000',
		});
	});

	it('Bar', () => {
		expect(getSeriesPlotRowCreator('Bar')(
			{ timestamp: 1649931070 as UTCTimestamp },
			0 as TimePointIndex,
			{
				open: 1,
				high: 3,
				low: 0,
				close: 2,
				time: 1649931070 as UTCTimestamp,
				color: '#FF0000',
			},
			1649931070 as unknown as OriginalTime
		)).to.deep.equal({
			index: 0 as TimePointIndex,
			time: { timestamp: 1649931070 as UTCTimestamp },
			value: [1, 3, 0, 2],
			originalTime: 1649931070 as unknown as OriginalTime,
			color: '#FF0000',
		});
	});

	it('Candlestick', () => {
		expect(getSeriesPlotRowCreator('Candlestick')(
			{ timestamp: 1649931070 as UTCTimestamp },
			0 as TimePointIndex,
			{
				open: 1,
				high: 3,
				low: 0,
				close: 2,
				time: 1649931070 as UTCTimestamp,
				color: '#FF0000',
				borderColor: '#00FF00',
				wickColor: '#0000FF',
			},
			1649931070 as unknown as OriginalTime
		)).to.deep.equal({
			index: 0 as TimePointIndex,
			time: { timestamp: 1649931070 as UTCTimestamp },
			value: [1, 3, 0, 2],
			originalTime: 1649931070 as unknown as OriginalTime,
			color: '#FF0000',
			borderColor: '#00FF00',
			wickColor: '#0000FF',
		});
	});
});
