import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface BackgroundShadeSeriesOptions extends CustomSeriesOptions {
	lowColor: string;
	highColor: string;
	opacity: number;
    lowValue: number;
    highValue: number;
}

export const defaultOptions: BackgroundShadeSeriesOptions = {
	...customSeriesDefaultOptions,
	lowColor: 'rgb(50, 50, 255)',
    highColor: 'rgb(255, 50, 50)',
    lowValue: 0,
    highValue: 100,
    opacity: 0.8,
} as const;
