import type { ScatterRange } from './options';

/*
 The X axis of a scatter chart is the chart's time scale: a list of discrete
 points. A scatter series turns its numeric X domain into a dense, evenly
 spaced grid of them — "slots" — and draws every point at its exact position
 between them. Everything here is pure.

 Labels. The chart places labels greedily by weight, heaviest first, at least
 `minDistance` pixels apart; with `timeScale.uniformDistribution` it places a
 weight entirely or stops. Labels are thus evenly spaced only when the slots
 of each weight and above are the multiples of one step: the weights follow a
 chain of steps, each dividing the next. No single chain labels every width
 (1-2-10 has no 0.5 for −0.4…0.8, 1-5-10 no 20 for 0…90), so the chain is
 built around the label step of the width at hand (`chooseXLabels`): the
 finest {1, 2, 5} × 10ⁿ step whose labels, measured in the chart's font, fit
 side by side. Above it the chain goes through 2, below it through 5, and the
 distance handed to the chart stops it exactly at that step. The chart moves
 an end label back inside the plot only at a fixed edge, and on a movable
 axis only while the labels are twice the spacing apart: at a free edge the
 series keeps the end of the domain far enough in (`endLabelRoom`). Zero is
 the heaviest slot; when no nice step fits two labels, the two ends are
 labelled instead. On a zoomed axis the labels are chosen for the part in
 view, from about ten intervals across it.

 Slots. A slot's X value is its index times the slot step, rounded to the
 step's decimals, so that it is always the same number (0.1 * 3 is not 0.3);
 weights are decided on the integer index. Next to a large offset (epoch
 milliseconds) the step is kept coarse enough for the index to stay exact. X
 values beyond ±1e300 are not laid out, and a span below about 1e-98 is
 widened: `toFixed` takes at most 100 decimals.
 */

/** The number of tick intervals the automatic domain aims at. */
const TARGET_TICK_INTERVALS = 10;

/** The most decimals `Number.prototype.toFixed` takes. */
const MAX_DECIMALS = 100;

/** Float noise tolerated in a value divided by a step, in steps or relative to the quotient. */
const FLOAT_NOISE = 1e-9;

/** Coarsenings of the tick step `buildSlotGrid` tries: more than the decades of the numbers. */
const MAX_COARSENINGS = 2000;

/** The decades, either side of 10⁰, that {@link fallbackTickWeight} labels. */
const FALLBACK_DECADES = 15;

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
 * The finest slot step with decimals, relative to the magnitude of the X
 * values: a slot index stays below 2⁴⁹, so that slot values are distinct and
 * an index is found back from its value (off by a fifth of a slot at most).
 */
const SLOT_PRECISION = 2 ** -49;

/** Integers below it are numbers exactly: a whole slot step needs no coarsening below it. */
const EXACT_INTEGERS = 2 ** 53;

/** The finest step of a tick, `10^MIN_TICK_EXPONENT`: its slots then need at most {@link MAX_DECIMALS}. */
const MIN_TICK_EXPONENT = -99;

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
 * The smallest step of the form 1, 2 or 5 × 10ⁿ which is not smaller than
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
	while (stepValue(step) < raw * (1 - FLOAT_NOISE)) {
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
	const rounded = Number(value.toFixed(Math.min(MAX_DECIMALS, decimals)));
	return rounded === 0 ? 0 : rounded;
}

/**
 * Formats an X value with `decimals` decimals, dropping trailing zeros:
 * `10` rather than `10.0`, `0.25` rather than `0.250`.
 */
export function formatXValue(value: number, decimals: number): string {
	let text = roundTo(value, decimals).toFixed(Math.min(MAX_DECIMALS, decimals));
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
	/** Whether the span was too narrow for the axis (below about 1e-98) and the domain was widened. */
	widened?: boolean;
	/**
	 * The X values the domain holds: its ends, and beyond an automatic end the
	 * data it was rounded from (rounding tolerates float noise, so 0.1 + 0.2
	 * ends a domain at 0.3). A given end holds nothing beyond it.
	 */
	holds: { min: number; max: number };
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
 * The span the domain is rounded from: the given ends, an open end taken from
 * the data (beyond the given one, else ten paddings from it), and a single
 * value padded on both sides; `0`…`10` without data.
 */
function spanToRound(given: ScatterRange, dataMin: number | null, dataMax: number | null): { lo: number; hi: number } {
	const { min, max } = given;
	if (min !== null && max !== null) {
		return { lo: min, hi: max };
	}
	if (min !== null) {
		return { lo: min, hi: dataMax !== null && dataMax > min ? dataMax : min + padding(min) * 10 };
	}
	if (max !== null) {
		return { lo: dataMin !== null && dataMin < max ? dataMin : max - padding(max) * 10, hi: max };
	}
	if (dataMin === null || dataMax === null) {
		return { lo: 0, hi: 10 };
	}
	const lo = Math.min(dataMin, dataMax);
	const hi = Math.max(dataMin, dataMax);
	if (lo !== hi) {
		return { lo, hi };
	}
	const pad = padding(lo);
	return { lo: lo - pad, hi: hi + pad };
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
	const { lo, hi } = spanToRound({ min: fixedMin, max: fixedMax }, dataMin, dataMax);
	// In halves, so that the span of the widest domain does not overflow.
	let tickStep = niceStep((hi / 2 - lo / 2) / (TARGET_TICK_INTERVALS / 2));
	const widened = tickStep.exponent < MIN_TICK_EXPONENT;
	if (widened) {
		tickStep = { mantissa: 1, exponent: MIN_TICK_EXPONENT };
	}
	const tick = stepValue(tickStep);
	const decimals = stepDecimals(tickStep);
	const min = fixedMin ?? roundTo(Math.floor(lo / tick + FLOAT_NOISE) * tick, decimals);
	let max = fixedMax ?? roundTo(Math.ceil(hi / tick - FLOAT_NOISE) * tick, decimals);
	if (!(max > min)) {
		// A span narrower than the finest tick: one tick wide.
		max = roundTo(min + tick, decimals);
	}
	const holds = { min: fixedMin ?? Math.min(min, lo), max: fixedMax ?? Math.max(max, hi) };
	return widened ? { min, max, tickStep, widened, holds } : { min, max, tickStep, holds };
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
 * below `domain.min` to the one at or above `domain.max`. The step is made
 * coarser while the grid would take more than {@link MAX_SLOT_COUNT} slots,
 * or while it is too fine for the magnitude of the values (two slots with the
 * same X value): a whole step is fine below 2⁵³, a step with decimals must
 * keep the slot indices below 2⁴⁹ ({@link SLOT_PRECISION}).
 */
export function buildSlotGrid(domain: Pick<XDomain, 'min' | 'max' | 'tickStep'>): SlotGrid {
	let tickStep = domain.tickStep;
	let step = slotStepFor(tickStep);
	const magnitude = Math.max(Math.abs(domain.min), Math.abs(domain.max));
	let first = 0;
	let count = 2;
	for (let attempt = 0; attempt < MAX_COARSENINGS; attempt++) {
		const value = stepValue(step);
		if (!Number.isFinite(value)) {
			// Unreachable within MAX_X_MAGNITUDE: a grid of two slots at least.
			break;
		}
		first = Math.floor(domain.min / value + FLOAT_NOISE);
		const last = Math.ceil(domain.max / value - FLOAT_NOISE);
		count = Math.max(2, last - first + 1);
		const precise = (step.exponent >= 0 && magnitude + value < EXACT_INTEGERS) || value > magnitude * SLOT_PRECISION;
		if (count <= MAX_SLOT_COUNT && precise) {
			break;
		}
		tickStep = nextStep(tickStep);
		step = slotStepFor(tickStep);
	}
	const grid = { step, first, count, decimals: stepDecimals(step), tickStep };
	fitGridToDomain(grid, domain);
	return grid;
}

/**
 * Moves the ends of `grid` so that it holds the domain, and no slot more,
 * whatever the rounding of the division next to a large offset.
 */
function fitGridToDomain(grid: SlotGrid, domain: Pick<XDomain, 'min' | 'max'>): void {
	while (slotValue(grid, 0) > domain.min && grid.count < MAX_SLOT_COUNT + 2) {
		grid.first--;
		grid.count++;
	}
	while (grid.count > 2 && slotValue(grid, 1) <= domain.min) {
		grid.first++;
		grid.count--;
	}
	while (slotValue(grid, grid.count - 1) < domain.max && grid.count < MAX_SLOT_COUNT + 2) {
		grid.count++;
	}
	while (grid.count > 2 && slotValue(grid, grid.count - 2) >= domain.max) {
		grid.count--;
	}
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
 * `finest` (the tick step of the domain unless given, never below the slot
 * step) up to the first one at least as long as the whole axis.
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
	 * past its ends. Only the labels in view count then, they may be finer
	 * than the tick step, only the first and last labels of the grid are moved
	 * inside, and the ends are never labelled on their own.
	 */
	zoomed?: boolean;
	/**
	 * At which ends the chart moves an overflowing end label of the grid back
	 * inside: at a fixed edge, and at both while the user can move neither.
	 * At a free edge it centres the label on its slot. Both by default.
	 */
	movedInside?: { left: boolean; right: boolean };
	/**
	 * Whether the user can scroll or zoom the axis: the chart then moves an end
	 * label inside only while the labels are twice the slot spacing apart.
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
	 * The largest distance which draws the same labels as `minDistance`: the
	 * chart still places the labels of `step`, and moves no label inside the
	 * axis that `minDistance` leaves centred. A distance already given to the
	 * chart within `minDistance`…`maxDistance` can be kept.
	 */
	maxDistance: number;
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
 * Relative room kept above twice the slot spacing (see {@link alignmentDistance}):
 * enough for the frames of a resize not laid out yet, as the chart rescales the
 * spacing at once.
 */
const ALIGN_MARGIN = 0.05;

const BOTH_ENDS: { left: boolean; right: boolean } = { left: true, right: true };

/** The labels of one step: how many there are and how far apart they must be. */
interface LabelFit {
	/** Number of labels within the axis. */
	count: number;
	/** The least distance between neighbouring labels, CSS pixels; `0` for fewer than two. */
	distance: number;
	/** The most distance at which the chart leaves centred the labels counted as centred, CSS pixels. */
	most: number;
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
 * A label is centred on its slot, unless the chart moves it back inside an
 * end it overflows ({@link XAxisGeometry.movedInside}), which takes the
 * labels far enough apart ({@link alignmentDistance}). On a zoomed axis a
 * label out of view does not count unless it is moved into view; and as the
 * chart moves any overflowing label within `round(distance / spacing)` slots
 * of an end — the second label too, onto its neighbour — `most` keeps the
 * distance below the slot of one left centred.
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
	let most = limit;
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
		} else if (zoomed) {
			// Overflowing, and left centred: the distance stays short of its slot.
			if (left < 0 && movedInside.left) {
				most = Math.min(most, (slot - 0.5) * spacing * (1 - FIT_MARGIN));
			} else if (left + labelSize > width && movedInside.right) {
				most = Math.min(most, (last - slot - 0.5) * spacing * (1 - FIT_MARGIN));
			}
			if (centre < 0 || centre > width) {
				// Out of view, and not moved into it.
				continue;
			}
		}
		if (count > 0) {
			required = Math.max(required, minPitch, distance - (left - previousRight) + gap);
		}
		if (required > most) {
			return null;
		}
		previousRight = left + labelSize;
		count++;
	}
	return required > most ? null : { count, distance: required, most };
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
 * step of the domain up (on a zoomed axis, from about ten intervals across the
 * view), whose labels fit side by side, its label chain, and the distance the
 * chart must keep between labels to stop at it. When no step with two labels
 * fits, the two ends of the axis if they fit side by side, else the finest
 * step with a single label.
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
	let most = Number.POSITIVE_INFINITY;
	let labelCount = 0;
	for (const candidate of candidates) {
		const ratio = stepRatio(grid, candidate);
		const fit = fitLabels(grid, ratio, geometry, labelWidth, spacing, ratio * geometry.spacing * (1 - FIT_MARGIN));
		// A step with no label on the axis is passed over: a coarser one may have one.
		if (fit !== null && fit.count > 0) {
			step = candidate;
			required = fit.distance;
			most = fit.most;
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
		const length = (grid.count - 1) * geometry.spacing;
		const minDistance = Math.max(
			ENDS_DISTANCE * length,
			Math.min(alignmentDistance(0, geometry.spacing, geometry.movable === true), length)
		);
		return { step, levels, minDistance, maxDistance: Math.max(minDistance, length * (1 - FIT_MARGIN)), ends: true };
	}
	const ratio = stepRatio(grid, step);
	let finer = 0;
	for (const level of levels) {
		if (level.ratio < ratio) {
			finer = level.ratio;
		}
	}
	// Above the spacing of the next finer step, so the chart does not place it.
	const minDistance = Math.max(required, finer * geometry.spacing * (1 + FIT_MARGIN));
	return {
		step,
		levels,
		minDistance,
		// Within the spacing of the step, so the chart places it.
		maxDistance: Math.max(minDistance, Math.min(most, ratio * geometry.spacing * (1 - FIT_MARGIN))),
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
	// the rounding of their magnitude: below a fifth of a slot for an index
	// below 2⁴⁹ (see SLOT_PRECISION).
	if (Math.abs(ratio - slot) > Math.min(0.25, Math.max(1e-6, Math.abs(ratio) * 2 ** -50))) {
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

/** Weight of a nice step in {@link fallbackTickWeight}: 2·10ⁿ weighs more than 10ⁿ, and less than 10ⁿ⁺¹. */
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
	for (let exponent = FALLBACK_DECADES; exponent >= -FALLBACK_DECADES; exponent--) {
		for (const mantissa of [2, 1] as const) {
			const step: NiceStep = { mantissa, exponent };
			const ratio = x / stepValue(step);
			const whole = Math.round(ratio);
			if (whole !== 0 && Math.abs(ratio - whole) <= FLOAT_NOISE * Math.max(1, Math.abs(ratio))) {
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
