import {
	CustomSeriesOptions,
	DeepPartial,
	LineStyle,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

import { cloneOptions, freezeOptions } from './merge';
import { DEFAULT_POINT_SIZE_LIMITS } from './size';

/**
 * The categorical palette groups without a colour of their own take their
 * colour from, in group order. The first entry is the default point colour,
 * so a single group looks like points with no group.
 */
export const DEFAULT_SCATTER_PALETTE: readonly string[] = freezeOptions([
	'#2962FF',
	'#00C853',
	'#FF9800',
	'#26C6DA',
	'#C51162',
	'#FBC02D',
	'#FF4081',
	'#82B1FF',
	'#AA00FF',
	'#FF3333',
]);

/** Marker shape of a point. */
export type ScatterShape = 'circle' | 'square' | 'diamond' | 'triangleUp' | 'triangleDown';

/**
 * How a point's `sizeValue` is turned into a size.
 *
 * - `linear` — the diameter grows linearly with the value.
 * - `area` — the area grows linearly with the value, so the diameter grows
 *   with its square root. This is the usual choice for bubble charts, where the
 *   eye compares areas.
 */
export type ScatterSizeScale = 'linear' | 'area';

/**
 * A range whose ends may be left open. `null` means the end is decided
 * automatically from the data.
 */
export interface ScatterRange {
	/** Lower end, or `null` for automatic. */
	min: number | null;
	/** Upper end, or `null` for automatic. */
	max: number | null;
}

/** A closed range of point sizes, in CSS pixels. */
export interface ScatterSizeRange {
	/** Size of the smallest value. */
	min: number;
	/** Size of the largest value. */
	max: number;
}

/** The smallest and the largest size a point may have, in CSS pixels, stroke included. */
export interface ScatterSizeLimits {
	/** Smallest size, at least 1. */
	min: number;
	/** Largest size, at most 500. */
	max: number;
}

/**
 * A named group of points sharing a style: a "series" in the user's terms.
 * Every field but `id` is optional and falls back to the series options.
 */
export interface ScatterGroup {
	/** Identifier points refer to with their `group` field. */
	id: string;
	/** Display name, for the host's legend. Defaults to `id`. */
	name?: string;
	/** Fill colour. Defaults to the palette entry for the group's position. */
	color?: string;
	/** Opacity of the points, `0`–`1`. Defaults to `1` with `lineVisible`, otherwise to the series `opacity`. */
	opacity?: number;
	/** Marker shape. Defaults to the series `shape`. */
	shape?: ScatterShape;
	/** Size of the points in CSS pixels, stroke included. Defaults to the series `pointSize`. */
	pointSize?: number;
	/**
	 * Colour of the ring around the points (the outline of hollow ones).
	 *
	 * Left out, the group takes the series `strokeColor`. `null` is not the
	 * same: it asks for the automatic colour — the chart background, or the
	 * point colour for a hollow point — even when the series sets a colour. It
	 * is the only field of a group that takes `null`.
	 */
	strokeColor?: string | null;
	/** Width of the ring around the points, in CSS pixels. Defaults to the series `strokeWidth`. */
	strokeWidth?: number;
	/** Draw the points as open markers: an outline, no fill. Defaults to the series `hollow`. */
	hollow?: boolean;
	/**
	 * Whether the group is drawn, hit tested and autoscaled. Defaults to
	 * `true`. A hidden group still counts for the automatic X range and size
	 * domain, so hiding it neither moves the X axis nor resizes other points.
	 */
	visible?: boolean;
	/** Connect the group's points with a line, in data order. Defaults to `false`. */
	lineVisible?: boolean;
	/** Width of the connecting line in CSS pixels. Defaults to `1`. */
	lineWidth?: number;
	/** Colour of the connecting line. Defaults to the group colour. */
	lineColor?: string;
	/** Style of the connecting line. Defaults to solid. */
	lineStyle?: LineStyle;
}

/** A reference line across the plot. */
export interface ScatterBaseline {
	/**
	 * Axis the value is on: `'y'` draws a horizontal line at a Y value, `'x'` a
	 * vertical line at an X value.
	 */
	axis: 'x' | 'y';
	/** Where the line is drawn, in data units of its axis. */
	value: number;
	/** Line colour. Defaults to `'#9598A1'`. */
	color?: string;
	/** Line width in CSS pixels. Defaults to `1`. */
	width?: number;
	/** Line style. Defaults to solid. */
	style?: LineStyle;
}

/** An accent border drawn along the edges of the plot area. */
export interface ScatterPlotBorder {
	/** Whether the border is drawn at all. */
	visible: boolean;
	/** Border colour. */
	color: string;
	/** Border width in CSS pixels. */
	width: number;
	/** Border style. */
	style: LineStyle;
	/** Draw the top edge. */
	top: boolean;
	/** Draw the right edge. */
	right: boolean;
	/** Draw the bottom edge. */
	bottom: boolean;
	/** Draw the left edge. */
	left: boolean;
}

/**
 * Options of a scatter series. The fields inherited from
 * `CustomSeriesOptions` behave as for any series, except two: `color` is the
 * fill colour of points which belong to no group, and `hitTestTolerance` is
 * how many pixels outside a point the pointer may be and still hover it
 * (when it is inside no point).
 */
export interface ScatterSeriesOptions extends CustomSeriesOptions {
	/** Opacity of points which set none themselves, `0`–`1`. */
	opacity: number;
	/** Size of points which set none themselves, in CSS pixels, stroke included. Clamped to `pointSizeLimits`. */
	pointSize: number;
	/**
	 * The smallest and the largest size of any point, in CSS pixels, stroke
	 * included: every size — `pointSize`, a group's `pointSize`, a point's
	 * `size` and the ends of `sizeRange` — is clamped to it. Each end is kept
	 * within 1–500 px, an end which is not a number takes its default, and
	 * reversed ends are swapped.
	 */
	pointSizeLimits: ScatterSizeLimits;
	/** Marker shape of points which set none, and whose group sets none. */
	shape: ScatterShape;
	/**
	 * Colour of the thin ring around every point. `null` takes the chart's
	 * background colour (the top colour of a gradient) at every draw, so the
	 * ring follows a theme change; a hollow point takes its own colour.
	 */
	strokeColor: string | null;
	/**
	 * Width of the ring around every point, in CSS pixels. `0` draws none.
	 * It is at most a quarter of the point's size, so that small points keep
	 * their colour.
	 */
	strokeWidth: number;
	/**
	 * Draw points as open markers: an outline `strokeWidth` wide (at least
	 * 1 px) in the point colour, or in `strokeColor` when one is set, and no
	 * fill. The size includes the outline, and the whole marker hovers.
	 */
	hollow: boolean;
	/** Opacity of the hovered point, which is also drawn on top of the others. */
	hoveredOpacity: number;
	/**
	 * Pixels added to the size of the hovered point. `0` keeps it as it is.
	 * The grown point is hit tested at its grown size, and `pointById`,
	 * `hoveredPoint` and the hovered-point subscription report its grown
	 * `radius`.
	 */
	hoveredSizeIncrease: number;
	/**
	 * Width of a ring drawn around the hovered point, in CSS pixels. `0` draws
	 * none. The ring follows the marker's shape `hoveredRingGap` pixels outside
	 * its reported `radius`, is not hovered itself, and the price scale keeps
	 * room for it.
	 */
	hoveredRingWidth: number;
	/** Colour of the ring around the hovered point. `null` takes the point colour. */
	hoveredRingColor: string | null;
	/** Room between the hovered point and its ring, in CSS pixels. */
	hoveredRingGap: number;
	/** Colours of groups which set none, in group order. */
	palette: readonly string[];
	/**
	 * The groups points can belong to, in drawing order. A group a point refers
	 * to but which is not declared here is added after them, in order of first
	 * appearance.
	 */
	groups: readonly ScatterGroup[];
	/** Sizes the `sizeValue` of a point is mapped to. Each end is clamped to `pointSizeLimits`. */
	sizeRange: ScatterSizeRange;
	/**
	 * The `sizeValue`s mapped to the ends of `sizeRange`; values beyond the
	 * domain take the size of its ends. An open end is taken
	 * from the points of every group, hidden ones included, so sizes compare
	 * across groups and stay as they are when a group is hidden. When every
	 * value lies past the one given end, the domain is that end alone: the
	 * values get the size of that end.
	 */
	sizeDomain: ScatterRange;
	/** How `sizeValue` is turned into a size. */
	sizeScale: ScatterSizeScale;
	/**
	 * The X axis range. An open end is rounded outwards from the data to a nice
	 * tick. A given end is snapped outwards to the nearest slot of the axis grid
	 * (a tenth or a twentieth of a tick), and points outside are not drawn.
	 * Ends given in the wrong order are swapped, and an end beyond ±1e300 is
	 * brought back to it.
	 */
	xRange: ScatterRange;
	/**
	 * Room between each end of the X domain and the edge of the plot, in CSS
	 * pixels, so that the bubbles at the ends are not cut in half. `0` puts the
	 * ends of the domain on the plot edges, as the design does. At most a
	 * quarter of the plot width is used. Above `0` the series frees the chart's
	 * fixed edges, which the margins need, and fixes them again when the
	 * margins return to `0` or the series is removed. While the user can
	 * scroll or zoom, the chart then centres the end labels on their values,
	 * and the room at a free edge is widened to keep its label inside the plot.
	 */
	xMargins: number;
	/**
	 * Pins the ends of the Y axis: a pinned end is at the edge of the price
	 * scale margins, with no room added. An open end autoscales to the visible
	 * points and the horizontal baselines, with room for the largest point.
	 * Ends given in the wrong order are swapped.
	 */
	yRange: ScatterRange;
	/**
	 * Formats X values for the axis labels (and the crosshair label when it is
	 * shown). `null` prints the number with as many decimals as the axis step
	 * needs.
	 */
	xFormatter: ((x: number) => string) | null;
	/**
	 * Reference lines drawn under the points. The price scale keeps the
	 * horizontal ones in view, and the automatic X range includes the vertical
	 * ones.
	 */
	baselines: readonly ScatterBaseline[];
	/** Accent border drawn along the edges of the plot. */
	plotBorder: ScatterPlotBorder;
}

/**
 * The options which hold arrays or functions. They are replaced as a whole by
 * `applyOptions`, never merged.
 */
export type ScatterReplacedOptionKeys = 'palette' | 'groups' | 'baselines' | 'xFormatter';

/** A subset of {@link ScatterSeriesOptions}, as `applyOptions` takes it. */
export type ScatterSeriesPartialOptions =
	DeepPartial<Omit<ScatterSeriesOptions, ScatterReplacedOptionKeys>> &
	Partial<Pick<ScatterSeriesOptions, ScatterReplacedOptionKeys>>;

/**
 * The options a scatter series adds to `CustomSeriesOptions`, with their
 * defaults. Frozen: a series works on copies, so that nothing it hands out can
 * change the defaults of the next one.
 */
export const scatterOptionDefaults: Omit<ScatterSeriesOptions, keyof CustomSeriesOptions> = freezeOptions({
	opacity: 0.65,
	pointSize: 9,
	pointSizeLimits: { ...DEFAULT_POINT_SIZE_LIMITS },
	shape: 'circle',
	strokeColor: null,
	strokeWidth: 1,
	hollow: false,
	hoveredOpacity: 1,
	hoveredSizeIncrease: 0,
	hoveredRingWidth: 0,
	hoveredRingColor: null,
	hoveredRingGap: 1,
	palette: DEFAULT_SCATTER_PALETTE,
	groups: [],
	sizeRange: { min: 5, max: 25 },
	sizeDomain: { min: null, max: null },
	sizeScale: 'linear',
	xRange: { min: null, max: null },
	xMargins: 0,
	yRange: { min: null, max: null },
	xFormatter: null,
	baselines: [],
	plotBorder: {
		visible: false,
		color: '#9598A1',
		width: 1,
		style: LineStyle.Solid,
		top: true,
		right: true,
		bottom: true,
		left: true,
	},
});

/**
 * The `CustomSeriesOptions` a scatter series starts with: the library's, with
 * the default point colour and without the price line and last value label.
 * A frozen copy, which shares no object with the library's defaults.
 */
export const underlyingSeriesDefaults: CustomSeriesOptions = freezeOptions(cloneOptions({
	...customSeriesDefaultOptions,
	color: '#2962FF',
	lastValueVisible: false,
	priceLineVisible: false,
}));

/**
 * Default options of a scatter series: a copy for reading, which no series
 * reads back.
 */
export const defaultOptions: ScatterSeriesOptions = cloneOptions({
	...underlyingSeriesDefaults,
	...scatterOptionDefaults,
});

/** The option keys a scatter series adds to `CustomSeriesOptions`. */
export const scatterOptionKeys: ReadonlySet<string> = new Set<string>(Object.keys(scatterOptionDefaults));
