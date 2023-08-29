import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface StackedAreaColor {
	line: string;
	area: string;
}

export interface StackedAreaSeriesOptions extends CustomSeriesOptions {
	colors: readonly StackedAreaColor[];
	lineWidth: number;
}

export const defaultOptions: StackedAreaSeriesOptions = {
	...customSeriesDefaultOptions,
	colors: [
		{ line: 'rgb(41, 98, 255)', area: 'rgba(41, 98, 255, 0.2)' },
		{ line: 'rgb(225, 87, 90)', area: 'rgba(225, 87, 90, 0.2)' },
		{ line: 'rgb(242, 142, 44)', area: 'rgba(242, 142, 44, 0.2)' },
		{ line: 'rgb(164, 89, 209)', area: 'rgba(164, 89, 209, 0.2)' },
		{ line: 'rgb(27, 156, 133)', area: 'rgba(27, 156, 133, 0.2)' },
	],
	lineWidth: 2,
} as const;
