import type { ScatterGroupInfo, ScatterPoint } from './data';
import type { ScatterGroup, ScatterSeriesOptions, ScatterShape, ScatterSizeLimits } from './options';
import type { LineStyle } from 'lightweight-charts';
import { SizeScaling, cappedStrokeWidth, clampPointSize, mapSizeValue, normalizeSizeLimits } from './size';

/** The series options which style points. */
export type ScatterStyleOptions = Pick<
	ScatterSeriesOptions,
	'color' | 'opacity' | 'pointSize' | 'pointSizeLimits' | 'shape' | 'palette' | 'strokeColor' | 'strokeWidth' | 'hollow'
>;

/** The series options which style points, checked and with the size limits applied: the defaults of every group. */
export interface ScatterSeriesStyle {
	/** Fill colour of points of no group, and of groups when the palette is empty. */
	color: string;
	/** Opacity of points. */
	opacity: number;
	/** Size of points, clamped. */
	pointSize: number;
	/** The size limits, normalised. */
	limits: ScatterSizeLimits;
	/** Marker shape. */
	shape: ScatterShape;
	/** Colours of groups without one. */
	palette: readonly string[];
	/** Ring colour; `null` for the automatic one. */
	strokeColor: string | null;
	/** Ring width, at least `0`. */
	strokeWidth: number;
	/** Whether points are open markers. */
	hollow: boolean;
}

/** A group with every style decided. */
export interface ResolvedScatterGroup {
	/** Identifier points refer to. */
	id: string;
	/** Display name. */
	name: string;
	/** Position in the drawing order. */
	index: number;
	/** Whether the group was declared in the options, rather than found in the data. */
	declared: boolean;
	/** Fill colour of its points. */
	color: string;
	/** Opacity of its points. */
	opacity: number;
	/** Marker shape of its points. */
	shape: ScatterShape;
	/** Size of its points, clamped. */
	pointSize: number;
	/** Ring colour of its points; `null` for the automatic one. */
	strokeColor: string | null;
	/** Ring width of its points as asked for, before the outline minimum of hollow points. */
	strokeWidth: number;
	/** Whether its points are open markers. */
	hollow: boolean;
	/** Whether it is drawn, hit tested and autoscaled. */
	visible: boolean;
	/** Whether its points are connected by a line. */
	lineVisible: boolean;
	/** Width of the connecting line, CSS pixels. */
	lineWidth: number;
	/** Colour of the connecting line. */
	lineColor: string;
	/** Style of the connecting line. */
	lineStyle: LineStyle;
}

/** The resolved look of one point. */
export interface ScatterPointStyle {
	/** Fill colour, or the outline colour of a hollow point. */
	color: string;
	/** Opacity, `0`–`1`. */
	opacity: number;
	/** Size in CSS pixels, stroke included, clamped to the size limits. */
	size: number;
	/** Marker shape. */
	shape: ScatterShape;
	/** Ring colour; `null` for the automatic one. */
	strokeColor: string | null;
	/** Width of the ring, or of the outline of a hollow point, before the cap to a quarter of the size. */
	strokeWidth: number;
	/** Whether the point is an open marker. */
	hollow: boolean;
}

/** Clamps an opacity to `0`–`1`, falling back for a value which is not a number. */
export function clampOpacity(opacity: number | undefined, fallback: number): number {
	const value = opacity !== undefined && Number.isFinite(opacity) ? opacity : fallback;
	return Math.min(1, Math.max(0, value));
}

function isFiniteNumber(value: number | undefined): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/** A stroke width, at least `0`, or `fallback` when it is not a number. */
function strokeWidthOr(width: number | undefined, fallback: number): number {
	return isFiniteNumber(width) ? Math.max(0, width) : fallback;
}

/**
 * Width of the outline a point is drawn with: the stroke width, at least
 * 1 px for an open marker, which is nothing but its outline.
 */
export function outlineWidth(strokeWidth: number, hollow: boolean): number {
	return hollow ? Math.max(1, strokeWidth) : strokeWidth;
}

/**
 * The colour the ring of a point is drawn in: its own, else the automatic
 * one — the point colour for an open marker, the background for a filled one.
 */
export function strokeColorOf(
	style: { readonly strokeColor: string | null; readonly hollow: boolean; readonly color: string },
	background: string
): string {
	return style.strokeColor ?? (style.hollow ? style.color : background);
}

/**
 * A group as a host legend sees it: its styles resolved as they are drawn on
 * a point of the group's `pointSize` — the automatic ring colour resolved,
 * and the ring (or outline) as wide as it is drawn on such a point, so that a
 * legend marker matches the plot.
 */
export function describeGroup(group: ResolvedScatterGroup, pointCount: number, background: string): ScatterGroupInfo {
	return {
		id: group.id,
		name: group.name,
		color: group.color,
		opacity: group.opacity,
		shape: group.shape,
		pointSize: group.pointSize,
		hollow: group.hollow,
		strokeColor: strokeColorOf(group, background),
		strokeWidth: cappedStrokeWidth(group.pointSize, outlineWidth(group.strokeWidth, group.hollow)),
		visible: group.visible,
		lineVisible: group.lineVisible,
		lineWidth: group.lineWidth,
		lineColor: group.lineColor,
		lineStyle: group.lineStyle,
		pointCount,
	};
}

/** The series style options, checked, with the size limits normalised and applied. */
export function resolveSeriesStyle(options: ScatterStyleOptions): ScatterSeriesStyle {
	const limits = normalizeSizeLimits(options.pointSizeLimits);
	return {
		color: options.color,
		opacity: clampOpacity(options.opacity, 1),
		pointSize: clampPointSize(options.pointSize, limits),
		limits,
		shape: options.shape,
		palette: options.palette,
		strokeColor: options.strokeColor ?? null,
		strokeWidth: strokeWidthOr(options.strokeWidth, 0),
		hollow: options.hollow === true,
	};
}

/**
 * The groups in drawing order: the declared ones first, then the ones the
 * points refer to without being declared, in order of first appearance.
 * A group without a colour takes the palette entry for its position; every
 * other style it does not set comes from the series.
 */
export function resolveGroups(
	declared: readonly ScatterGroup[],
	points: readonly ScatterPoint[],
	series: ScatterSeriesStyle
): ResolvedScatterGroup[] {
	const all: { group: ScatterGroup; declared: boolean }[] = [];
	const seen = new Set<string>();
	for (const group of declared) {
		if (!seen.has(group.id)) {
			seen.add(group.id);
			all.push({ group, declared: true });
		}
	}
	for (const point of points) {
		const id = point.group;
		if (id !== undefined && !seen.has(id)) {
			seen.add(id);
			all.push({ group: { id }, declared: false });
		}
	}
	const palette = series.palette;
	return all.map(({ group, declared: isDeclared }, index: number): ResolvedScatterGroup => {
		const color = group.color ?? (palette.length > 0 ? palette[index % palette.length] : series.color);
		const lineVisible = group.lineVisible === true;
		return {
			id: group.id,
			name: group.name ?? group.id,
			index,
			declared: isDeclared,
			color,
			// With lines, points are drawn opaque so the line does not show through.
			opacity: clampOpacity(group.opacity, lineVisible ? 1 : series.opacity),
			shape: group.shape ?? series.shape,
			pointSize: isFiniteNumber(group.pointSize) ? clampPointSize(group.pointSize, series.limits) : series.pointSize,
			strokeColor: group.strokeColor !== undefined ? group.strokeColor : series.strokeColor,
			strokeWidth: strokeWidthOr(group.strokeWidth, series.strokeWidth),
			hollow: typeof group.hollow === 'boolean' ? group.hollow : series.hollow,
			visible: group.visible !== false,
			lineVisible,
			lineWidth: group.lineWidth !== undefined && Number.isFinite(group.lineWidth) ? Math.max(0, group.lineWidth) : 1,
			lineColor: group.lineColor ?? color,
			lineStyle: group.lineStyle ?? (0 as LineStyle),
		};
	});
}

/**
 * The look of a point: its own fields first, then its group, then the series
 * options. The size is the point's `size`, else its `sizeValue` mapped
 * through `sizeScaling` (when there is one), else the group's or the series'
 * size; it is always within the size limits.
 */
export function resolvePointStyle(
	point: ScatterPoint,
	group: ResolvedScatterGroup | null,
	series: ScatterSeriesStyle,
	sizeScaling: SizeScaling | null
): ScatterPointStyle {
	let size: number;
	if (isFiniteNumber(point.size)) {
		size = clampPointSize(point.size, series.limits);
	} else if (sizeScaling !== null && isFiniteNumber(point.sizeValue)) {
		size = mapSizeValue(point.sizeValue, sizeScaling);
	} else {
		size = group !== null ? group.pointSize : series.pointSize;
	}
	const hollow = typeof point.hollow === 'boolean' ? point.hollow : (group ?? series).hollow;
	return {
		color: point.color ?? group?.color ?? series.color,
		opacity: clampOpacity(point.opacity, group !== null ? group.opacity : series.opacity),
		size,
		shape: point.shape ?? group?.shape ?? series.shape,
		strokeColor: point.strokeColor !== undefined ? point.strokeColor : (group ?? series).strokeColor,
		strokeWidth: outlineWidth(strokeWidthOr(point.strokeWidth, (group ?? series).strokeWidth), hollow),
		hollow,
	};
}
