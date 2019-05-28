import { TimedData } from './data-layer';
import { ISeriesApi } from './iseries-api';

export interface BarData extends TimedData {
	open: number;
	high: number;
	low: number;
	close: number;
}

export interface IBarSeriesApiBase extends ISeriesApi {
	setData(data: BarData[]): void;
	update(bar: BarData): void;
}
