import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface LollipopSeriesOptions extends CustomSeriesOptions {
	lineWidth: number;
}

export const defaultOptions: LollipopSeriesOptions = {
	...customSeriesDefaultOptions,
	lineWidth: 2,
} as const;
