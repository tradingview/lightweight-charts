import type { IChartApiBase, Logical, LogicalRange, WhitespaceData } from 'lightweight-charts';
import { canUserMoveTimeScale } from '@tradingview/lwc-toolkit/chart/interaction-flags';
import {
	tickMarkCharactersForWidth,
	tickMarkPixelsPerCharacter,
	timeAxisLabelFont,
} from '@tradingview/lwc-toolkit/chart/time-axis-labels';
import type { CoalescedTask, createCoalescedTask } from '@tradingview/lwc-toolkit/scheduling/coalesced-task';
import { TextWidthCache, createTextWidthCache } from '@tradingview/lwc-toolkit/text/measure';

import type { ScatterSlotData } from './data';
import type { XMapping } from './geometry';
import { ScatterHorzScaleBehavior, formatScatterX, setScatterXAxis } from './horz-scale-behavior';
import { ScatterModel, ScatterSlotItem, sameGrid, sameSlots } from './model';
import type { ScatterOnlyOptions } from './options';
import {
	SlotGrid,
	TickLevel,
	XAxisLabels,
	XLabelSpacing,
	chooseXLabels,
	endLabelRoom,
	sameLevels,
	slotValue,
	stepValue,
	tickLevels,
} from './x-axis';

/*
 Lays the X axis of a scatter series out on the chart's time scale, and fits
 the X domain to the plot. The library rules it follows (in
 `src/model/time-scale.ts` unless noted):

 - Coordinates. Logical index i is drawn at `width − (right − i + 0.5) ×
   spacing − 1` for a visible range ending at `right` (`indexToCoordinate`),
   and `setVisibleLogicalRange` sets the spacing to `width / (to − from + 1)`
   (`setVisibleRange`). A range set through the API is applied on the chart's
   next frame; the user's scrolling and zooming at once.
 - Labels. The chart keeps `tickMarkMaxCharacterLength` characters of
   `(fontSize + 4) × 5 / 8` pixels between labels (`marks()`). It moves an end
   label of the data back inside the plot only at a fixed edge
   (`fixLeftEdge` / `fixRightEdge`, or both while the user can move neither)
   and, while the user can move the axis, only while the spacing is at most
   half that distance; elsewhere it centres the label on its slot. Applying
   the option is a full update of the chart.
 - Weights. The chart weighs the time points from the first one that changed
   (`fillWeightsForPoints`, from `src/model/data-layer.ts`), and keeps the
   weights of the leading ones that stay.
 - Zoom. At two fixed edges the least spacing is `width / count`
   (`_minBarSpacing`), else `minBarSpacing`. A double-click on the axis resets
   the spacing to `barSpacing` and the scroll position to `rightOffset`
   (`restoreDefault`): the series fits the domain instead.
 - Size. The width changes in the middle of a paint when the price scale grows
   or shrinks; a range set then is merged into that paint's invalidation and
   loses to the range it already applied (verified on 5.2), so the series lays
   the axis out once the paint is over.

 Range events fired while the series itself changes the chart's slots and
 range (`#layingOut`) are not the user's.
 */

/** Least room between two X labels, in multiples of the font size. */
const LABEL_GAP_EM = 0.5;

/**
 * Least distance between the centres of two X labels, in multiples of the
 * font size: 36 px at the default 12 px, which thins the labels of a 300 px
 * chart out the way the design does (0, 20, 40 … rather than every 10).
 */
const LABEL_PITCH_EM = 3;

/** Width of a character when the labels cannot be measured, in multiples of the font size. */
const FALLBACK_CHARACTER_EM = 0.62;

/** Two visible ranges this close, in slots, are the same: the chart does not return a range exactly as it was set. */
const RANGE_TOLERANCE = 1e-3;

/** Relative tolerance of comparisons of pixel distances and spacings, against rounding. */
const RELATIVE_TOLERANCE = 1e-9;

/** The most of the plot width `xMargins` takes. */
const MAX_MARGIN_SHARE = 1 / 4;

/** Rounds of widening the margins for the end labels, which may change the labels in turn. */
const END_ROOM_PASSES = 3;

/** Room between the ends of the X domain and the edges of the plot, CSS pixels. */
interface Margins {
	left: number;
	right: number;
}

/**
 * How the chart treats the ends of the X axis: whether the user can move it,
 * and which edges are then free — not fixed by the host, or freed for
 * `xMargins`. While the user can move neither, the chart treats both edges as
 * fixed.
 */
interface EdgeState {
	movable: boolean;
	freeLeft: boolean;
	freeRight: boolean;
}

/** The chart's fixed edges. */
interface HostEdges {
	fixLeftEdge: boolean;
	fixRightEdge: boolean;
}

/** The X domain fitted to the plot. */
interface FitLayout {
	/** Distance between neighbouring slots, CSS pixels. */
	spacing: number;
	/** Room between each end of the domain and the edge of the plot. */
	margins: Margins;
	/** The labels of the fitted axis; `null` before the chart knows its width. */
	labels: XAxisLabels | null;
}

/** What a change of the series may have given the chart, to undo should it throw (see {@link XAxisController.restore}). */
export interface XAxisSnapshot {
	/** How many layouts had changed the chart. */
	readonly writes: number;
	/** The fitted range. */
	readonly fittedRange: LogicalRange | null;
	/** The range the user scrolled or zoomed to, or `null` when the view follows the fit. */
	readonly userRange: LogicalRange | null;
}

/** What the X axis controller reads from its series. */
export interface XAxisHost {
	/** The underlying series, which holds the slots. */
	series(): { setData(data: (ScatterSlotData | WhitespaceData<number>)[]): void };
	/** The current model. */
	model(): ScatterModel;
	/** The scatter options, for `xFormatter` and `xMargins`. */
	options(): Readonly<ScatterOnlyOptions>;
	/** Whether the series still acts on its chart (a detached one is released after the current call). */
	acts(): boolean;
}

/** Whether the chart knows the width of its plot: it reports 1 px or less before it is laid out. */
function hasWidth(width: number): boolean {
	return width > 1;
}

function sameRange(a: LogicalRange, b: LogicalRange): boolean {
	return Math.abs(a.from - b.from) < RANGE_TOLERANCE && Math.abs(a.to - b.to) < RANGE_TOLERANCE;
}

/** Whether a `tickMarkMaxCharacterLength` of `characters` draws `labels`: within their `minDistance`…`maxDistance`. */
function drawsLabels(characters: number, labels: XAxisLabels, fontSize: number): boolean {
	const distance = characters * tickMarkPixelsPerCharacter(fontSize);
	return distance >= labels.minDistance * (1 - RELATIVE_TOLERANCE) && distance <= labels.maxDistance * (1 + RELATIVE_TOLERANCE);
}

/** The `tickMarkMaxCharacterLength` for `labels`: the middle of their span, so that it stays through most steps of a zoom. */
function labelLengthFor(labels: XAxisLabels, fontSize: number): number {
	return tickMarkCharactersForWidth(labels.minDistance > 0 ? Math.sqrt(labels.minDistance * labels.maxDistance) : 0, fontSize);
}

function sameEdgeState(a: EdgeState, b: EdgeState): boolean {
	return a.movable === b.movable && a.freeLeft === b.freeLeft && a.freeRight === b.freeRight;
}

/** The X axis of a scatter series: its slots, labels, edges and fit on the chart's time scale. */
export class XAxisController {
	readonly #chart: IChartApiBase<number>;
	readonly #behavior: ScatterHorzScaleBehavior;
	readonly #host: XAxisHost;
	// The chart's own label distance, given back on removal: the host's latest.
	#hostLabelLength: number | undefined;
	// The chart's own fixed edges, kept while `xMargins` needs them freed.
	#hostEdges: HostEdges | null = null;

	// What the chart was last given.
	#grid: SlotGrid | null = null;
	#levels: readonly TickLevel[] | null = null;
	#ends: boolean = false;
	#slots: readonly ScatterSlotItem[] | null = null;
	#formatter: ((x: number) => string) | null = null;
	#labelLength: number | null = null;
	#margins: Margins | null = null;
	#edges: EdgeState | null = null;
	// Counts the layouts which went as far as changing the chart.
	#writes: number = 0;

	#labelFont: string = '';
	readonly #labelWidths: TextWidthCache = createTextWidthCache();
	#fitCache: { key: string; formatter: ((x: number) => string) | null; grid: SlotGrid; layout: FitLayout } | null = null;

	#fittedRange: LogicalRange | null = null;
	#rangeFollowsFit: boolean = true;
	#width: number = 0;
	#layingOut: boolean = false;
	#fitScheduled: boolean = false;
	// Lays out again once the chart is done with the range it just changed (fitting first when asked to).
	readonly #layoutTask: CoalescedTask;
	// Lays out again once the paint in which the width changed is over.
	readonly #resizeTask: CoalescedTask;

	public constructor(
		chart: IChartApiBase<number>,
		behavior: ScatterHorzScaleBehavior,
		host: XAxisHost,
		task: typeof createCoalescedTask
	) {
		this.#chart = chart;
		this.#behavior = behavior;
		this.#host = host;
		this.#hostLabelLength = chart.options().timeScale.tickMarkMaxCharacterLength;
		this.#layoutTask = task(() => this.#layOutAfterRangeChange());
		this.#resizeTask = task(() => {
			if (host.acts()) {
				this.#layOut(true);
			}
		});
	}

	/** Starts following the chart's width and visible range. */
	public subscribe(): void {
		this.#chart.timeScale().subscribeSizeChange(this.#onSizeChange);
		this.#chart.timeScale().subscribeVisibleLogicalRangeChange(this.#onVisibleRangeChange);
	}

	/** Stops following them. */
	public unsubscribe(): void {
		this.#chart.timeScale().unsubscribeSizeChange(this.#onSizeChange);
		this.#chart.timeScale().unsubscribeVisibleLogicalRangeChange(this.#onVisibleRangeChange);
	}

	/** Gives the chart back its own label distance and fixed edges, unless the host has set others since. */
	public restoreHostOptions(): void {
		if (this.#labelLength !== null && this.#chart.options().timeScale.tickMarkMaxCharacterLength === this.#labelLength) {
			// `undefined` would be skipped by the merge; `0` means the default too.
			this.#chart.applyOptions({ timeScale: { tickMarkMaxCharacterLength: this.#hostLabelLength ?? 0 } });
		}
		if (this.#hostEdges !== null) {
			this.#chart.applyOptions({ timeScale: this.#latestHostEdges() });
			this.#hostEdges = null;
		}
	}

	/** Fits the X domain to the plot (`ScatterSeriesApi.fitXDomain`). */
	public fit(): void {
		if (!this.#host.acts()) {
			return;
		}
		const grid = this.#host.model().grid;
		const timeScale = this.#chart.timeScale();
		const width = timeScale.width();
		const first = timeScale.timeToIndex(slotValue(grid, 0), false);
		if (!hasWidth(width) || first === null) {
			return;
		}
		const { spacing, margins } = this.#fitLayout(width, grid);
		// The first slot on the left margin and the last one on `width − 1 −
		// right margin` (see the header), so that, without margins, the ends of
		// the domain are the edges of the plot.
		const to = first + grid.count - 1 - 0.5 + margins.right / spacing;
		const range: LogicalRange = { from: (to + 1 - width / spacing) as Logical, to: to as Logical };
		this.#fittedRange = range;
		this.#rangeFollowsFit = true;
		timeScale.setVisibleLogicalRange(range);
	}

	/**
	 * The X mapping of the chart's scale as it is now, found from the second
	 * slot: while the slots are weighed again the first one is moved off for a
	 * moment (see `#setSlots`), and the crosshair events the chart fires then
	 * must still find the points.
	 */
	public xMapping(): XMapping | null {
		const grid = this.#host.model().grid;
		const timeScale = this.#chart.timeScale();
		const second = timeScale.timeToIndex(slotValue(grid, 1), false);
		if (second === null) {
			return null;
		}
		const origin = timeScale.logicalToCoordinate((second - 1) as unknown as Logical);
		const next = timeScale.logicalToCoordinate(second as unknown as Logical);
		if (origin === null || next === null) {
			return null;
		}
		return { start: slotValue(grid, 0), origin, pxPerUnit: (next - origin) / stepValue(grid.step) };
	}

	/**
	 * Gives the chart what changed of the current model: the slots (weighed
	 * again when the grid or the label chain changed), the label distance and
	 * the visible range — fitted again when the domain changed, unless the
	 * user scrolled or zoomed it.
	 */
	public relayOut(): void {
		this.#layOut(false);
	}

	/** After a paint: frees the edges the host fixed again, and lays out again for a new label font or edge state. */
	public afterDraw(): void {
		if (this.#applyEdges() && this.#followsFit()) {
			this.fit();
		}
		// The host switched scrolling, zooming or an edge, which moves the end labels.
		const edges = this.#edges;
		if (
			(this.#labelFont !== '' && this.#labelFont !== this.#currentLabelFont()) ||
			(edges !== null && !sameEdgeState(edges, this.#edgeState()))
		) {
			this.#layOut(false);
		}
	}

	public snapshot(): XAxisSnapshot {
		return {
			writes: this.#writes,
			fittedRange: this.#fittedRange,
			userRange: this.#followsFit() ? null : this.#chart.timeScale().getVisibleLogicalRange(),
		};
	}

	/** Whether a layout changed the chart since `snapshot`. */
	public changedSince(snapshot: XAxisSnapshot): boolean {
		return snapshot.writes !== this.#writes;
	}

	/** After a change which threw, with the model as it was: gives the chart that model again, and the user's zoom. */
	public restore(snapshot: XAxisSnapshot): void {
		this.#grid = null;
		this.#slots = null;
		try {
			this.#layOut(false);
			if (snapshot.userRange !== null) {
				this.#fittedRange = snapshot.fittedRange;
				this.#rangeFollowsFit = false;
				this.#chart.timeScale().setVisibleLogicalRange(snapshot.userRange);
			}
		} catch {
			// As it was before the change: nothing more to restore.
		}
	}

	#layOut(resized: boolean): void {
		const layingOut = this.#layingOut;
		this.#layingOut = true;
		try {
			this.#layOutNow(resized);
		} finally {
			this.#layingOut = layingOut;
		}
	}

	#layOutNow(resized: boolean): void {
		// The edges first: the labels and margins are those of the edges the chart will have.
		if (this.#applyEdges()) {
			this.#writes++;
		}
		const model = this.#host.model();
		const grid = model.grid;
		const formatter = this.#host.options().xFormatter;
		const gridChanged = !sameGrid(this.#grid, grid);
		const followsFit = this.#followsFit();
		// Labels for the plot about to be shown: fitted (a new grid always is), or as the user zoomed it.
		const { labels, levels, ends, reweigh } = this.#labelChain(grid, gridChanged, followsFit || gridChanged || this.#fittedRange === null);
		const marginChanged = this.#updateMargins(grid);
		// From here on the chart is changed.
		this.#writes++;
		this.#edges = this.#edgeState();
		const refit = gridChanged || this.#fittedRange === null || (followsFit && (reweigh || resized || marginChanged));
		const userRange = !refit && reweigh ? this.#chart.timeScale().getVisibleLogicalRange() : null;

		// The behaviour weighs the time points as the slots are set: it must know the grid and the chain first.
		setScatterXAxis(this.#behavior, { grid, levels, ends, formatter });
		this.#setSlots(model.slots, grid, reweigh);
		this.#grid = grid;
		this.#levels = levels;
		this.#ends = ends;
		this.#slots = model.slots;
		this.#applyLabelDistance(labels, formatter !== this.#formatter);
		this.#formatter = formatter;
		if (refit) {
			this.fit();
		} else if (userRange !== null) {
			this.#keepRange(userRange);
		}
	}

	/** The labels for the plot, their chain, and whether the time points must be weighed again. */
	#labelChain(grid: SlotGrid, gridChanged: boolean, fitted: boolean): {
		labels: XAxisLabels | null;
		levels: readonly TickLevel[];
		ends: boolean;
		reweigh: boolean;
	} {
		const labels = this.#chooseLabels(grid, fitted);
		const levels = labels !== null ? labels.levels : tickLevels(grid, grid.tickStep);
		const ends = labels !== null && labels.ends;
		const reweigh = gridChanged || this.#levels === null || !sameLevels(this.#levels, levels) || ends !== this.#ends;
		return { labels, levels, ends, reweigh };
	}

	/** Takes the margins of the fit at the current width. Whether they changed. */
	#updateMargins(grid: SlotGrid): boolean {
		const width = this.#chart.timeScale().width();
		const margins = hasWidth(width) ? this.#fitLayout(width, grid).margins : null;
		const applied = this.#margins;
		this.#margins = margins;
		return margins !== null && (applied === null || applied.left !== margins.left || applied.right !== margins.right);
	}

	/** The chart keeps the visible range through the slots set again; should it not, the user's comes back. */
	#keepRange(userRange: LogicalRange): void {
		const timeScale = this.#chart.timeScale();
		const range = timeScale.getVisibleLogicalRange();
		if (range === null || !sameRange(range, userRange)) {
			timeScale.setVisibleLogicalRange(userRange);
		}
	}

	/**
	 * Sets the slots, when they changed. To have every time point weighed
	 * again (`reweigh`), a first slot which stays is moved off by one slot for
	 * a moment (see the header). The data is never emptied: the time scale
	 * keeps its points and the host its visible range.
	 */
	#setSlots(items: readonly ScatterSlotItem[], grid: SlotGrid, reweigh: boolean): void {
		const series = this.#host.series();
		const slots = items as (ScatterSlotData | WhitespaceData<number>)[];
		const applied = this.#slots;
		if (!reweigh) {
			if (applied === null || !sameSlots(applied, items)) {
				series.setData(slots);
			}
			return;
		}
		if (applied !== null && applied.length > 0 && slots.length > 0 && applied[0].time === slots[0].time) {
			series.setData([{ ...slots[0], time: slotValue(grid, -1) }, ...slots.slice(1)]);
		}
		series.setData(slots);
	}

	/**
	 * The labels for the plot fitted to the domain, or as it is in view, or
	 * `null` before the chart knows its width.
	 */
	#chooseLabels(grid: SlotGrid, fitted: boolean): XAxisLabels | null {
		const width = this.#chart.timeScale().width();
		if (!hasWidth(width) || grid.count < 2) {
			return null;
		}
		if (!fitted) {
			const mapping = this.xMapping();
			if (mapping !== null && mapping.pxPerUnit > 0) {
				const edges = this.#edgeState();
				const { labelWidth, spacing } = this.#labelMeasure(grid);
				const geometry = {
					spacing: mapping.pxPerUnit * stepValue(grid.step),
					origin: mapping.origin,
					width,
					zoomed: true,
					movedInside: { left: !edges.freeLeft, right: !edges.freeRight },
					movable: edges.movable,
				};
				return chooseXLabels(grid, geometry, labelWidth, spacing);
			}
		}
		return this.#fitLayout(width, grid).labels;
	}

	/** The width of the label of a slot, in the chart's font, and how far apart labels must be. */
	#labelMeasure(grid: SlotGrid): { labelWidth: (slot: number) => number; spacing: XLabelSpacing } {
		const fontSize = this.#chart.options().layout.fontSize;
		const font = this.#currentLabelFont();
		if (font !== this.#labelFont) {
			// Widths in the old font are never asked for again.
			this.#labelFont = font;
			this.#labelWidths.clear();
		}
		const state = { grid, levels: [], ends: false, formatter: this.#host.options().xFormatter };
		const labelWidth = (slot: number): number => {
			const text = formatScatterX(state, slotValue(grid, slot));
			return this.#labelWidths.measure(font, text) ?? text.length * fontSize * FALLBACK_CHARACTER_EM;
		};
		return { labelWidth, spacing: { gap: fontSize * LABEL_GAP_EM, minPitch: fontSize * LABEL_PITCH_EM } };
	}

	#edgeState(): EdgeState {
		const options = this.#chart.options();
		const movable = canUserMoveTimeScale(options);
		const freed = this.#marginsNeedFreeEdges();
		return {
			movable,
			freeLeft: movable && (freed || !options.timeScale.fixLeftEdge),
			freeRight: movable && (freed || !options.timeScale.fixRightEdge),
		};
	}

	/**
	 * The fit of the X domain to a plot `width` pixels wide: the spacing, the
	 * margins and the labels. The margins are `xMargins`; at a free edge of a
	 * movable axis, where the chart centres the end label on the edge, at least
	 * the room that label needs ({@link endLabelRoom}). Cached while nothing it
	 * depends on changes.
	 */
	#fitLayout(width: number, grid: SlotGrid): FitLayout {
		const edges = this.#edgeState();
		const { xFormatter: formatter, xMargins: margin } = this.#host.options();
		const key = [
			width,
			margin,
			this.#currentLabelFont(),
			this.#chart.options().layout.fontSize,
			edges.movable,
			edges.freeLeft,
			edges.freeRight,
		].join('|');
		const cached = this.#fitCache;
		if (cached !== null && cached.key === key && cached.formatter === formatter && sameGrid(cached.grid, grid)) {
			return cached.layout;
		}
		const layout = this.#computeFitLayout(width, grid, margin, edges);
		this.#fitCache = { key, formatter, grid, layout };
		return layout;
	}

	#computeFitLayout(width: number, grid: SlotGrid, margin: number, edges: EdgeState): FitLayout {
		const most = Math.max(0, (width - 1) * MAX_MARGIN_SHARE);
		const base = Number.isFinite(margin) ? Math.min(Math.max(0, margin), most) : 0;
		let margins = { left: base, right: base };
		const spacingOf = (room: Margins): number => (width - 1 - room.left - room.right) / (grid.count - 1);
		if (!hasWidth(width) || grid.count < 2) {
			return { spacing: spacingOf(margins), margins, labels: null };
		}
		const { labelWidth, spacing } = this.#labelMeasure(grid);
		const choose = (): XAxisLabels => chooseXLabels(
			grid,
			{
				spacing: spacingOf(margins),
				origin: margins.left,
				width,
				movedInside: { left: !edges.freeLeft, right: !edges.freeRight },
				movable: edges.movable,
			},
			labelWidth,
			spacing
		);
		let labels = choose();
		for (let pass = 0; pass < END_ROOM_PASSES && (edges.freeLeft || edges.freeRight); pass++) {
			const room = endLabelRoom(grid, labels, spacingOf(margins), labelWidth);
			const next = {
				left: edges.freeLeft ? Math.min(most, Math.max(margins.left, room.left)) : margins.left,
				right: edges.freeRight ? Math.min(most, Math.max(margins.right, room.right)) : margins.right,
			};
			if (next.left === margins.left && next.right === margins.right) {
				break;
			}
			margins = next;
			labels = choose();
		}
		return { spacing: spacingOf(margins), margins, labels };
	}

	/** The font of the time axis labels: bold, the wider, when it may draw any label bold. */
	#currentLabelFont(): string {
		return timeAxisLabelFont(this.#chart.options(), true);
	}

	/**
	 * Tells the time scale how far apart to keep the X labels. A distance in
	 * place which draws the same labels (`minDistance`…`maxDistance`) is kept,
	 * as applying one is a full update; a new one is taken from the middle of
	 * that span, so that it stays through most steps of a zoom. Applying it
	 * also drops the chart's cached label texts, which a new formatter needs
	 * (`force`).
	 */
	#applyLabelDistance(labels: XAxisLabels | null, force: boolean): void {
		const options = this.#chart.options();
		const fontSize = options.layout.fontSize;
		const current = options.timeScale.tickMarkMaxCharacterLength;
		const ours = this.#labelLength !== null && current === this.#labelLength;
		if (!ours) {
			// The host set a label distance of its own since: the one to give back.
			this.#hostLabelLength = current;
		}
		if (labels !== null && ours && !force && current !== undefined && drawsLabels(current, labels, fontSize)) {
			return;
		}
		const length = labels !== null ? labelLengthFor(labels, fontSize) : this.#labelLength;
		if (length === null || (length === this.#labelLength && length === current && !force)) {
			return;
		}
		this.#labelLength = length;
		this.#chart.applyOptions({ timeScale: { tickMarkMaxCharacterLength: length } });
	}

	/**
	 * `xMargins` needs room past the ends of the domain, which the chart
	 * refuses at a fixed edge. While margins are asked for, the series frees
	 * both edges — again whenever the host fixes one, keeping that as its
	 * setting; without margins, it gives the chart back the host's setting.
	 *
	 * @returns Whether it changed the chart's edges.
	 */
	#applyEdges(): boolean {
		if (this.#marginsNeedFreeEdges()) {
			const { fixLeftEdge, fixRightEdge } = this.#chart.options().timeScale;
			if (!fixLeftEdge && !fixRightEdge) {
				return false;
			}
			this.#hostEdges = this.#latestHostEdges();
			this.#chart.applyOptions({ timeScale: { fixLeftEdge: false, fixRightEdge: false } });
			return true;
		}
		if (this.#hostEdges !== null) {
			const edges = this.#latestHostEdges();
			this.#hostEdges = null;
			this.#chart.applyOptions({ timeScale: edges });
			return true;
		}
		return false;
	}

	/**
	 * The host's edges: those kept when the series freed them, and an edge
	 * fixed on the chart since, which only the host can have done. An edge the
	 * host freed since cannot be told: it was free on the chart already.
	 */
	#latestHostEdges(): HostEdges {
		const { fixLeftEdge, fixRightEdge } = this.#chart.options().timeScale;
		const kept = this.#hostEdges;
		return {
			fixLeftEdge: fixLeftEdge || (kept !== null && kept.fixLeftEdge),
			fixRightEdge: fixRightEdge || (kept !== null && kept.fixRightEdge),
		};
	}

	/** Whether `xMargins` asks for room past the ends of the domain. */
	#marginsNeedFreeEdges(): boolean {
		const margin = this.#host.options().xMargins;
		return Number.isFinite(margin) && margin > 0;
	}

	/** Whether the host fixed an edge of the chart again while margins need them free. */
	#edgesFixedAgain(): boolean {
		if (!this.#marginsNeedFreeEdges()) {
			return false;
		}
		const { fixLeftEdge, fixRightEdge } = this.#chart.options().timeScale;
		return fixLeftEdge || fixRightEdge;
	}

	/** Whether the visible range is still the fitted one: the user did not scroll or zoom it. */
	#followsFit(): boolean {
		return this.#fittedRange === null || this.#rangeFollowsFit || !canUserMoveTimeScale(this.#chart.options());
	}

	/**
	 * Whether a visible range is zoomed out as far as the fit, or further,
	 * wherever the domain sits — or as far as the chart lets the user zoom out,
	 * should that stop short of the fit.
	 */
	#isZoomedOut(range: LogicalRange): boolean {
		const width = this.#chart.timeScale().width();
		const grid = this.#host.model().grid;
		if (!hasWidth(width)) {
			return true;
		}
		const options = this.#chart.options().timeScale;
		let longest = width / this.#fitLayout(width, grid).spacing - 1;
		if (options.fixLeftEdge && options.fixRightEdge) {
			longest = Math.min(longest, grid.count - 1);
		} else if (options.minBarSpacing > 0) {
			longest = Math.min(longest, width / options.minBarSpacing - 1);
		}
		return range.to - range.from >= longest - RANGE_TOLERANCE;
	}

	/** Whether the chart has just reset its time scale (`restoreDefault`, see the header). */
	#isTimeScaleReset(): boolean {
		const options = this.#chart.options().timeScale;
		const timeScale = this.#chart.timeScale();
		const spacing = timeScale.options().barSpacing;
		if (!(spacing > 0) || Math.abs(spacing - options.barSpacing) > RELATIVE_TOLERANCE * spacing) {
			return false;
		}
		const offset = options.rightOffsetPixels !== undefined ? options.rightOffsetPixels / spacing : options.rightOffset;
		return Math.abs(timeScale.scrollPosition() - offset) < RANGE_TOLERANCE;
	}

	readonly #onSizeChange = (width: number): void => {
		if (width === this.#width) {
			return;
		}
		this.#width = width;
		// Not in the middle of the paint (see the header).
		this.#resizeTask.schedule();
	};

	/**
	 * Follows the range the chart shows: the fit, or one the user scrolled or
	 * zoomed. Zoomed out as far as the fit, wherever the domain then sits, or
	 * reset by the chart, is the fit, which the series sets again exactly: a
	 * pan at the zoom of the fit springs back. Otherwise the labels are chosen
	 * again for the part in view.
	 */
	readonly #onVisibleRangeChange = (range: LogicalRange | null): void => {
		if (this.#layingOut || !this.#host.acts() || range === null || this.#fittedRange === null) {
			return;
		}
		const fitted = sameRange(range, this.#fittedRange);
		if (!fitted && this.#edgesFixedAgain()) {
			// The chart moved the range to edges the host has just fixed: the next draw frees them and fits again.
			return;
		}
		const canMove = canUserMoveTimeScale(this.#chart.options());
		this.#rangeFollowsFit = fitted || !canMove || this.#isZoomedOut(range) || this.#isTimeScaleReset();
		if (canMove) {
			// Never from within the chart's event: once it is done with the range.
			this.#fitScheduled = this.#fitScheduled || (this.#rangeFollowsFit && !fitted);
			this.#layoutTask.schedule();
		}
	};

	#layOutAfterRangeChange(): void {
		const fitNow = this.#fitScheduled;
		this.#fitScheduled = false;
		if (!this.#host.acts()) {
			return;
		}
		if (fitNow) {
			this.fit();
		}
		this.#layOut(false);
	}
}
