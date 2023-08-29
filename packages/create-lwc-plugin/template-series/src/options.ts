import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface _CLASSNAME_Options extends CustomSeriesOptions {
	//* Define the options for the series.
	highLineColor: string;
	lowLineColor: string;
	areaColor: string;
	highLineWidth: number;
	lowLineWidth: number;
}

export const defaultOptions: _CLASSNAME_Options = {
	//* Define the default values for all the series options.
	...customSeriesDefaultOptions,
	highLineColor: '#049981',
	lowLineColor: '#F23645',
	areaColor: 'rgba(41, 98, 255, 0.2)',
	highLineWidth: 2,
	lowLineWidth: 2,
} as const;
