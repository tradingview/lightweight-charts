import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export type HeatMapCellShader = (amount: number) => string;

export interface HeatMapSeriesOptions extends CustomSeriesOptions {
	lastValueVisible: false;
	priceLineVisible: false;
	cellShader: HeatMapCellShader;
	cellBorderWidth: number;
	cellBorderColor: string;
}

export const defaultOptions: HeatMapSeriesOptions = {
	...customSeriesDefaultOptions,
	lastValueVisible: false,
	priceLineVisible: false,
	cellShader: (amount: number) => {
		const amt = Math.min(Math.max(0, amount), 100);
		return `rgba(0, ${100 + amt * 1.55}, ${0 + amt}, ${0.2 + amt * 0.8})`;
	},
	cellBorderWidth: 1,
	cellBorderColor: 'transparent',
} as const;
