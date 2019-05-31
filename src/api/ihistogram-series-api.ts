import { DeepPartial } from '../helpers/strict-type-checks';

import { HistogramSeriesOptions } from '../model/series-options';

import { LineData } from './iline-series-api-base';
import { ISeriesApi } from './iseries-api';

/** Structure describing a single item of data for histogram series */
export interface HistogramData extends LineData {
	/** Optional color value for certain data item. If missed, color from HistogramSeriesOptions is used */
	color?: string;
}

/** Interface to histogram series */
export interface IHistogramSeriesApi extends ISeriesApi {
	/**
	 * Sets or replaces series data
	 * @param - ordered (earlier time point goes first) array of data items. Old data are fully replaced with new one
	 */
	setData(data: HistogramData[]): void;

	/**
	 * Appends a new bar or replaces the last bar of the series
	 * @param a single data item to be added. Time of new item must be greater or equal to the latest time point of already existing data.
	 * If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.
	 */
	update(bar: HistogramData): void;

	/**
	 * Applies new options to the existing series
	 * @param options - any subset of options
	 */
	applyOptions(options: DeepPartial<HistogramSeriesOptions>): void;

	/**
	 * Returns currently applied options
	 * @return full set of currently applied options, including defaults
	 */
	options(): HistogramSeriesOptions;
}
