import { BarPrice } from './bar';
import { PlotValue } from './plot-data';
import { PlotFunctionMap, PlotList } from './plot-list';
import { TimePoint } from './time-data';

export type BarValue = [PlotValue, PlotValue, PlotValue, PlotValue, PlotValue];

export interface Bar {
	time: TimePoint;
	value: BarValue;
}

/**
 * Plot's index in plot list tuple for series (or overlay study)
 * @see {Bar}
 */
export const enum SeriesPlotIndex {
	Open = 0,
	High = 1,
	Low = 2,
	Close = 3,
	Color = 4,
}

/** @public */
const barFunctions = {
	open: (bar: Bar['value']) => bar[SeriesPlotIndex.Open] as BarPrice,

	high: (bar: Bar['value']) => bar[SeriesPlotIndex.High] as BarPrice,

	low: (bar: Bar['value']) => bar[SeriesPlotIndex.Low] as BarPrice,

	close: (bar: Bar['value']) => bar[SeriesPlotIndex.Close] as BarPrice,

	hl2: (bar: Bar['value']) =>
		(
			(bar[SeriesPlotIndex.High] as number) +
			(bar[SeriesPlotIndex.Low] as number)
		) / 2 as BarPrice,

	hlc3: (bar: Bar['value']) =>
		(
			(bar[SeriesPlotIndex.High] as number) +
			(bar[SeriesPlotIndex.Low] as number) +
			(bar[SeriesPlotIndex.Close] as number)
		) / 3 as BarPrice,

	ohlc4: (bar: Bar['value']) =>
		(
			(bar[SeriesPlotIndex.Open] as number) +
			(bar[SeriesPlotIndex.High] as number) +
			(bar[SeriesPlotIndex.Low] as number) +
			(bar[SeriesPlotIndex.Close] as number)
		) / 4 as BarPrice,
};

type SeriesPriceSource = keyof typeof barFunctions;

const seriesSource: SeriesPriceSource[] = ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'];

function seriesPlotFunctionMap(): PlotFunctionMap<BarValue> {
	const result: PlotFunctionMap<BarValue> = new Map();

	seriesSource.forEach((plot: keyof typeof barFunctions, index: number) => {
		result.set(plot, barFunction(plot));
	});

	return result;
}

export type BarFunction = (bar: Bar['value']) => BarPrice;

export function barFunction(priceSource: SeriesPriceSource): BarFunction {
	return barFunctions[priceSource];
}

export type SeriesPlotList = PlotList<TimePoint, BarValue>;

export function createSeriesPlotList(): SeriesPlotList {
	return new PlotList<TimePoint, BarValue>(seriesPlotFunctionMap());
}
