import { PlotRow } from '../model/plot-data';
import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { OriginalTime, TimePoint, TimePointIndex } from '../model/time-data';

import { AreaData, BarData, CandlestickData, HistogramData, isWhitespaceData, LineData, SeriesDataItemTypeMap } from './data-consumer';

function getLineBasedSeriesPlotRow(time: TimePoint, index: TimePointIndex, item: LineData | HistogramData, originalTime: OriginalTime): Mutable<SeriesPlotRow<'Area' | 'Baseline'>> {
	const val = item.value;
	return { index, time, value: [val, val, val, val], originalTime };
}

function getColoredLineBasedSeriesPlotRow(time: TimePoint, index: TimePointIndex, item: LineData | HistogramData, originalTime: OriginalTime): Mutable<SeriesPlotRow<'Line' | 'Histogram'>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Line' | 'Histogram'>> = { index, time, value: [val, val, val, val], originalTime };

	// 'color' here is public property (from API) so we can use `in` here safely
	// eslint-disable-next-line no-restricted-syntax
	if ('color' in item && item.color !== undefined) {
		res.color = item.color;
	}

	return res;
}

function getAreaSeriesPlotRow(time: TimePoint, index: TimePointIndex, item: AreaData, originalTime: OriginalTime): Mutable<SeriesPlotRow<'Area'>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Area'>> = { index, time, value: [val, val, val, val], originalTime };

	// 'color', 'topColor', 'bottomColor' here are public properties (from API) so we can use `in` here safely
	// eslint-disable-next-line no-restricted-syntax
	if ('lineColor' in item && item.lineColor !== undefined) {
		res.lineColor = item.lineColor;
	}

	// eslint-disable-next-line no-restricted-syntax
	if ('topColor' in item && item.topColor !== undefined) {
		res.topColor = item.topColor;
	}

	// eslint-disable-next-line no-restricted-syntax
	if ('bottomColor' in item && item.bottomColor !== undefined) {
		res.bottomColor = item.bottomColor;
	}

	return res;
}

function getBarSeriesPlotRow(time: TimePoint, index: TimePointIndex, item: BarData, originalTime: OriginalTime): Mutable<SeriesPlotRow<'Bar'>> {
	const res: Mutable<SeriesPlotRow<'Bar'>> = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };

	// 'color' here is public property (from API) so we can use `in` here safely
	// eslint-disable-next-line no-restricted-syntax
	if ('color' in item && item.color !== undefined) {
		res.color = item.color;
	}

	return res;
}

function getCandlestickSeriesPlotRow(time: TimePoint, index: TimePointIndex, item: CandlestickData, originalTime: OriginalTime): Mutable<SeriesPlotRow<'Candlestick'>> {
	const res: Mutable<SeriesPlotRow<'Candlestick'>> = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };

	// 'color' here is public property (from API) so we can use `in` here safely
	// eslint-disable-next-line no-restricted-syntax
	if ('color' in item && item.color !== undefined) {
		res.color = item.color;
	}

	// 'borderColor' here is public property (from API) so we can use `in` here safely
	// eslint-disable-next-line no-restricted-syntax
	if ('borderColor' in item && item.borderColor !== undefined) {
		res.borderColor = item.borderColor;
	}

	// 'wickColor' here is public property (from API) so we can use `in` here safely
	// eslint-disable-next-line no-restricted-syntax
	if ('wickColor' in item && item.wickColor !== undefined) {
		res.wickColor = item.wickColor;
	}

	return res;
}

export type WhitespacePlotRow = Omit<PlotRow, 'value'>;

export function isSeriesPlotRow(row: SeriesPlotRow | WhitespacePlotRow): row is SeriesPlotRow {
	return (row as Partial<SeriesPlotRow>).value !== undefined;
}

type SeriesItemValueFnMap = {
	[T in keyof SeriesDataItemTypeMap]: (time: TimePoint, index: TimePointIndex, item: SeriesDataItemTypeMap[T], originalTime: OriginalTime) => Mutable<SeriesPlotRow<T> | WhitespacePlotRow>;
};

function wrapWhitespaceData<TSeriesType extends SeriesType>(createPlotRowFn: (typeof getLineBasedSeriesPlotRow) | (typeof getBarSeriesPlotRow) | (typeof getCandlestickSeriesPlotRow)): SeriesItemValueFnMap[TSeriesType] {
	return (time: TimePoint, index: TimePointIndex, bar: SeriesDataItemTypeMap[SeriesType], originalTime: OriginalTime) => {
		if (isWhitespaceData(bar)) {
			return { time, index, originalTime };
		}

		return createPlotRowFn(time, index, bar, originalTime);
	};
}

const seriesPlotRowFnMap: SeriesItemValueFnMap = {
	Candlestick: wrapWhitespaceData(getCandlestickSeriesPlotRow),
	Bar: wrapWhitespaceData(getBarSeriesPlotRow),
	Area: wrapWhitespaceData(getAreaSeriesPlotRow),
	Baseline: wrapWhitespaceData(getLineBasedSeriesPlotRow),
	Histogram: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
	Line: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
};

export function getSeriesPlotRowCreator<TSeriesType extends SeriesType>(seriesType: TSeriesType): SeriesItemValueFnMap[TSeriesType] {
	return seriesPlotRowFnMap[seriesType];
}
