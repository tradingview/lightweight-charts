
import { Mutable } from '../helpers/mutable';

import { AreaData, BarData, BaselineData, CandlestickData, HistogramData, isWhitespaceData, LineData, SeriesDataItemTypeMap } from './data-consumer';
import { InternalHorzScaleItem } from './ihorz-scale-behavior';
import { PlotRow } from './plot-data';
import { SeriesPlotRow } from './series-data';
import { SeriesType } from './series-options';
import { TimePointIndex } from './time-data';

function getColoredLineBasedSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: LineData<HorzScaleItem> | HistogramData<HorzScaleItem>, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Line' | 'Histogram', HorzScaleItem>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Line' | 'Histogram', HorzScaleItem>> = { index, time, value: [val, val, val, val], originalTime };

	if (item.color !== undefined) {
		res.color = item.color;
	}

	return res;
}

function getAreaSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: AreaData<HorzScaleItem>, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Area', HorzScaleItem>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Area', HorzScaleItem>> = { index, time, value: [val, val, val, val], originalTime };

	if (item.lineColor !== undefined) {
		res.lineColor = item.lineColor;
	}

	if (item.topColor !== undefined) {
		res.topColor = item.topColor;
	}

	if (item.bottomColor !== undefined) {
		res.bottomColor = item.bottomColor;
	}

	return res;
}

function getBaselineSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: BaselineData<HorzScaleItem>, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Baseline', HorzScaleItem>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Baseline', HorzScaleItem>> = { index, time, value: [val, val, val, val], originalTime };

	if (item.topLineColor !== undefined) {
		res.topLineColor = item.topLineColor;
	}

	if (item.bottomLineColor !== undefined) {
		res.bottomLineColor = item.bottomLineColor;
	}

	if (item.topFillColor1 !== undefined) {
		res.topFillColor1 = item.topFillColor1;
	}

	if (item.topFillColor2 !== undefined) {
		res.topFillColor2 = item.topFillColor2;
	}

	if (item.bottomFillColor1 !== undefined) {
		res.bottomFillColor1 = item.bottomFillColor1;
	}

	if (item.bottomFillColor2 !== undefined) {
		res.bottomFillColor2 = item.bottomFillColor2;
	}

	return res;
}

function getBarSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: BarData<HorzScaleItem>, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Bar', HorzScaleItem>> {
	const res: Mutable<SeriesPlotRow<'Bar', HorzScaleItem>> = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };

	if (item.color !== undefined) {
		res.color = item.color;
	}

	return res;
}

function getCandlestickSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: CandlestickData<HorzScaleItem>, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Candlestick', HorzScaleItem>> {
	const res: Mutable<SeriesPlotRow<'Candlestick', HorzScaleItem>> = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };
	if (item.color !== undefined) {
		res.color = item.color;
	}

	if (item.borderColor !== undefined) {
		res.borderColor = item.borderColor;
	}

	if (item.wickColor !== undefined) {
		res.wickColor = item.wickColor;
	}

	return res;
}

export type WhitespacePlotRow<HorzScaleItem> = Omit<PlotRow<HorzScaleItem>, 'value'>;

export function isSeriesPlotRow<TSeriesType extends SeriesType, HorzScaleItem>(row: SeriesPlotRow<TSeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>): row is SeriesPlotRow<TSeriesType, HorzScaleItem> {
	return (row as Partial<SeriesPlotRow<TSeriesType, HorzScaleItem>>).value !== undefined;
}

type SeriesItemValueFnMap<TSeriesType extends SeriesType, HorzScaleItem> = {
	[T in keyof SeriesDataItemTypeMap<TSeriesType>]: (time: InternalHorzScaleItem, index: TimePointIndex, item: SeriesDataItemTypeMap<HorzScaleItem>[T], originalTime: HorzScaleItem) => Mutable<SeriesPlotRow<T, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>>;
};

function wrapWhitespaceData<TSeriesType extends SeriesType, HorzScaleItem>(createPlotRowFn: (typeof getBaselineSeriesPlotRow) | (typeof getBarSeriesPlotRow) | (typeof getCandlestickSeriesPlotRow)): SeriesItemValueFnMap<TSeriesType, HorzScaleItem>[TSeriesType] {
	return (time: InternalHorzScaleItem, index: TimePointIndex, bar: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType], originalTime: HorzScaleItem) => {
		if (isWhitespaceData(bar)) {
			return { time, index, originalTime };
		}

		return createPlotRowFn(time, index, bar, originalTime);
	};
}

export function getSeriesPlotRowCreator<TSeriesType extends SeriesType, HorzScaleItem>(seriesType: TSeriesType): SeriesItemValueFnMap<TSeriesType, HorzScaleItem>[TSeriesType] {
	const seriesPlotRowFnMap: SeriesItemValueFnMap<TSeriesType, HorzScaleItem> = {
		Candlestick: wrapWhitespaceData(getCandlestickSeriesPlotRow),
		Bar: wrapWhitespaceData(getBarSeriesPlotRow),
		Area: wrapWhitespaceData(getAreaSeriesPlotRow),
		Baseline: wrapWhitespaceData(getBaselineSeriesPlotRow),
		Histogram: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
		Line: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
	};

	return seriesPlotRowFnMap[seriesType];
}
