import {
	CustomSeriesOptions,
	LineStyle,
	LineWidth,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

/**
 * How the three lines and the two fills get from one point to the next.
 *
 * - `simple` — a straight segment, like `LineType.Simple`.
 * - `step` — horizontal to the next bar, then vertical, like
 *   `LineType.WithSteps`.
 */
export type HLCAreaLineType = 'simple' | 'step';

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
	highLineStyle: LineStyle;
	lowLineStyle: LineStyle;
	closeLineStyle: LineStyle;
	highLineVisible: boolean;
	lowLineVisible: boolean;
	closeLineVisible: boolean;
	/** Whether the two fills between the lines are drawn. */
	areaVisible: boolean;
	/** How the lines and the fills get from one point to the next. */
	lineType: HLCAreaLineType;
	/**
	 * Upper stop of a vertical gradient filling the high–close band. Both this
	 * and `highAreaBottomColor` have to be set for the gradient to be used;
	 * while either is empty the flat `highAreaColor` is drawn instead.
	 */
	highAreaTopColor: string;
	/** Lower stop of the high–close band gradient. See `highAreaTopColor`. */
	highAreaBottomColor: string;
	/**
	 * Upper stop of a vertical gradient filling the close–low band. Both this
	 * and `lowAreaBottomColor` have to be set for the gradient to be used;
	 * while either is empty the flat `lowAreaColor` is drawn instead.
	 */
	lowAreaTopColor: string;
	/** Lower stop of the close–low band gradient. See `lowAreaTopColor`. */
	lowAreaBottomColor: string;
	/**
	 * Radius, in CSS pixels, of the dots drawn on the high, low and close of
	 * the bar under the cursor while the series is hovered. `0` turns the
	 * highlight off.
	 */
	hoverPointRadius: number;
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
	highLineStyle: 0 as LineStyle,
	lowLineStyle: 0 as LineStyle,
	closeLineStyle: 0 as LineStyle,
	highLineVisible: true,
	lowLineVisible: true,
	closeLineVisible: true,
	areaVisible: true,
	lineType: 'simple',
	highAreaTopColor: '',
	highAreaBottomColor: '',
	lowAreaTopColor: '',
	lowAreaBottomColor: '',
	hoverPointRadius: 4,
} as const;
