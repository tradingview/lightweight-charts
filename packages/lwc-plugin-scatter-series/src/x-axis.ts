import type { ScatterRange } from './options';

/*
 The X axis of a scatter chart is the chart's horizontal scale, which in
 Lightweight Charts™ is a list of discrete points. A scatter series turns its
 numeric X domain into a dense, evenly spaced grid of such points — "slots" —
 and draws every point at its exact fractional position between them.

 Everything here is pure: the domain, the tick step, the slot grid, the label
 step for a width and the tick weights which decide the labels.

 Labels. The chart picks labels greedily by weight: heaviest first, then
 lighter ones wherever they still fit, `minDistance` pixels apart. With
 `timeScale.uniformDistribution`, a weight is either placed entirely or the
 picking stops. Labels are then evenly spaced only when the slots of each
 weight and above are exactly the multiples of one step: the weights must
 follow a chain of steps each dividing the next. A chain cannot hold both 2
 and 5 of the same decade, so no single chain labels every width well: 1-2-10
 has no 0.5 for a −0.4…0.8 axis too narrow for steps of 0.2, and 1-5-10 has no
 20 for a 0…90 axis too narrow for steps of 10.

 The chain is therefore built around the label step of the width at hand
 (`chooseXLabels`): the finest step of the form {1, 2, 5} × 10ⁿ whose labels,
 measured in the chart's font, fit side by side with a gap between them — the
 chart moves a label overflowing an end of the axis back inside at a fixed
 edge (on a movable axis, only while the labels are twice the slot spacing
 apart), and the measure accounts for it. At a free edge of a movable axis it
 centres the label on its slot: the series then keeps the end of the domain
 far enough in (`endLabelRoom`). Above that step the chain goes through 2 (S, 2S,
 10S …, coarser labels for a narrower chart), below it through 5 (finer ones
 for a chart the user zooms into). The minimum distance handed to the chart is
 chosen so that it stops exactly at the label step. Zero is the heaviest slot
 of all — but for an axis whose labels are too long for any nice step to fit
 two: then the two ends are labelled, weighed above zero, with a distance that
 leaves room for nothing in between.

 With the axis zoomed or scrolled by the user, the labels are chosen again for
 the part in view, as if it were a domain of its own: from the nice step of
 about ten intervals across the view, counting only the labels in view.

 Slot keys. A slot's X value is its index in the grid times the slot step,
 rounded to the decimals of the step, so a value is always the same number no
 matter how it was reached (0.1 * 3 is not 0.3). Weights are decided on the
 integer index, never on the float. Next to a large offset (epoch
 milliseconds) the slot step is kept coarse enough for the index to stay
 exact; X values beyond ±1e300 are not laid out at all.
 */

/** The number of tick intervals the automatic domain aims at. */
const TARGET_TICK_INTERVALS = 10;

/** The weight of the zero slot, above every other weight. */
export const ZERO_TICK_WEIGHT = 1000;

/** Slot counts above this are refused; the grid is coarsened instead. */
export const MAX_SLOT_COUNT = 2000;

/**
 * The largest magnitude of an X value the axis lays out. Beyond it the slot
 * arithmetic would overflow: points further out are not drawn, and an end of
 * `xRange` further out is brought back to it.
 */
export const MAX_X_MAGNITUDE = 1e300;

/** Whether an X value can be laid out on the axis: a finite number within {@link MAX_X_MAGNITUDE}. */
export function isDrawableX(x: number): boolean {
	return Number.isFinite(x) && Math.abs(x) <= MAX_X_MAGNITUDE;
}

/**
 * The finest slot step, relative to the magnitude of the X values: a slot
 * index is then below 2⁴⁴, so that every slot value is a distinct number and
 * its index is found back from it exactly, whatever the offset of the domain
 * (an axis of epoch milliseconds, say).
 */
const SLOT_PRECISION = 2 ** -44;

/** A step of the form mantissa × 10^exponent. */
export interface NiceStep {
	/** 1, 2 or 5. */
	mantissa: 1 | 2 | 5;
	/** Power of ten. */
	exponent: number;
}

/** The largest power of ten that is a number exactly. */
const EXACT_POWER_OF_TEN = 22;

/**
 * `multiple × 10^exponent`, the double nearest to the decimal: so that 0.1 is
 * 1 / 10, not 1 × 0.1, and a power of ten beyond 10²² is read as a decimal
 * rather than computed (`10 ** 298` is not `1e298`).
 */
function decimal(multiple: number, exponent: number): number {
	if (exponent > EXACT_POWER_OF_TEN || exponent < -EXACT_POWER_OF_TEN) {
		return Number(`${multiple}e${exponent}`);
	}
	return exponent >= 0 ? multiple * 10 ** exponent : multiple / 10 ** -exponent;
}

/** The value of a {@link NiceStep}, computed so that 0.1 is 1 / 10, not 1 × 0.1. */
export function stepValue(step: NiceStep): number {
	return decimal(step.mantissa, step.exponent);
}

/** Whether `a` is smaller than `b`, compared exactly on mantissa and exponent. */
function isSmaller(a: NiceStep, b: NiceStep): boolean {
	return a.exponent < b.exponent || (a.exponent === b.exponent && a.mantissa < b.mantissa);
}

/** The next larger nice step: 1 → 2 → 5 → 10. */
function nextStep(step: NiceStep): NiceStep {
	switch (step.mantissa) {
		case 1:
			return { mantissa: 2, exponent: step.exponent };
		case 2:
			return { mantissa: 5, exponent: step.exponent };
		default:
			return { mantissa: 1, exponent: step.exponent + 1 };
	}
}

/**
 * The smallest step of the form {1, 2, 5} × 10ⁿ which is not smaller than
 * `raw`. A step that is not a positive finite number gives 1.
 */
export function niceStep(raw: number): NiceStep {
	if (!(raw > 0) || !Number.isFinite(raw)) {
		return { mantissa: 1, exponent: 0 };
	}
	let exponent = Math.floor(Math.log10(raw));
	// log10 is not exact near powers of ten.
	if (stepValue({ mantissa: 1, exponent }) > raw) {
		exponent--;
	}
	let step: NiceStep = { mantissa: 1, exponent };
	// A relative tolerance, so that 0.30000000000000004 still picks 0.5 and
	// not the next decade, and 2.0000000001 still picks 2.
	while (stepValue(step) < raw * (1 - 1e-9)) {
		step = nextStep(step);
	}
	return step;
}

/** The number of decimals a multiple of `step` needs to be written exactly. */
export function stepDecimals(step: NiceStep): number {
	return Math.max(0, -step.exponent);
}

/** Rounds `value` to `decimals` decimals, turning a negative zero into zero. */
export function roundTo(value: number, decimals: number): number {
	const rounded = Number(value.toFixed(Math.min(100, decimals)));
	return rounded === 0 ? 0 : rounded;
}

/**
 * Formats an X value with `decimals` decimals, dropping trailing zeros:
 * `10` rather than `10.0`, `0.25` rather than `0.250`.
 */
export function formatXValue(value: number, decimals: number): string {
	let text = roundTo(value, decimals).toFixed(Math.min(100, decimals));
	if (text.indexOf('.') !== -1) {
		text = text.replace(/0+$/, '').replace(/\.$/, '');
	}
	return text === '-0' ? '0' : text;
}

/** The X domain of a series: the ends of the axis and the step of its ticks. */
export interface XDomain {
	/** Left end of the axis. */
	min: number;
	/** Right end of the axis. */
	max: number;
	/** The step the domain was rounded to, aiming at about ten intervals. */
	tickStep: NiceStep;
}

/** Widens a degenerate span around its value. */
function padding(value: number): number {
	return value === 0 ? 1 : Math.abs(value) * 0.1;
}

/** A given end of a range: `null` when it is not a finite number, else within {@link MAX_X_MAGNITUDE}. */
function finiteOrNull(value: number | null): number | null {
	return value !== null && Number.isFinite(value) ? Math.min(MAX_X_MAGNITUDE, Math.max(-MAX_X_MAGNITUDE, value)) : null;
}

/**
 * The X domain for data spanning `dataMin`…`dataMax` (both `null` when there
 * is no data; both within {@link MAX_X_MAGNITUDE}) and the user's `range`. An
 * open end of `range` is rounded outwards from the data to a multiple of a
 * nice tick step; a given end is used as it is (the slot grid snaps it to its
 * own step later).
 */
export function computeXDomain(
	dataMin: number | null,
	dataMax: number | null,
	range: ScatterRange
): XDomain {
	let fixedMin = finiteOrNull(range.min);
	let fixedMax = finiteOrNull(range.max);
	if (fixedMin !== null && fixedMax !== null) {
		if (fixedMin > fixedMax) {
			[fixedMin, fixedMax] = [fixedMax, fixedMin];
		}
		if (fixedMin === fixedMax) {
			// An empty range cannot be drawn: centre an automatic one on it.
			dataMin = fixedMin;
			dataMax = fixedMax;
			fixedMin = null;
			fixedMax = null;
		}
	}
	let lo: number;
	let hi: number;
	if (fixedMin !== null && fixedMax !== null) {
		lo = fixedMin;
		hi = fixedMax;
	} else if (fixedMin !== null) {
		lo = fixedMin;
		hi = dataMax !== null && dataMax > lo ? dataMax : lo + padding(lo) * 10;
	} else if (fixedMax !== null) {
		hi = fixedMax;
		lo = dataMin !== null && dataMin < hi ? dataMin : hi - padding(hi) * 10;
	} else if (dataMin !== null && dataMax !== null) {
		lo = Math.min(dataMin, dataMax);
		hi = Math.max(dataMin, dataMax);
		if (lo === hi) {
			const pad = padding(lo);
			lo -= pad;
			hi += pad;
		}
	} else {
		lo = 0;
		hi = 10;
	}
	// In halves, so that the span of the widest domain does not overflow.
	const tickStep = niceStep((hi / 2 - lo / 2) / (TARGET_TICK_INTERVALS / 2));
	const tick = stepValue(tickStep);
	const decimals = stepDecimals(tickStep);
	return {
		min: fixedMin ?? roundTo(Math.floor(lo / tick + 1e-9) * tick, decimals),
		max: fixedMax ?? roundTo(Math.ceil(hi / tick - 1e-9) * tick, decimals),
		tickStep,
	};
}

/**
 * The slot step for a tick step: a tenth of it, or a twentieth for a tick
 * step of 2·10ⁿ, so that the slot step is a step of the label chain.
 */
export function slotStepFor(tickStep: NiceStep): NiceStep {
	return {
		mantissa: tickStep.mantissa === 5 ? 5 : 1,
		exponent: tickStep.exponent - 1,
	};
}

/** The slot grid of an X domain. */
export interface SlotGrid {
	/** Step between neighbouring slots. */
	step: NiceStep;
	/** Index of the first slot: its X value is `first × step`. */
	first: number;
	/** Number of slots, the first and last ones included. */
	count: number;
	/** Decimals slot values are rounded to. */
	decimals: number;
	/** The tick step the domain was built around. */
	tickStep: NiceStep;
}

/**
 * The slots covering `domain`: multiples of the slot step from the one at or
 * below `domain.min` to the one at or above `domain.max`.
 *
 * The tick step, and with it the slot step, is made coarser while the grid
 * would take more than {@link MAX_SLOT_COUNT} slots, or while the slot step
 * is too fine for the magnitude of the values ({@link SLOT_PRECISION}): next
 * to a large offset, a step below the precision of the numbers would give
 * slots the same X value.
 */
export function buildSlotGrid(domain: XDomain): SlotGrid {
	let tickStep = domain.tickStep;
	let step = slotStepFor(tickStep);
	const finest = Math.max(Math.abs(domain.min), Math.abs(domain.max)) * SLOT_PRECISION;
	let first = 0;
	let count = 2;
	for (let attempt = 0; attempt < 2000; attempt++) {
		const value = stepValue(step);
		if (!Number.isFinite(value)) {
			// Unreachable within MAX_X_MAGNITUDE: a grid of two slots at least.
			break;
		}
		first = Math.floor(domain.min / value + 1e-9);
		const last = Math.ceil(domain.max / value - 1e-9);
		count = Math.max(2, last - first + 1);
		if (count <= MAX_SLOT_COUNT && value > finest) {
			break;
		}
		tickStep = nextStep(tickStep);
		step = slotStepFor(tickStep);
	}
	const grid = { step, first, count, decimals: stepDecimals(step), tickStep };
	// The ends of the domain inside the grid, whatever the rounding of the division.
	while (slotValue(grid, 0) > domain.min && grid.count < MAX_SLOT_COUNT + 2) {
		grid.first--;
		grid.count++;
	}
	while (slotValue(grid, grid.count - 1) < domain.max && grid.count < MAX_SLOT_COUNT + 2) {
		grid.count++;
	}
	return grid;
}

/** The X value of slot `index` (`0` is the first slot). */
export function slotValue(grid: SlotGrid, index: number): number {
	return roundTo(decimal((grid.first + index) * grid.step.mantissa, grid.step.exponent), grid.decimals);
}

/**
 * The slot nearest to `x`, or `-1` when `x` is outside the grid by more than
 * half a slot.
 */
export function slotIndexOf(grid: SlotGrid, x: number): number {
	const index = Math.round(x / stepValue(grid.step)) - grid.first;
	return index >= 0 && index < grid.count ? index : -1;
}

/**
 * The number of slots in `step`, or `0` when `step` is not a whole multiple
 * of the slot step of `grid`.
 */
export function stepRatio(grid: SlotGrid, step: NiceStep): number {
	const ratio = stepValue(step) / stepValue(grid.step);
	const whole = Math.round(ratio);
	return whole >= 1 && Math.abs(ratio - whole) <= 1e-6 * whole ? whole : 0;
}

/**
 * The steps labels may be placed at, finest first: every nice step from
 * `finest` — the tick step of the domain unless given, never below the slot
 * step — up to the first one at least as long as the whole axis. Labels are
 * never finer than the tick step, which is what the domain was rounded to
 * (about ten intervals): a wide chart labels its ticks, a narrow one thins
 * them out.
 */
export function labelStepCandidates(grid: SlotGrid, finest: NiceStep = grid.tickStep): NiceStep[] {
	const steps: NiceStep[] = [];
	const span = Math.max(1, grid.count - 1);
	for (let step: NiceStep = isSmaller(finest, grid.step) ? grid.step : finest; Number.isFinite(stepValue(step)); step = nextStep(step)) {
		const ratio = stepRatio(grid, step);
		if (ratio > 0) {
			steps.push(step);
		}
		if (stepValue(step) / stepValue(grid.step) >= span) {
			break;
		}
	}
	return steps;
}

/** One step of the label chain. */
export interface TickLevel {
	/** The step, in slots. */
	ratio: number;
	/** Weight of the slots whose largest step is this one. */
	weight: number;
}

/**
 * The chain of label steps around `labelStep`, finest (the slot step) first,
 * each a whole multiple of the one before: through 5 below `labelStep` and
 * through 2 above it, up to twice the length of the axis.
 */
export function tickLevels(grid: SlotGrid, labelStep: NiceStep): TickLevel[] {
	const levels: TickLevel[] = [];
	const span = Math.max(1, grid.count - 1);
	// Steps beyond the largest number end the chain too.
	for (let step: NiceStep = grid.step; Number.isFinite(stepValue(step)); step = nextStep(step)) {
		const ratio = stepRatio(grid, step);
		const below = isSmaller(step, labelStep);
		const above = isSmaller(labelStep, step);
		const allowed = (below && step.mantissa !== 2) || (above && step.mantissa !== 5) || (!below && !above);
		if (ratio > 0 && allowed) {
			levels.push({ ratio, weight: levels.length + 1 });
		}
		if (above && ratio >= 2 * span) {
			break;
		}
	}
	return levels;
}

/** Where the slots of a grid are drawn, in CSS pixels. */
export interface XAxisGeometry {
	/** Distance between neighbouring slots. */
	spacing: number;
	/** Coordinate of the first slot. */
	origin: number;
	/** Width of the axis: labels are kept within `0`…`width`. */
	width: number;
	/**
	 * Whether the user zoomed or scrolled the axis, so that the grid may reach
	 * past either end of it. Then only the labels in view count, the labels may
	 * be finer than the tick step of the domain (about ten intervals across the
	 * view), the chart moves only the first and last labels of the grid back
	 * inside the axis (the others are cut off at its edges), and the ends of
	 * the grid are never labelled on their own.
	 */
	zoomed?: boolean;
	/**
	 * At which ends of the axis the chart moves an overflowing end label of
	 * the grid back inside: at a fixed edge (`fixLeftEdge` / `fixRightEdge`),
	 * and at both while the user can move neither. At a free edge it centres
	 * the label on its slot, cut off by the edge. Both by default.
	 */
	movedInside?: { left: boolean; right: boolean };
	/**
	 * Whether the user can scroll or zoom the axis. The chart then moves an end
	 * label back inside only while the labels are at least twice the slot
	 * spacing apart: the distance is kept that far whenever it has to.
	 */
	movable?: boolean;
}

/** How far apart X labels must be. */
export interface XLabelSpacing {
	/** Least room between two labels, CSS pixels. */
	gap: number;
	/** Least distance between the centres of two labels, CSS pixels. */
	minPitch: number;
}

/** What the chart needs to label the X axis at one width. */
export interface XAxisLabels {
	/** The step the labels are placed at. */
	step: NiceStep;
	/** The label chain around `step`, finest first. */
	levels: readonly TickLevel[];
	/**
	 * The distance the chart must keep between labels, in CSS pixels, so that
	 * it places the labels of `step` and of the coarser steps, and none finer.
	 */
	minDistance: number;
	/**
	 * Whether the two ends of the axis are labelled, and nothing else: no nice
	 * step fits two labels, but the ends do. They are weighed above every
	 * other slot, and `minDistance` leaves room for no third label.
	 */
	ends: boolean;
}

/** Share of the axis the chart must keep between labels when only the ends are labelled. */
const ENDS_DISTANCE = 0.75;

/** Relative room kept between a label step's spacing and the distance it needs, against rounding. */
const FIT_MARGIN = 1e-3;

/**
 * Relative room kept above twice the slot spacing, the least label distance
 * at which the chart of a movable axis moves an end label back inside: wide
 * enough for the frames of a resize the series has not laid the axis out for
 * yet (the chart rescales the spacing at once).
 */
const ALIGN_MARGIN = 0.05;

const BOTH_ENDS: { left: boolean; right: boolean } = { left: true, right: true };

/** The labels of one step: how many there are and how far apart they must be. */
interface LabelFit {
	/** Number of labels within the axis. */
	count: number;
	/** The least distance between neighbouring labels, CSS pixels; `0` for fewer than two. */
	distance: number;
}

/**
 * The least label distance at which the chart moves an overflowing end label
 * back inside the axis: the label must be within `round(distance / spacing)`
 * slots of its end of the grid, `slotsFromEnd` away — and, on an axis the
 * user can move, the distance at least twice the spacing.
 */
function alignmentDistance(slotsFromEnd: number, spacing: number, movable: boolean): number {
	const window = slotsFromEnd * spacing;
	return movable ? Math.max(window, 2 * spacing * (1 + ALIGN_MARGIN)) : window;
}

/**
 * How far apart the labels of a step `ratio` slots long must be so that none
 * comes closer than `gap` pixels to the next and their centres are at least
 * `minPitch` apart, or `null` when that is more than `limit`.
 *
 * A label is centred on its slot, except that the chart moves one which
 * overflows an end of the axis back inside it at an end where it does so
 * ({@link XAxisGeometry.movedInside}) — on a zoomed axis, only the first and
 * the last label of the grid, the others being cut off at the edge — provided
 * the labels are far enough apart ({@link alignmentDistance}), which is then
 * part of what they need. A label out of view on a zoomed axis is not drawn,
 * and does not count, unless the chart moves it into view.
 */
function fitLabels(
	grid: SlotGrid,
	ratio: number,
	geometry: XAxisGeometry,
	labelWidth: (slot: number) => number,
	{ gap, minPitch }: XLabelSpacing,
	limit: number
): LabelFit | null {
	const { spacing, origin, width, zoomed = false, movedInside = BOTH_ENDS, movable = false } = geometry;
	const distance = ratio * spacing;
	const last = grid.count - 1;
	let required = 0;
	let count = 0;
	let previousRight = 0;
	for (let slot = (((-grid.first) % ratio) + ratio) % ratio; slot < grid.count; slot += ratio) {
		const centre = origin + slot * spacing;
		const atLeft = (!zoomed || slot < ratio) && movedInside.left;
		const atRight = (!zoomed || slot > last - ratio) && movedInside.right;
		// The chart draws the slots in view, and half a slot beyond.
		if (zoomed && (centre < -spacing / 2 - 1 || centre > width + spacing / 2)) {
			continue;
		}
		const labelSize = labelWidth(slot);
		let left = centre - labelSize / 2;
		if (left < 0 && atLeft) {
			left = 0;
			required = Math.max(required, alignmentDistance(slot, spacing, movable));
		} else if (left + labelSize > width && atRight) {
			left = width - labelSize;
			required = Math.max(required, alignmentDistance(last - slot, spacing, movable));
		} else if (zoomed && (centre < 0 || centre > width)) {
			// Out of view, and not moved into it.
			continue;
		}
		if (count > 0) {
			required = Math.max(required, minPitch, distance - (left - previousRight) + gap);
		}
		if (required > limit) {
			return null;
		}
		previousRight = left + labelSize;
		count++;
	}
	return { count, distance: required };
}

/** Whether the labels of the two ends of the axis fit side by side. */
function endsFit(
	grid: SlotGrid,
	geometry: XAxisGeometry,
	labelWidth: (slot: number) => number,
	{ gap, minPitch }: XLabelSpacing
): boolean {
	const { spacing, origin, width, movedInside = BOTH_ENDS } = geometry;
	const last = grid.count - 1;
	if (last < 1 || last * spacing < minPitch) {
		return false;
	}
	const firstSize = labelWidth(0);
	const lastSize = labelWidth(last);
	// An end label is moved back inside the axis when it overflows it, at an
	// end where the chart does so.
	const firstLeft = origin - firstSize / 2;
	const firstRight = (movedInside.left ? Math.max(0, firstLeft) : firstLeft) + firstSize;
	const lastLeft = origin + last * spacing - lastSize / 2;
	return (movedInside.right ? Math.min(lastLeft, width - lastSize) : lastLeft) - firstRight >= gap;
}

/**
 * The labels of the X axis at one width: the finest nice step, from the tick
 * step of the domain up, whose labels fit side by side — at least `gap`
 * pixels between them and `minPitch` pixels between their centres — its
 * label chain, and the distance the chart must keep between labels to stop at
 * it. When no step with two labels or more fits, the two ends of the axis if
 * they fit side by side (they are where the design puts the first and last
 * ticks), else the finest step with a single label.
 *
 * On a zoomed axis (see {@link XAxisGeometry.zoomed}) the steps start from
 * the nice step of about ten intervals across the view, and only the labels
 * in view count.
 *
 * @param grid - The slot grid.
 * @param geometry - Where the slots are drawn.
 * @param labelWidth - Width in CSS pixels of the label of a slot, by index in the grid.
 * @param spacing - How far apart labels must be.
 */
export function chooseXLabels(
	grid: SlotGrid,
	geometry: XAxisGeometry,
	labelWidth: (slot: number) => number,
	spacing: XLabelSpacing
): XAxisLabels {
	const zoomed = geometry.zoomed === true;
	// Zoomed in, finer than the tick step: about ten intervals across the view.
	const viewStep = niceStep(((geometry.width / geometry.spacing) * stepValue(grid.step)) / TARGET_TICK_INTERVALS);
	const candidates = labelStepCandidates(grid, zoomed && isSmaller(viewStep, grid.tickStep) ? viewStep : grid.tickStep);
	let step: NiceStep | null = null;
	let required = 0;
	let labelCount = 0;
	for (const candidate of candidates) {
		const ratio = stepRatio(grid, candidate);
		const fit = fitLabels(grid, ratio, geometry, labelWidth, spacing, ratio * geometry.spacing * (1 - FIT_MARGIN));
		// A step with no label on the axis is passed over: a coarser one may have one.
		if (fit !== null && fit.count > 0) {
			step = candidate;
			required = fit.distance;
			labelCount = fit.count;
			break;
		}
	}
	if (step === null) {
		step = candidates[candidates.length - 1];
	}
	const levels = tickLevels(grid, step);
	if (!zoomed && labelCount < 2 && endsFit(grid, geometry, labelWidth, spacing)) {
		// Far enough apart for the chart to move both labels inside, too.
		const minDistance = Math.max(
			ENDS_DISTANCE * (grid.count - 1) * geometry.spacing,
			Math.min(alignmentDistance(0, geometry.spacing, geometry.movable === true), (grid.count - 1) * geometry.spacing)
		);
		return { step, levels, minDistance, ends: true };
	}
	const ratio = stepRatio(grid, step);
	let finer = 0;
	for (const level of levels) {
		if (level.ratio < ratio) {
			finer = level.ratio;
		}
	}
	return {
		step,
		levels,
		// Above the spacing of the next finer step, so the chart does not place it.
		minDistance: Math.max(required, finer * geometry.spacing * (1 + FIT_MARGIN)),
		ends: false,
	};
}

/**
 * The room each end of a fitted axis needs for its outermost label, centred
 * on its slot (as the chart draws it at a free edge): how far from the edge
 * of the plot the end of the domain must be for the label to stay inside,
 * with a pixel to spare. `0` for an end whose outermost label is far enough
 * in already.
 *
 * @param grid - The slot grid.
 * @param labels - The labels of the axis.
 * @param spacing - Distance between neighbouring slots, CSS pixels.
 * @param labelWidth - Width in CSS pixels of the label of a slot, by index in the grid.
 */
export function endLabelRoom(
	grid: SlotGrid,
	labels: Pick<XAxisLabels, 'step' | 'ends'>,
	spacing: number,
	labelWidth: (slot: number) => number
): { left: number; right: number } {
	const last = grid.count - 1;
	const ratio = labels.ends ? last : stepRatio(grid, labels.step);
	if (ratio < 1) {
		return { left: 0, right: 0 };
	}
	// The labelled slots are the multiples of the step (both ends, with `ends`).
	const first = labels.ends ? 0 : (((-grid.first) % ratio) + ratio) % ratio;
	const final = labels.ends ? last : last - ((((grid.first + last) % ratio) + ratio) % ratio);
	const room = (slot: number, slotsIn: number): number => Math.max(0, labelWidth(slot) / 2 + 1 - slotsIn * spacing);
	return {
		left: first <= last ? room(first, first) : 0,
		right: final >= 0 ? room(final, last - final) : 0,
	};
}

/**
 * The tick weight of the X value `x`: the weight of the largest step of
 * `levels` that `x` is a multiple of, {@link ZERO_TICK_WEIGHT} for zero, and
 * `0` for a value which is not on the grid at all. With `ends`, the two ends
 * of the grid are heavier still.
 */
export function tickWeight(grid: SlotGrid, levels: readonly TickLevel[], x: number, ends: boolean = false): number {
	const ratio = x / stepValue(grid.step);
	const slot = Math.round(ratio);
	// Relative to the index for a domain far from zero, whose slot values carry
	// the rounding of their magnitude (see SLOT_PRECISION).
	if (Math.abs(ratio - slot) > Math.max(1e-6, Math.abs(ratio) * 2 ** -46)) {
		return 0;
	}
	if (ends && (slot === grid.first || slot === grid.first + grid.count - 1)) {
		return ZERO_TICK_WEIGHT + 1;
	}
	if (slot === 0) {
		return ZERO_TICK_WEIGHT;
	}
	for (let i = levels.length - 1; i >= 0; i--) {
		if (slot % levels[i].ratio === 0) {
			return levels[i].weight;
		}
	}
	return 0;
}

/** Weight of a nice step in {@link fallbackTickWeight}: 10ⁿ < 2·10ⁿ < 10ⁿ⁺¹. */
function fallbackStepWeight(step: NiceStep): number {
	return Math.max(1, 100 + 3 * step.exponent + (step.mantissa === 1 ? 0 : 1));
}

/**
 * The tick weight of `x` when no slot grid is known (a chart whose series is
 * not a scatter series): the 1-2-10 chain over all decades.
 */
export function fallbackTickWeight(x: number): number {
	if (x === 0) {
		return ZERO_TICK_WEIGHT;
	}
	for (let exponent = 15; exponent >= -15; exponent--) {
		for (const mantissa of [2, 1] as const) {
			const step: NiceStep = { mantissa, exponent };
			const ratio = x / stepValue(step);
			const whole = Math.round(ratio);
			if (whole !== 0 && Math.abs(ratio - whole) <= 1e-9 * Math.max(1, Math.abs(ratio))) {
				return fallbackStepWeight(step);
			}
		}
	}
	return 0;
}

/** Whether two label chains weigh every slot the same. */
export function sameLevels(a: readonly TickLevel[], b: readonly TickLevel[]): boolean {
	return a.length === b.length && a.every((level: TickLevel, i: number) => level.ratio === b[i].ratio && level.weight === b[i].weight);
}
