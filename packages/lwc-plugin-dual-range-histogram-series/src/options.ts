import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface DualRangeHistogramSeriesOptions extends CustomSeriesOptions {
	colors: readonly string[];
	borderRadius: readonly number[];
	maxHeight: number;
}

export const defaultOptions: DualRangeHistogramSeriesOptions = {
	...customSeriesDefaultOptions,
	colors: ['#ACE5DC', '#42BDA8', '#FCCACD', '#F77C80'],
	borderRadius: [2, 0, 2, 0],
	maxHeight: 130,
} as const;
