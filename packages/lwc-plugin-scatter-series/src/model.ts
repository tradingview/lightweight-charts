import type { WhitespaceData } from 'lightweight-charts';

import type { ScatterPoint, ScatterSlotData } from './data';
import type { ScatterBaseline, ScatterRange, ScatterSeriesOptions, ScatterShape } from './options';
import { SizeScaling, normalizeSizeRange, resolveSizeDomain } from './size';
import { ResolvedScatterGroup, resolveGroups, resolvePointStyle, resolveSeriesStyle } from './style';
import { SlotGrid, XDomain, buildSlotGrid, computeXDomain, isDrawableX, slotIndexOf, slotValue } from './x-axis';

/** A point with every style decided. */
export interface ResolvedScatterPoint {
	/** The point's `objectId`. */
	id: string;
	/** X value. */
	x: number;
	/** Y value. */
	y: number;
	/** Index of its group in {@link ScatterModel.groups}, `-1` for none. */
	groupIndex: number;
	/** Fill colour, or the outline colour of a hollow point. */
	color: string;
	/** Opacity. */
	opacity: number;
	/** Size in CSS pixels, stroke included. */
	size: number;
	/** Marker shape. */
	shape: ScatterShape;
	/** Ring colour; `null` for the automatic one (the background, or `color` when hollow). */
	strokeColor: string | null;
	/** Width of the ring or of the outline, before the cap to a quarter of the size. */
	strokeWidth: number;
	/** Whether the point is an open marker. */
	hollow: boolean;
	/**
	 * Whether the point is drawn: finite coordinates (X within
	 * `MAX_X_MAGNITUDE`), a visible group, inside the X domain.
	 */
	visible: boolean;
}

/** One slot of the underlying series: the extent of its points, or whitespace. */
export type ScatterSlotItem = ScatterSlotData | WhitespaceData<number>;

/** Everything a scatter series draws, hit tests and autoscales from. */
export interface ScatterModel<TPoint extends ScatterPoint = ScatterPoint> {
	/** The points as given. */
	points: readonly TPoint[];
	/** The resolved points, by data index. */
	resolved: readonly ResolvedScatterPoint[];
	/** The groups in drawing order. */
	groups: readonly ResolvedScatterGroup[];
	/** Data indices of the visible points, in drawing order (bottom first). */
	drawOrder: readonly number[];
	/** For each group, the data indices of its points with finite coordinates, in data order (for its line). */
	groupMembers: readonly (readonly number[])[];
	/** Data index of each `objectId`; the first point wins a duplicate id. */
	idToIndex: ReadonlyMap<string, number>;
	/** Whether two points or more share an `objectId`. */
	duplicateIds: boolean;
	/** Number of points of each group, by index in {@link groups}. */
	groupPointCounts: readonly number[];
	/** The X domain. */
	domain: XDomain;
	/** The slot grid of the X axis. */
	grid: SlotGrid;
	/** The data of the underlying series, one item per slot. */
	slots: readonly ScatterSlotItem[];
	/** The largest size of a visible point, CSS pixels. `0` without one. */
	maxSize: number;
	/**
	 * How `sizeValue` is mapped to sizes, or `null` when no point is sized by
	 * its `sizeValue` (a finite one, and no `size` of its own).
	 */
	sizeScaling: SizeScaling | null;
	/** Whether any point is drawn. */
	hasVisiblePoints: boolean;
	/** The horizontal baselines, which the price scale includes. */
	yBaselines: readonly ScatterBaseline[];
	/** Whether a point has a finite X too large for the axis (beyond `MAX_X_MAGNITUDE`), and is not drawn. */
	xOutOfRange: boolean;
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Builds the model of a scatter series from its points and options. Pure: it
 * neither reads nor changes anything but its arguments.
 */
export function buildScatterModel<TPoint extends ScatterPoint>(
	points: readonly TPoint[],
	options: ScatterSeriesOptions
): ScatterModel<TPoint> {
	const series = resolveSeriesStyle(options);
	const groups = resolveGroups(options.groups, points, series);
	const groupIndexById = new Map<string, number>();
	for (const group of groups) {
		groupIndexById.set(group.id, group.index);
	}
	const groupOf = (point: ScatterPoint): ResolvedScatterGroup | null => {
		const index = point.group !== undefined ? groupIndexById.get(point.group) : undefined;
		return index !== undefined ? groups[index] : null;
	};

	// Sizes compare across every group, hidden ones included, so that showing
	// or hiding a group leaves the sizes of the others as they are.
	const sizeValues: number[] = [];
	for (const point of points) {
		if (isFiniteNumber(point.sizeValue) && !isFiniteNumber(point.size)) {
			sizeValues.push(point.sizeValue);
		}
	}
	const sizeDomain = sizeValues.length > 0 ? resolveSizeDomain(sizeValues, options.sizeDomain) : null;
	const sizeScaling: SizeScaling | null = sizeDomain === null
		? null
		: { domain: sizeDomain, range: normalizeSizeRange(options.sizeRange, series.limits), scale: options.sizeScale };

	// The X domain covers every point, hidden groups included, so that a legend
	// switching groups never moves the X axis, and the vertical baselines.
	let dataMin: number | null = null;
	let dataMax: number | null = null;
	let allYMin = Number.POSITIVE_INFINITY;
	let allYMax = Number.NEGATIVE_INFINITY;
	const extend = (x: number): void => {
		dataMin = dataMin === null ? x : Math.min(dataMin, x);
		dataMax = dataMax === null ? x : Math.max(dataMax, x);
	};
	let xOutOfRange = false;
	for (const point of points) {
		if (isDrawableX(point.x) && isFiniteNumber(point.y)) {
			extend(point.x);
			allYMin = Math.min(allYMin, point.y);
			allYMax = Math.max(allYMax, point.y);
		} else if (isFiniteNumber(point.x)) {
			xOutOfRange = xOutOfRange || isFiniteNumber(point.y);
		}
	}
	for (const baseline of options.baselines) {
		if (baseline.axis === 'x' && isDrawableX(baseline.value)) {
			extend(baseline.value);
		}
	}
	const domain = computeXDomain(dataMin, dataMax, options.xRange);
	const grid = buildSlotGrid(domain);
	const domainMin = slotValue(grid, 0);
	const domainMax = slotValue(grid, grid.count - 1);

	const resolved: ResolvedScatterPoint[] = new Array<ResolvedScatterPoint>(points.length);
	const idToIndex = new Map<string, number>();
	const ungrouped: number[] = [];
	const byGroup: number[][] = groups.map(() => []);
	const groupMembers: number[][] = groups.map(() => []);
	const yMin = new Array<number>(grid.count).fill(Number.POSITIVE_INFINITY);
	const yMax = new Array<number>(grid.count).fill(Number.NEGATIVE_INFINITY);
	const groupPointCounts = groups.map(() => 0);
	let duplicateIds = false;
	let visibleYMin = Number.POSITIVE_INFINITY;
	let maxSize = 0;

	for (let index = 0; index < points.length; index++) {
		const point = points[index];
		const group = groupOf(point);
		const style = resolvePointStyle(point, group, series, sizeScaling);
		const id = point.id ?? String(index);
		const finite = isDrawableX(point.x) && isFiniteNumber(point.y);
		const inDomain = finite && point.x >= domainMin && point.x <= domainMax;
		const visible = inDomain && (group === null || group.visible);
		resolved[index] = {
			id,
			x: point.x,
			y: point.y,
			groupIndex: group !== null ? group.index : -1,
			color: style.color,
			opacity: style.opacity,
			size: style.size,
			shape: style.shape,
			strokeColor: style.strokeColor,
			strokeWidth: style.strokeWidth,
			hollow: style.hollow,
			visible,
		};
		if (!idToIndex.has(id)) {
			idToIndex.set(id, index);
		} else {
			duplicateIds = true;
		}
		if (group !== null) {
			groupPointCounts[group.index]++;
			if (finite) {
				groupMembers[group.index].push(index);
			}
		}
		if (!visible) {
			continue;
		}
		(group !== null ? byGroup[group.index] : ungrouped).push(index);
		maxSize = Math.max(maxSize, style.size);
		visibleYMin = Math.min(visibleYMin, point.y);
		const slot = slotIndexOf(grid, point.x);
		if (slot !== -1) {
			yMin[slot] = Math.min(yMin[slot], point.y);
			yMax[slot] = Math.max(yMax[slot], point.y);
		}
	}

	const yBaselines = options.baselines.filter(
		(baseline: ScatterBaseline) => baseline.axis === 'y' && isFiniteNumber(baseline.value)
	);
	const hasVisiblePoints = visibleYMin !== Number.POSITIVE_INFINITY;
	const fallback = edgeExtent(allYMin, allYMax, options.yRange, yBaselines);
	// An empty end slot takes the lowest Y of the nearest slot holding points.
	// Whenever an end slot and any point are in view, that nearest slot is in
	// view too — the visible range is contiguous — so the value changes no
	// autoscale, even with the chart zoomed into part of the axis.
	let leftmost = -1;
	let rightmost = -1;
	for (let slot = 0; slot < grid.count; slot++) {
		if (yMin[slot] <= yMax[slot]) {
			leftmost = leftmost === -1 ? slot : leftmost;
			rightmost = slot;
		}
	}
	const endExtent = (nearest: number): { min: number; max: number } =>
		nearest === -1 ? fallback : { min: yMin[nearest], max: yMin[nearest] };
	const slots: ScatterSlotItem[] = new Array<ScatterSlotItem>(grid.count);
	for (let slot = 0; slot < grid.count; slot++) {
		const time = slotValue(grid, slot);
		if (yMin[slot] <= yMax[slot]) {
			slots[slot] = { time, yMin: yMin[slot], yMax: yMax[slot] };
		} else if (slot === 0 || slot === grid.count - 1) {
			const edge = endExtent(slot === 0 ? leftmost : rightmost);
			slots[slot] = { time, yMin: edge.min, yMax: edge.max };
		} else {
			slots[slot] = { time };
		}
	}

	return {
		points,
		resolved,
		groups,
		// Points of no group first, then each group in order, each in data order.
		drawOrder: ungrouped.concat(...byGroup),
		groupMembers,
		idToIndex,
		duplicateIds,
		groupPointCounts,
		domain,
		grid,
		slots,
		maxSize,
		sizeScaling,
		hasVisiblePoints,
		yBaselines,
		xOutOfRange,
	};
}

/**
 * The vertical extent the first and the last slot carry when no point is
 * visible at all.
 *
 * The chart places a series by its values: with the last slot whitespace it
 * cannot scroll the end of the X axis to the right edge of the plot, and with
 * no value at all the price scale has no labels and the series draws nothing.
 * So both end slots always carry a value. With visible points it is the lowest
 * Y of the nearest slot holding points (inside their range already); with
 * none, the range of every point, then the pinned `yRange`, then the
 * horizontal baselines, then zero — what the price scale should show for a
 * plot with nothing drawn on it.
 */
function edgeExtent(
	allYMin: number,
	allYMax: number,
	yRange: ScatterRange,
	yBaselines: readonly ScatterBaseline[]
): { min: number; max: number } {
	if (allYMin <= allYMax) {
		return { min: allYMin, max: allYMax };
	}
	const pinnedMin = isFiniteNumber(yRange.min) ? yRange.min : null;
	const pinnedMax = isFiniteNumber(yRange.max) ? yRange.max : null;
	if (pinnedMin !== null || pinnedMax !== null) {
		const min = pinnedMin ?? (pinnedMax as number);
		const max = pinnedMax ?? min;
		return { min: Math.min(min, max), max: Math.max(min, max) };
	}
	if (yBaselines.length > 0) {
		const values = yBaselines.map((baseline: ScatterBaseline) => baseline.value);
		return { min: Math.min(...values), max: Math.max(...values) };
	}
	return { min: 0, max: 0 };
}

/** Whether two grids put the same slots at the same X values and weights. */
export function sameGrid(a: SlotGrid | null, b: SlotGrid | null): boolean {
	if (a === null || b === null) {
		return a === b;
	}
	return a.first === b.first &&
		a.count === b.count &&
		a.step.mantissa === b.step.mantissa &&
		a.step.exponent === b.step.exponent &&
		a.tickStep.mantissa === b.tickStep.mantissa &&
		a.tickStep.exponent === b.tickStep.exponent;
}

/** Whether two slot lists hold the same slots with the same extents. */
export function sameSlots(a: readonly ScatterSlotItem[], b: readonly ScatterSlotItem[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		const left = a[i] as Partial<ScatterSlotData>;
		const right = b[i] as Partial<ScatterSlotData>;
		if (left.time !== right.time || left.yMin !== right.yMin || left.yMax !== right.yMax) {
			return false;
		}
	}
	return true;
}
