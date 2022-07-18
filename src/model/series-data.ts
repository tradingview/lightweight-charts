import { PlotRow } from './plot-data';
import { PlotList } from './plot-list';
import { SeriesType } from './series-options';

export interface LinePlotRow extends PlotRow {
	readonly color?: string;
}

export interface AreaPlotRow extends PlotRow {
	lineColor?: string;
	topColor?: string;
	bottomColor?: string;
}

export interface BaselinePlotRow extends PlotRow {
	topFillColor1?: string;
	topFillColor2?: string;
	topLineColor?: string;
	bottomFillColor1?: string;
	bottomFillColor2?: string;
	bottomLineColor?: string;
}

export interface HistogramPlotRow extends PlotRow {
	readonly color?: string;
}

export interface BarPlotRow extends PlotRow {
	readonly color?: string;
}

export interface CandlestickPlotRow extends PlotRow {
	readonly color?: string;
	readonly borderColor?: string;
	readonly wickColor?: string;
}

export interface SeriesPlotRowTypeAtTypeMap {
	Bar: BarPlotRow;
	Candlestick: CandlestickPlotRow;
	Area: AreaPlotRow;
	Baseline: BaselinePlotRow;
	Line: LinePlotRow;
	Histogram: HistogramPlotRow;
}

export type SeriesPlotRow<T extends SeriesType = SeriesType> = SeriesPlotRowTypeAtTypeMap[T];
export type SeriesPlotList<T extends SeriesType = SeriesType> = PlotList<SeriesPlotRow<T>>;

export function createSeriesPlotList<T extends SeriesType = SeriesType>(): SeriesPlotList<T> {
	return new PlotList<SeriesPlotRow<T>>();
}
