import { PlotRow } from './plot-data';
import { PlotList } from './plot-list';
import { SeriesType } from './series-options';

export interface LinePlotRow<HorzScaleItem> extends PlotRow<HorzScaleItem> {
	readonly color?: string;
}

export interface AreaPlotRow<HorzScaleItem> extends PlotRow<HorzScaleItem> {
	lineColor?: string;
	topColor?: string;
	bottomColor?: string;
}

export interface BaselinePlotRow<HorzScaleItem> extends PlotRow<HorzScaleItem> {
	topFillColor1?: string;
	topFillColor2?: string;
	topLineColor?: string;
	bottomFillColor1?: string;
	bottomFillColor2?: string;
	bottomLineColor?: string;
}

export interface HistogramPlotRow<HorzScaleItem> extends PlotRow<HorzScaleItem> {
	readonly color?: string;
}

export interface BarPlotRow<HorzScaleItem> extends PlotRow<HorzScaleItem> {
	readonly color?: string;
}

export interface CandlestickPlotRow<HorzScaleItem> extends PlotRow<HorzScaleItem> {
	readonly color?: string;
	readonly borderColor?: string;
	readonly wickColor?: string;
}

export interface SeriesPlotRowTypeAtTypeMap<HorzScaleItem> {
	Bar: BarPlotRow<HorzScaleItem>;
	Candlestick: CandlestickPlotRow<HorzScaleItem>;
	Area: AreaPlotRow<HorzScaleItem>;
	Baseline: BaselinePlotRow<HorzScaleItem>;
	Line: LinePlotRow<HorzScaleItem>;
	Histogram: HistogramPlotRow<HorzScaleItem>;
}

export type SeriesPlotRow<T extends SeriesType, HorzScaleItem> = SeriesPlotRowTypeAtTypeMap<HorzScaleItem>[T];
export type SeriesPlotList<T extends SeriesType, HorzScaleItem> = PlotList<HorzScaleItem, SeriesPlotRow<T, HorzScaleItem>>;

export function createSeriesPlotList<T extends SeriesType, HorzScaleItem>(): SeriesPlotList<T, HorzScaleItem> {
	return new PlotList<HorzScaleItem, SeriesPlotRow<T, HorzScaleItem>>();
}
