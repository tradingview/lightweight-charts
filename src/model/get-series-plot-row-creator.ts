import { ensureDefined } from '../helpers/assertions';
import { Mutable } from '../helpers/mutable';

import { CustomData } from '../model/icustom-series';
import { PlotRow, PlotRowValue } from '../model/plot-data';
import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { TimePointIndex } from '../model/time-data';

import { AreaData, BarData, BaselineData, CandlestickData, HistogramData, isWhitespaceData, LineData, SeriesDataItemTypeMap, WhitespaceData } from './data-consumer';
import { InternalHorzScaleItem } from './ihorz-scale-behavior';

function getColoredLineBasedSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: LineData | HistogramData, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Line' | 'Histogram'>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Line' | 'Histogram'>> = { index, time, value: [val, val, val, val], originalTime };

	if (item.color !== undefined) {
		res.color = item.color;
	}

	return res;
}

function getAreaSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: AreaData, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Area'>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Area'>> = { index, time, value: [val, val, val, val], originalTime };

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

function getBaselineSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: BaselineData, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Baseline'>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Baseline'>> = { index, time, value: [val, val, val, val], originalTime };

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

function getBarSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: BarData, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Bar'>> {
	const res: Mutable<SeriesPlotRow<'Bar'>> = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };

	if (item.color !== undefined) {
		res.color = item.color;
	}

	return res;
}

function getCandlestickSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: CandlestickData, originalTime: HorzScaleItem): Mutable<SeriesPlotRow<'Candlestick'>> {
	const res: Mutable<SeriesPlotRow<'Candlestick'>> = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };
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

// The returned data is used for scaling the series, and providing the current value for the price scale
export type CustomDataToPlotRowValueConverter<HorzScaleItem> = (item: CustomData<HorzScaleItem> | WhitespaceData) => number[];

function getCustomSeriesPlotRow<HorzScaleItem>(time: InternalHorzScaleItem, index: TimePointIndex, item: CustomData<HorzScaleItem> | WhitespaceData, originalTime: HorzScaleItem, dataToPlotRow?: CustomDataToPlotRowValueConverter<HorzScaleItem>): Mutable<SeriesPlotRow<'Custom'>> {
	const values = ensureDefined(dataToPlotRow)(item);
	const max = Math.max(...values);
	const min = Math.min(...values);
	const last = values[values.length - 1];
	const value: PlotRowValue = [last, max, min, last];
	const { time: excludedTime, color, ...data } = item as CustomData<HorzScaleItem>;
	return { index, time, value, originalTime, data, color };
}

export type WhitespacePlotRow = Omit<PlotRow, 'value'>;

export function isSeriesPlotRow(row: SeriesPlotRow | WhitespacePlotRow): row is SeriesPlotRow {
	return (row as Partial<SeriesPlotRow>).value !== undefined;
}

type SeriesItemValueFnMap<HorzScaleItem> = {
	[T in keyof SeriesDataItemTypeMap]: (time: InternalHorzScaleItem, index: TimePointIndex, item: SeriesDataItemTypeMap<HorzScaleItem>[T], originalTime: HorzScaleItem, dataToPlotRow?: CustomDataToPlotRowValueConverter<HorzScaleItem>, customIsWhitespace?: WhitespaceCheck<HorzScaleItem>) => Mutable<SeriesPlotRow<T> | WhitespacePlotRow>;
};

function wrapCustomValues<T extends SeriesPlotRow | WhitespacePlotRow, HorzScaleItem>(plotRow: Mutable<T>, bar: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]): Mutable<T> {
	if (bar.customValues !== undefined) {
		plotRow.customValues = bar.customValues;
	}
	return plotRow;
}

export type WhitespaceCheck<HorzScaleItem> = (bar: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]) => bar is WhitespaceData<HorzScaleItem>;

function isWhitespaceDataWithCustomCheck<HorzScaleItem>(bar: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType], customIsWhitespace?: WhitespaceCheck<HorzScaleItem>): bar is WhitespaceData<HorzScaleItem> {
	if (customIsWhitespace) {
		return customIsWhitespace(bar);
	}
	return isWhitespaceData(bar);
}

type GetPlotRowType = (typeof getBaselineSeriesPlotRow) | (typeof getBarSeriesPlotRow) | (typeof getCandlestickSeriesPlotRow) | (typeof getCustomSeriesPlotRow);

function wrapWhitespaceData<TSeriesType extends SeriesType, HorzScaleItem>(createPlotRowFn: GetPlotRowType): SeriesItemValueFnMap<HorzScaleItem>[TSeriesType] {
	return (time: InternalHorzScaleItem, index: TimePointIndex, bar: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType], originalTime: HorzScaleItem, dataToPlotRow?: CustomDataToPlotRowValueConverter<HorzScaleItem>, customIsWhitespace?: WhitespaceCheck<HorzScaleItem>) => {
		if (isWhitespaceDataWithCustomCheck(bar, customIsWhitespace)) {
			return wrapCustomValues({ time, index, originalTime }, bar);
		}

		return wrapCustomValues<ReturnType<GetPlotRowType>, HorzScaleItem>(createPlotRowFn(time, index, bar, originalTime, dataToPlotRow), bar);
	};
}

export function getSeriesPlotRowCreator<TSeriesType extends SeriesType, HorzScaleItem>(seriesType: TSeriesType): SeriesItemValueFnMap<HorzScaleItem>[TSeriesType] {
	const seriesPlotRowFnMap: SeriesItemValueFnMap<HorzScaleItem> = {
		Candlestick: wrapWhitespaceData(getCandlestickSeriesPlotRow),
		Bar: wrapWhitespaceData(getBarSeriesPlotRow),
		Area: wrapWhitespaceData(getAreaSeriesPlotRow),
		Baseline: wrapWhitespaceData(getBaselineSeriesPlotRow),
		Histogram: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
		Line: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
		Custom: wrapWhitespaceData(getCustomSeriesPlotRow),
	};
	return seriesPlotRowFnMap[seriesType];
}
