import { PlotRow, PlotRowValueIndex } from '../model/plot-data';
import {
	BarPlotRow,
	CandlestickPlotRow,
	LinePlotRow,
	SeriesPlotRow,
} from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { Time } from '../model/time-data';

import {
	BarData,
	CandlestickData,
	LineData,
	OhlcData,
	SeriesDataItemTypeMap,
	SingleValueData,
} from './data-consumer';

type SeriesPlotRowToDataMap = {
	[T in keyof SeriesDataItemTypeMap]: (plotRow: SeriesPlotRow) => SeriesDataItemTypeMap[T];
};

function singleValueData(plotRow: PlotRow): SingleValueData {
	return {
		value: plotRow.value[PlotRowValueIndex.Close],
		time: plotRow.originalTime as unknown as Time,
	};
}

function lineData(plotRow: LinePlotRow): LineData {
	const result: LineData = singleValueData(plotRow);

	if (plotRow.color !== undefined) {
		result.color = plotRow.color;
	}

	return result;
}

function ohlcData(plotRow: PlotRow): OhlcData {
	return {
		open: plotRow.value[PlotRowValueIndex.Open],
		high: plotRow.value[PlotRowValueIndex.High],
		low: plotRow.value[PlotRowValueIndex.Low],
		close: plotRow.value[PlotRowValueIndex.Close],
		time: plotRow.originalTime as unknown as Time,
	};
}

function barData(plotRow: BarPlotRow): BarData {
	const result: BarData = ohlcData(plotRow);

	if (plotRow.color !== undefined) {
		result.color = plotRow.color;
	}

	return result;
}

function candlestickData(plotRow: CandlestickPlotRow): CandlestickData {
	const result: CandlestickData = ohlcData(plotRow);
	const { color, borderColor, wickColor } = plotRow;

	if (color !== undefined) {
		result.color = color;
	}

	if (borderColor !== undefined) {
		result.borderColor = borderColor;
	}

	if (wickColor !== undefined) {
		result.wickColor = wickColor;
	}

	return result;
}

const seriesPlotRowToDataMap: SeriesPlotRowToDataMap = {
	Area: singleValueData,
	Line: lineData,
	Baseline: singleValueData,
	Histogram: lineData,
	Bar: barData,
	Candlestick: candlestickData,
};

export function getSeriesDataCreator<TSeriesType extends SeriesType>(seriesType: TSeriesType): (plotRow: SeriesPlotRow<TSeriesType>) => SeriesDataItemTypeMap[TSeriesType] {
	return seriesPlotRowToDataMap[seriesType];
}
