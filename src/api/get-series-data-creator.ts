import { PlotRow, PlotRowValueIndex } from '../model/plot-data';
import { HistogramPlotRow, SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { Time } from '../model/time-data';

import { BarData, HistogramData, LineData, SeriesDataItemTypeMap } from './data-consumer';

type SeriesPlotRowToDataMap = {
	[T in keyof SeriesDataItemTypeMap]: (plotRow: SeriesPlotRow) => SeriesDataItemTypeMap[T];
};

function lineData(plotRow: PlotRow): LineData {
	return {
		value: plotRow.value[PlotRowValueIndex.Close],
		time: plotRow.originalTime as unknown as Time,
	};
}

function histogramData(plotRow: HistogramPlotRow): HistogramData {
	return {
		value: plotRow.value[PlotRowValueIndex.Close],
		color: plotRow.color,
		time: plotRow.originalTime as unknown as Time,
	};
}

function barData(plotRow: PlotRow): BarData {
	return {
		open: plotRow.value[PlotRowValueIndex.Open],
		high: plotRow.value[PlotRowValueIndex.High],
		low: plotRow.value[PlotRowValueIndex.Low],
		close: plotRow.value[PlotRowValueIndex.Close],
		time: plotRow.originalTime as unknown as Time,
	};
}

const seriesPlotRowToDataMap: SeriesPlotRowToDataMap = {
	Area: lineData,
	Line: lineData,
	Baseline: lineData,
	Histogram: histogramData,
	Bar: barData,
	Candlestick: barData,
};

export function getSeriesDataCreator<TSeriesType extends SeriesType>(seriesType: TSeriesType): (plotRow: SeriesPlotRow<TSeriesType>) => SeriesDataItemTypeMap[TSeriesType] {
	return seriesPlotRowToDataMap[seriesType];
}
