import {
	CustomSeriesOptions,
	LineStyle,
	LineWidth,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

/**
 * How the points of a band are joined.
 *
 * - `simple` — straight lines between the points.
 * - `step` — a value holds until the next point.
 * - `curved` — a smooth curve through the points.
 */
export type StackedAreaLineType = 'simple' | 'step' | 'curved';

/**
 * What happens where the data has a whitespace gap.
 *
 * - `break` — the bands stop at the gap and start again after it.
 * - `bridge` — the bands are drawn straight across the gap.
 */
export type StackedAreaGapHandling = 'break' | 'bridge';

/** Colours a single point may override for one of its bands. */
export interface StackedAreaPointColor {
	/** Colour of the line along the top of the band. */
	line?: string;
	/** Fill colour of the band, or the top of its gradient. */
	area?: string;
	/** Bottom colour of the band's gradient. */
	areaBottom?: string;
}

/** Appearance of one band of the stack. */
export interface StackedAreaColor {
	/** Colour of the line along the top of the band. */
	line: string;
	/** Fill colour of the band, or the top of its gradient when `areaBottom` is set. */
	area: string;
	/** Bottom colour of the band's gradient. Without it the band is filled with `area` alone. */
	areaBottom?: string;
	/** Width of this band's line, overriding the series `lineWidth`. */
	lineWidth?: LineWidth;
	/** Style of this band's line, overriding the series `lineStyle`. */
	lineStyle?: LineStyle;
	/** Whether this band's line is drawn, overriding the series `lineVisible`. */
	lineVisible?: boolean;
	/** Whether this band is filled, overriding the series `areaVisible`. */
	areaVisible?: boolean;
}

export interface StackedAreaSeriesOptions extends CustomSeriesOptions {
	/**
	 * Appearance of each band, in stacking order. Entries repeat when a point
	 * has more values than there are entries.
	 */
	colors: readonly StackedAreaColor[];
	/** Width of the band lines, in pixels. */
	lineWidth: LineWidth;
	/** Style of the band lines. */
	lineStyle: LineStyle;
	/** Whether the band lines are drawn. */
	lineVisible: boolean;
	/** Whether the bands are filled. */
	areaVisible: boolean;
	/** Price the bands are stacked from. */
	base: number;
	/** How the points of a band are joined. */
	lineType: StackedAreaLineType;
	/** What happens where the data has a whitespace gap. */
	gapHandling: StackedAreaGapHandling;
	/** Scale every point so that its bands total 100 in absolute terms, giving a 100% stacked chart. */
	percent: boolean;
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
	lineStyle: LineStyle.Solid,
	lineVisible: true,
	areaVisible: true,
	base: 0,
	lineType: 'simple',
	gapHandling: 'break',
	percent: false,
} as const;
