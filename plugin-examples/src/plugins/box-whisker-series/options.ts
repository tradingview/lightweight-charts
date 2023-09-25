import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface WhiskerBoxSeriesOptions extends CustomSeriesOptions {
	whiskerColor: string;
	lowerQuartileFill: string;
	upperQuartileFill: string;
	outlierColor: string;
}

export const defaultOptions: WhiskerBoxSeriesOptions = {
	...customSeriesDefaultOptions,
	whiskerColor: 'rgba(106, 27, 154, 1)',
	lowerQuartileFill: 'rgba(103, 58, 183, 1)',
	upperQuartileFill: 'rgba(233, 30, 99, 1)',
	outlierColor: 'rgba(149, 152, 161, 1)',
} as const;
