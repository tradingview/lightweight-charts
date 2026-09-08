import {
	CustomSeriesOptions,
	LineWidth,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface HLCAreaSeriesOptions extends CustomSeriesOptions {
	highLineColor: string;
	lowLineColor: string;
	closeLineColor: string;
	/** Fill color of the band between the high line and the close line. */
	highAreaColor: string;
	/** Fill color of the band between the close line and the low line. */
	lowAreaColor: string;
	highLineWidth: LineWidth;
	lowLineWidth: LineWidth;
	closeLineWidth: LineWidth;
	/** @deprecated Use `highAreaColor`. */
	areaTopColor?: string;
	/** @deprecated Use `lowAreaColor`. */
	areaBottomColor?: string;
}

export const defaultOptions: HLCAreaSeriesOptions = {
	...customSeriesDefaultOptions,
	highLineColor: '#049981',
	lowLineColor: '#F23645',
	closeLineColor: '#878993',
	highAreaColor: 'rgba(4, 153, 129, 0.2)',
	lowAreaColor: 'rgba(242, 54, 69, 0.2)',
	highLineWidth: 2,
	lowLineWidth: 2,
	closeLineWidth: 2,
} as const;
