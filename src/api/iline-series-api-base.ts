import { TimedData } from './data-layer';
import { ISeriesApi } from './iseries-api';

export interface LineData extends TimedData {
	value: number;
}

export interface ILineSeriesApiBase extends ISeriesApi {
	setData(data: LineData[]): void;
	update(bar: LineData): void;
}
