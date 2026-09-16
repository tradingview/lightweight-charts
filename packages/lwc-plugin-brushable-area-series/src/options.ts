import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
	IRange,
	LineStyle,
	LineType,
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
	/** Dash pattern of the line. */
	lineStyle: LineStyle;
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
	/** Draw the line itself. Set it to `false` for the fill only. */
	lineVisible: boolean;
	/**
	 * Shape of the line between two points: straight, stepped or curved. The
	 * fill follows the same shape.
	 */
	lineType: LineType;
	/**
	 * Anchor the far end of the fill gradient to the outermost point in view
	 * rather than to the edge of the pane, as `AreaSeries` does. A relative
	 * gradient keeps its full colour range whatever the price scale shows, at
	 * the cost of changing as the chart is panned.
	 */
	relativeGradient: boolean;
	/**
	 * Fill the area above the line, up to the top of the pane, instead of down
	 * to {@link BrushableAreaSeriesOptions.basePrice}.
	 */
	invertFilledArea: boolean;
}

export const defaultOptions: BrushableAreaSeriesOptions = {
	...customSeriesDefaultOptions,
	lineColor: 'rgb(40,98,255)',
	topColor: 'rgba(40,98,255, 0.4)',
	bottomColor: 'rgba(40,98,255, 0)',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
	basePrice: 0,
	brushRanges: [],
	lineVisible: true,
	lineType: LineType.Simple,
	relativeGradient: false,
	invertFilledArea: false,
} as const;
