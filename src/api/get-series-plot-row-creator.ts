import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { TimePoint, TimePointIndex } from '../model/time-data';

import { BarData, HistogramData, LineData, SeriesDataItemTypeMap } from './data-consumer';

function getLineBasedSeriesPlotRow(time: TimePoint, index: TimePointIndex, item: LineData | HistogramData): Mutable<SeriesPlotRow<'Line' | 'Histogram'>> {
	const val = item.value;

	const res: Mutable<SeriesPlotRow<'Histogram'>> = { index, time, value: [val, val, val, val] };
	if ('color' in item && item.color !== undefined) {
		res.color = item.color;
	}

	return res;
}

function getOHLCBasedSeriesPlotRow(time: TimePoint, index: TimePointIndex, bar: BarData): Mutable<SeriesPlotRow> {
	return { index, time, value: [bar.open, bar.high, bar.low, bar.close] };
}

// we want to have compile-time checks that the type of the functions is correct
// but due contravariance we cannot easily use type of values of the SeriesItemValueFnMap map itself
// so let's use TimedSeriesItemValueFn for shut up the compiler in seriesItemValueFn
// we need to be sure (and we're sure actually) that stored data has correct type for it's according series object
type SeriesItemValueFnMap = {
	[T in keyof SeriesDataItemTypeMap]: (time: TimePoint, index: TimePointIndex, item: SeriesDataItemTypeMap[T]) => Mutable<SeriesPlotRow>;
};

export type TimedSeriesItemValueFn = (time: TimePoint, index: TimePointIndex, item: SeriesDataItemTypeMap[SeriesType]) => Mutable<SeriesPlotRow>;

const seriesPlotRowFnMap: SeriesItemValueFnMap = {
	Candlestick: getOHLCBasedSeriesPlotRow,
	Bar: getOHLCBasedSeriesPlotRow,
	Area: getLineBasedSeriesPlotRow,
	Histogram: getLineBasedSeriesPlotRow,
	Line: getLineBasedSeriesPlotRow,
};

export function getSeriesPlotRowCreator(seriesType: SeriesType): TimedSeriesItemValueFn {
	return seriesPlotRowFnMap[seriesType] as TimedSeriesItemValueFn;
}
