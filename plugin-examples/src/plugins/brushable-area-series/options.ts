import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
	Range,
	Logical,
} from 'lightweight-charts';

export interface BrushRange {
	range: Range<Logical>;
	style: BrushableAreaStyle;
}

export interface BrushableAreaStyle {
	lineColor: string;
	topColor: string;
	bottomColor: string;
	lineWidth: number;
}

export interface BrushableAreaSeriesOptions
	extends CustomSeriesOptions,
		BrushableAreaStyle {
	basePrice: number;
	/**
	 * If you need to remove the brush ranges then set to null instead of an
	 * empty array.
	 */
	brushRanges: readonly BrushRange[];
}

export const defaultOptions: BrushableAreaSeriesOptions = {
	...customSeriesDefaultOptions,
	lineColor: 'rgb(40,98,255)',
	topColor: 'rgba(40,98,255, 0.4)',
	bottomColor: 'rgba(40,98,255, 0)',
	lineWidth: 2,
	basePrice: 0,
	brushRanges: [],
} as const;
