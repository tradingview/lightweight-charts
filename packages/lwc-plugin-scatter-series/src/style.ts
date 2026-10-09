import { LineStyle } from 'lightweight-charts';
import { clampOpacity, isFiniteNumber, nonNegativeOr } from '@tradingview/lwc-toolkit/numbers';

import type { ScatterGroupInfo, ScatterPoint } from './data';
import type { ScatterGroup, ScatterSeriesOptions, ScatterShape, ScatterSizeLimits } from './options';
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
		strokeWidth: nonNegativeOr(options.strokeWidth, 0),
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
	return all.map(({ group, declared: isDeclared }: { group: ScatterGroup; declared: boolean }, index: number): ResolvedScatterGroup => {
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
			strokeWidth: nonNegativeOr(group.strokeWidth, series.strokeWidth),
			hollow: typeof group.hollow === 'boolean' ? group.hollow : series.hollow,
			visible: group.visible !== false,
			lineVisible,
			lineWidth: nonNegativeOr(group.lineWidth, 1),
			lineColor: group.lineColor ?? color,
			lineStyle: group.lineStyle ?? LineStyle.Solid,
		};
	});
}

/** The size of a point: see {@link resolvePointStyle}. */
function pointSize(
	point: ScatterPoint,
	group: ResolvedScatterGroup | null,
	series: ScatterSeriesStyle,
	sizeScaling: SizeScaling | null
): number {
	if (isFiniteNumber(point.size)) {
		return clampPointSize(point.size, series.limits);
	}
	if (sizeScaling !== null && isFiniteNumber(point.sizeValue)) {
		return mapSizeValue(point.sizeValue, sizeScaling);
	}
	return group !== null ? group.pointSize : series.pointSize;
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
	const size = pointSize(point, group, series, sizeScaling);
	const hollow = typeof point.hollow === 'boolean' ? point.hollow : (group ?? series).hollow;
	return {
		color: point.color ?? group?.color ?? series.color,
		opacity: clampOpacity(point.opacity, group !== null ? group.opacity : series.opacity),
		size,
		shape: point.shape ?? group?.shape ?? series.shape,
		strokeColor: point.strokeColor !== undefined ? point.strokeColor : (group ?? series).strokeColor,
		strokeWidth: outlineWidth(nonNegativeOr(point.strokeWidth, (group ?? series).strokeWidth), hollow),
		hollow,
	};
}

/**
 * The declared groups with `groupId` shown or hidden, as a legend does it, or
 * `null` when that changes nothing (an unknown group, one already so). A
 * group the points name without declaring it is declared, with the undeclared
 * ones before it, so that the order and the palette colours stay as they are.
 *
 * @param declared - The `groups` option.
 * @param resolved - The groups as they are drawn, in drawing order.
 */
export function withGroupVisibility(
	declared: readonly ScatterGroup[],
	resolved: readonly ResolvedScatterGroup[],
	groupId: string,
	visible: boolean
): ScatterGroup[] | null {
	const position = declared.findIndex((group: ScatterGroup) => group.id === groupId);
	if (position !== -1) {
		if ((declared[position].visible !== false) === visible) {
			return null;
		}
		return declared.map((group: ScatterGroup, index: number) => (index === position ? { ...group, visible } : group));
	}
	const target = resolved.findIndex((group: ResolvedScatterGroup) => group.id === groupId);
	// An unknown group, or an undeclared one being shown: it is shown already.
	if (target === -1 || visible) {
		return null;
	}
	const next = declared.slice();
	for (const group of resolved.slice(0, target + 1)) {
		if (!group.declared) {
			next.push(group.id === groupId ? { id: groupId, visible: false } : { id: group.id });
		}
	}
	return next;
}
