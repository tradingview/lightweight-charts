import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getSeriesDataCreator } from '../../src/api/get-series-data-creator';
import { PlotRow } from '../../src/model/plot-data';
import { AreaPlotRow, BarPlotRow, BaselinePlotRow, CandlestickPlotRow, HistogramPlotRow, LinePlotRow } from '../../src/model/series-data';
import { OriginalTime, TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

const plotRow: PlotRow = {
	index: 0 as TimePointIndex,
	time: { timestamp: 1649931070 as UTCTimestamp },
	value: [1, 2, 3, 4],
	originalTime: 1649931070 as unknown as OriginalTime,
};

const linePlotRows: LinePlotRow[] = [
	{
		...plotRow,
		color: '#FF0000',
	},
	plotRow,
];
const areaPlotRows: AreaPlotRow[] = [
	{
		...plotRow,
		lineColor: '#FF0000',
		topColor: '#00FF00',
		bottomColor: '#0000FF',
	},
	plotRow,
];
const baselinePlotRows: BaselinePlotRow[] = [
	{
		...plotRow,
		topFillColor1: '#000001',
		topFillColor2: '#000002',
		topLineColor: '#000003',
		bottomFillColor1: '#000004',
		bottomFillColor2: '#000005',
		bottomLineColor: '#000006',
	},
	plotRow,
];
const histogramPlotRow: HistogramPlotRow[] = [
	{
		...plotRow,
		color: '#00FF00',
	},
	plotRow,
];
const barPlotRow: BarPlotRow[] = [
	{
		...plotRow,
		color: '#0000FF',
	},
	plotRow,
];
const candlestickPlotRows: CandlestickPlotRow[] = [
	{
		...plotRow,
		color: '#0000FF',
	},
	plotRow,
	{
		...plotRow,
		borderColor: '#FFFF00',
	},
	{
		...plotRow,
		wickColor: '#FF00FF',
	},
	{
		...plotRow,
		color: '#FF0000',
		borderColor: '#00FF00',
		wickColor: '#0000FF',
	},
];

describe('getSeriesDataCreator', () => {
	it('Line', () => {
		expect(getSeriesDataCreator('Line')(linePlotRows[0])).to.deep.equal({
			value: 4,
			time: 1649931070,
			color: '#FF0000',
		});
		expect(getSeriesDataCreator('Line')(linePlotRows[1])).to.deep.equal({
			value: 4,
			time: 1649931070,
		});
	});

	it('Area', () => {
		expect(getSeriesDataCreator('Area')(areaPlotRows[0])).to.deep.equal({
			value: 4,
			time: 1649931070,
			lineColor: '#FF0000',
			topColor: '#00FF00',
			bottomColor: '#0000FF',
		});
		expect(getSeriesDataCreator('Area')(areaPlotRows[1])).to.deep.equal({
			value: 4,
			time: 1649931070,
		});
	});

	it('Baseline', () => {
		expect(getSeriesDataCreator('Baseline')(baselinePlotRows[0])).to.deep.equal({
			value: 4,
			time: 1649931070,
			topFillColor1: '#000001',
			topFillColor2: '#000002',
			topLineColor: '#000003',
			bottomFillColor1: '#000004',
			bottomFillColor2: '#000005',
			bottomLineColor: '#000006',
		});

		expect(getSeriesDataCreator('Baseline')(baselinePlotRows[1])).to.deep.equal({
			value: 4,
			time: 1649931070,
		});
	});

	it('Histogram', () => {
		expect(getSeriesDataCreator('Histogram')(histogramPlotRow[0])).to.deep.equal({
			value: 4,
			time: 1649931070,
			color: '#00FF00',
		});
		expect(getSeriesDataCreator('Histogram')(histogramPlotRow[1])).to.deep.equal({
			value: 4,
			time: 1649931070,
		});
	});

	it('Bar', () => {
		expect(getSeriesDataCreator('Bar')(barPlotRow[0])).to.deep.equal({
			open: 1,
			high: 2,
			low: 3,
			close: 4,
			time: 1649931070,
			color: '#0000FF',
		});
		expect(getSeriesDataCreator('Bar')(barPlotRow[1])).to.deep.equal({
			open: 1,
			high: 2,
			low: 3,
			close: 4,
			time: 1649931070,
		});
	});

	it('Candlestick', () => {
		expect(getSeriesDataCreator('Candlestick')(candlestickPlotRows[0])).to.deep.equal({
			open: 1,
			high: 2,
			low: 3,
			close: 4,
			time: 1649931070,
			color: '#0000FF',
		});
		expect(getSeriesDataCreator('Candlestick')(candlestickPlotRows[1])).to.deep.equal({
			open: 1,
			high: 2,
			low: 3,
			close: 4,
			time: 1649931070,
		});
		expect(getSeriesDataCreator('Candlestick')(candlestickPlotRows[2])).to.deep.equal({
			open: 1,
			high: 2,
			low: 3,
			close: 4,
			time: 1649931070,
			borderColor: '#FFFF00',
		});
		expect(getSeriesDataCreator('Candlestick')(candlestickPlotRows[3])).to.deep.equal({
			open: 1,
			high: 2,
			low: 3,
			close: 4,
			time: 1649931070,
			wickColor: '#FF00FF',
		});
		expect(getSeriesDataCreator('Candlestick')(candlestickPlotRows[4])).to.deep.equal({
			open: 1,
			high: 2,
			low: 3,
			close: 4,
			time: 1649931070,
			color: '#FF0000',
			borderColor: '#00FF00',
			wickColor: '#0000FF',
		});
	});
});
