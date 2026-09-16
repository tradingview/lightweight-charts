import { LineStyle, PrimitivePaneViewZOrder, Time } from 'lightweight-charts';

/**
 * An optional text badge drawn on the line itself, for a short caption that
 * should stay next to the line rather than sit on the time axis.
 */
export interface VerticalLineBadgeOptions {
	/** Text of the badge. An empty string hides it. */
	text: string;
	/** Text color. */
	color: string;
	/** Background color. */
	backgroundColor: string;
	/** Border color. Leave undefined for no border. */
	borderColor?: string;
	/** Border width, in CSS pixels. */
	borderWidth: number;
	/** Corner radius of the background, in CSS pixels. */
	borderRadius: number;
	/** Font, as a CSS `font` shorthand. */
	font: string;
	/** Space between the text and the edge of the background, in CSS pixels. */
	padding: number;
	/** Distance from the line and from the pane edge, in CSS pixels. */
	margin: number;
	/** Where along the line the badge sits. */
	verticalAlign: 'top' | 'middle' | 'bottom';
	/** Which side of the line the badge sits on. */
	horizontalAlign: 'left' | 'right';
}

/** Where the line is placed when its time is not a bar of the chart. */
export type VerticalLineSnap = 'exact' | 'nearest';

export interface VerticalLineOptions {
	/** Color of the line. */
	color: string;
	/** Width of the line, in CSS pixels. */
	width: number;
	/** Dash pattern of the line. */
	lineStyle: LineStyle;
	/**
	 * Draw the line itself. Set it to `false` for a time-axis label with no
	 * line, which is also what the badge and the hit test follow.
	 */
	lineVisible: boolean;
	/** Show a label at the line's position on the time axis. */
	showLabel: boolean;
	/** Draw the tick mark of the time-axis label. */
	tickVisible: boolean;
	/** Text of the time-axis label. Overrides {@link labelFormatter} when set. */
	labelText: string;
	/**
	 * Builds the text of the time-axis label from the line's time. Used only
	 * while `labelText` is empty; the default formats the time the way the
	 * chart's own time axis does.
	 */
	labelFormatter?: (time: Time) => string;
	/** Background color of the label. */
	labelBackgroundColor: string;
	/** Text color of the label. */
	labelTextColor: string;
	/** Layer the line is drawn in. */
	zOrder: PrimitivePaneViewZOrder;
	/**
	 * `'exact'` draws the line only at a time which is a bar of the chart;
	 * `'nearest'` places it at the closest bar instead.
	 */
	snap: VerticalLineSnap;
	/** Lets the user drag the line along the time scale. */
	draggable: boolean;
	/** Distance from the line, in CSS pixels, still counted as a hit. */
	hitTestTolerance: number;
	/** Reported as `externalId` for a hit on this line. */
	id: string;
	/** Text badge drawn on the line. Omit it for no badge. */
	badge?: Partial<VerticalLineBadgeOptions> & { text: string };
}

/** @deprecated Use VerticalLineOptions. */
export type VertLineOptions = VerticalLineOptions;

/** Values used for any option not passed to the constructor. */
export const defaultOptions: VerticalLineOptions = {
	color: 'green',
	width: 3,
	lineStyle: LineStyle.Solid,
	lineVisible: true,
	showLabel: false,
	tickVisible: true,
	labelText: '',
	labelBackgroundColor: 'green',
	labelTextColor: 'white',
	zOrder: 'normal',
	snap: 'exact',
	draggable: false,
	hitTestTolerance: 4,
	id: 'vertical-line',
};

/** Values used for any badge option left out. */
export const defaultBadgeOptions: VerticalLineBadgeOptions = {
	text: '',
	color: 'white',
	backgroundColor: 'green',
	borderWidth: 0,
	borderRadius: 4,
	font: '12px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
	padding: 4,
	margin: 4,
	verticalAlign: 'top',
	horizontalAlign: 'right',
};
