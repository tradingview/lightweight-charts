import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface HLCAreaSeriesOptions extends CustomSeriesOptions {
	highLineColor: string;
	lowLineColor: string;
	closeLineColor: string;
	areaBottomColor: string;
	areaTopColor: string;
	highLineWidth: number;
	lowLineWidth: number;
	closeLineWidth: number;
}

export const defaultOptions: HLCAreaSeriesOptions = {
	...customSeriesDefaultOptions,
	highLineColor: '#049981',
	lowLineColor: '#F23645',
	closeLineColor: '#878993',
	areaBottomColor: 'rgba(242, 54, 69, 0.2)',
	areaTopColor: 'rgba(4, 153, 129, 0.2)',
	highLineWidth: 2,
	lowLineWidth: 2,
	closeLineWidth: 2,
} as const;
