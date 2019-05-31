import { TimedData } from './data-layer';
import { ISeriesApi } from './iseries-api';

/** Structure describing single data item for series of type Line or Area */
export interface LineData extends TimedData {
	/** Price value of data item */
	value: number;
}

/** Interface implemented by all series types having a single value per time point: line, area */
export interface ILineSeriesApiBase extends ISeriesApi {
	/**
	 * Sets or replaces line series data
	 * @param - ordered (earlier time point goes first) array of data items. Old data are fully replaced with new one
	 */
	setData(data: LineData[]): void;

	/**
	 * Appends a new point or replaces the last point of the series
	 * @param a single data item to be added. Time of the new item must be greater or equal to the latest existing time point.
	 * If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.
	 */
	update(bar: LineData): void;
}
