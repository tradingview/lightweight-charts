import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
	IRange,
	LineWidth,
	Logical,
} from 'lightweight-charts';

export interface BrushRange {
	range: IRange<Logical>;
	/**
	 * Merged over the base style: any property left out keeps its base value.
	 */
	style: Partial<BrushableAreaStyle>;
}

export interface BrushableAreaStyle {
	lineColor: string;
	topColor: string;
	bottomColor: string;
	lineWidth: LineWidth;
}

export interface BrushableAreaSeriesOptions
	extends CustomSeriesOptions,
		BrushableAreaStyle {
	/**
	 * Price the area is filled down to. Clamped to the visible pane.
	 */
	basePrice: number;
	/**
	 * Ranges of logical indices drawn in their own style. Set an empty array to
	 * remove every brush range.
	 */
	brushRanges: readonly BrushRange[];
	/**
	 * Style of the points outside every brush range, used only while at least
	 * one brush range is set. Merged over the base style.
	 */
	outsideStyle?: Partial<BrushableAreaStyle>;
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
