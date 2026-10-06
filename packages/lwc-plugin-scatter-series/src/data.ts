import { CustomData, LineStyle } from 'lightweight-charts';

import type { ScatterShape, ScatterSizeScale } from './options';

/**
 * One point of a scatter series. Extend it with fields of your own (a title,
 * a source record, …): they are kept and handed back by `pointById`.
 */
export interface ScatterPoint {
	/** Horizontal position, in X axis units. */
	x: number;
	/** Vertical position, in price scale units. */
	y: number;
	/**
	 * Stable identifier, reported as `objectId` when the point is hovered.
	 * Defaults to the point's index in the data as a string. Keep it unique.
	 */
	id?: string;
	/** Identifier of the group the point belongs to. */
	group?: string;
	/** Value mapped to a size through `sizeRange`, `sizeDomain` and `sizeScale`. */
	sizeValue?: number;
	/** Size in CSS pixels, stroke included, overriding `sizeValue` and the group. Clamped to `pointSizeLimits`. */
	size?: number;
	/** Fill colour, overriding the group. */
	color?: string;
	/** Opacity `0`–`1`, overriding the group. */
	opacity?: number;
	/** Marker shape, overriding the group. */
	shape?: ScatterShape;
	/**
	 * Colour of the ring around the point (the outline of a hollow one).
	 *
	 * Left out, the point takes its group's (else the series') `strokeColor`.
	 * `null` is not the same: it asks for the automatic colour — the chart
	 * background, or the point colour when hollow — even when the group or the
	 * series sets a colour. It is the only field of a point that takes `null`.
	 */
	strokeColor?: string | null;
	/** Width of the ring around the point in CSS pixels, overriding the group. */
	strokeWidth?: number;
	/** Draw the point as an open marker, overriding the group. */
	hollow?: boolean;
}

/**
 * Data item of the underlying custom series: one slot of the X axis grid.
 * Slots holding points carry the vertical extent of those points, which is
 * what the price scale autoscales on; empty slots are whitespace.
 */
export interface ScatterSlotData extends CustomData<number> {
	/** Lowest Y of the points in the slot. */
	yMin: number;
	/** Highest Y of the points in the slot. */
	yMax: number;
}

/** Where a point is drawn and how, for a host positioning a tooltip or a highlight. */
export interface ScatterPointInfo<TPoint extends ScatterPoint = ScatterPoint> {
	/** The point's `objectId`: its `id`, or its index as a string. */
	objectId: string;
	/** The point as it was passed to `setData`. */
	point: TPoint;
	/** Index of the point in the data. */
	index: number;
	/** Group of the point, or `null` when it belongs to none. */
	groupId: string | null;
	/** Horizontal centre of the point within the pane, in CSS pixels. */
	x: number;
	/** Vertical centre of the point within the pane, in CSS pixels. */
	y: number;
	/**
	 * Half the drawn size, stroke included, in CSS pixels. For the hovered
	 * point, with `hoveredSizeIncrease`; a hover ring lies outside it.
	 */
	radius: number;
	/** Resolved colour: of the fill, or of the outline of a hollow point. */
	color: string;
	/** Resolved opacity, before any hover highlight. */
	opacity: number;
	/** Resolved marker shape. */
	shape: ScatterShape;
	/** Whether the point is drawn as an open marker. */
	hollow: boolean;
	/** Colour the ring (or the outline of a hollow point) is drawn in, the automatic colour resolved. */
	strokeColor: string;
	/** Width of the ring (or of the outline) as drawn, in CSS pixels: at most a quarter of the size. */
	strokeWidth: number;
}

/**
 * A group as the series draws it: every field of a `ScatterGroup` with the
 * defaults and the palette applied, for a host legend.
 */
export interface ScatterGroupInfo {
	/** Identifier points refer to. */
	id: string;
	/** Display name: the declared `name`, else the id. */
	name: string;
	/** Fill colour of its points: its own, else the palette entry for its position. */
	color: string;
	/** Opacity of its points. */
	opacity: number;
	/** Marker shape of its points. */
	shape: ScatterShape;
	/** Size of its points in CSS pixels, stroke included, before `sizeValue` and per-point sizes. */
	pointSize: number;
	/** Whether its points are open markers. */
	hollow: boolean;
	/**
	 * Colour of the ring around its points (the outline of hollow ones), the
	 * automatic colour resolved: the chart background, or the group colour
	 * when hollow.
	 */
	strokeColor: string;
	/**
	 * Width of the ring around its points (the outline of hollow ones), in CSS
	 * pixels, as drawn on a point of the group's `pointSize`: its
	 * `strokeWidth`, at least 1 for hollow markers, and at most a quarter of
	 * `pointSize` — the `strokeWidth` `pointById` reports for such a point.
	 * A point of another size (`size`, `sizeValue`) may have a narrower one.
	 */
	strokeWidth: number;
	/** Whether it is drawn. */
	visible: boolean;
	/** Whether its points are connected by a line. */
	lineVisible: boolean;
	/** Width of the connecting line, CSS pixels. */
	lineWidth: number;
	/** Colour of the connecting line. */
	lineColor: string;
	/** Style of the connecting line. */
	lineStyle: LineStyle;
	/** Number of points of the data that belong to it. */
	pointCount: number;
}

/**
 * How `sizeValue` is mapped to a size, as the series draws it: for a host's
 * bubble-size legend.
 */
export interface ScatterSizeMapping {
	/**
	 * The values mapped to the ends of the range: `sizeDomain`, an open end
	 * taken from the points of every group, hidden ones included.
	 */
	domain: { min: number; max: number };
	/** The sizes the ends of the domain are drawn at, in CSS pixels: `sizeRange` within `pointSizeLimits`. */
	range: { min: number; max: number };
	/** Whether the diameter or the area grows linearly with the value. */
	scale: ScatterSizeScale;
	/**
	 * The size a point with this `sizeValue` is drawn at, in CSS pixels,
	 * stroke included — clamped to the range as the points are. `NaN` for a
	 * value which is not a finite number.
	 */
	sizeFor(value: number): number;
}
