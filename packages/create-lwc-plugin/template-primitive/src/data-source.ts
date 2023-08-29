import {
	IChartApi,
	ISeriesApi,
	SeriesOptionsMap,
	Time,
} from 'lightweight-charts';
import { _CLASSNAME_Options } from './options';

export interface Point {
	time: Time;
	price: number;
}

export interface _CLASSNAME_DataSource {
	chart: IChartApi;
	series: ISeriesApi<keyof SeriesOptionsMap>;
	options: _CLASSNAME_Options;
	p1: Point;
	p2: Point;
}
