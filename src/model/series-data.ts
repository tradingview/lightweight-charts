import { BarPrice } from './bar';
import { PlotRow, PlotRowValue } from './plot-data';
import { PlotFunctionMap, PlotList } from './plot-list';
import { SeriesType } from './series-options';

/**
 * Plot's index in plot list tuple for series
 * @see {PlotRowValue}
 */
export const enum SeriesPlotIndex {
	Open = 0,
	High = 1,
	Low = 2,
	Close = 3,
}

/** @public */
const barFunctions = {
	open: (bar: PlotRowValue) => bar[SeriesPlotIndex.Open] as BarPrice,

	high: (bar: PlotRowValue) => bar[SeriesPlotIndex.High] as BarPrice,

	low: (bar: PlotRowValue) => bar[SeriesPlotIndex.Low] as BarPrice,

	close: (bar: PlotRowValue) => bar[SeriesPlotIndex.Close] as BarPrice,

	hl2: (bar: PlotRowValue) => (bar[SeriesPlotIndex.High] + bar[SeriesPlotIndex.Low]) / 2 as BarPrice,

	hlc3: (bar: PlotRowValue) =>
		(
			bar[SeriesPlotIndex.High] +
			bar[SeriesPlotIndex.Low] +
			bar[SeriesPlotIndex.Close]
		) / 3 as BarPrice,

	ohlc4: (bar: PlotRowValue) =>
		(
			bar[SeriesPlotIndex.Open] +
			bar[SeriesPlotIndex.High] +
			bar[SeriesPlotIndex.Low] +
			bar[SeriesPlotIndex.Close]
		) / 4 as BarPrice,
};

type SeriesPriceSource = keyof typeof barFunctions;

const seriesSource = Object.keys(barFunctions) as SeriesPriceSource[];

function seriesPlotFunctionMap(): PlotFunctionMap {
	const result: PlotFunctionMap = new Map();

	seriesSource.forEach((plot: SeriesPriceSource) => {
		result.set(plot, barFunction(plot));
	});

	return result;
}

export type BarFunction = (bar: PlotRowValue) => BarPrice;

export function barFunction(priceSource: SeriesPriceSource): BarFunction {
	return barFunctions[priceSource];
}

export interface HistogramPlotRow extends PlotRow {
	readonly color?: string;
}

export interface SeriesPlotRowTypeAtTypeMap {
	Bar: PlotRow;
	Candlestick: PlotRow;
	Area: PlotRow;
	Line: PlotRow;
	Histogram: HistogramPlotRow;
}

export type SeriesPlotRow<T extends SeriesType = SeriesType> = SeriesPlotRowTypeAtTypeMap[T];
export type SeriesPlotList<T extends SeriesType = SeriesType> = PlotList<SeriesPlotRow<T>>;

export function createSeriesPlotList<T extends SeriesType = SeriesType>(): SeriesPlotList<T> {
	return new PlotList<SeriesPlotRow<T>>(seriesPlotFunctionMap());
}
