import {
	AutoscaleInfo,
	ColorType,
	Coordinate,
	CustomSeriesOptions,
	IChartApiBase,
	ISeriesApi,
	PriceScaleMode,
	SeriesPartialOptions,
	WhitespaceData,
} from 'lightweight-charts';
import { isChartRemoved, isSeriesAttached } from '@tradingview/lwc-toolkit/chart/lifecycle';
import { cloneOptions } from '@tradingview/lwc-toolkit/options/merge';
import { CoalescedTask, createCoalescedTask } from '@tradingview/lwc-toolkit/scheduling/coalesced-task';

import { scatterAutoscaleInfo } from './autoscale';
import type { ScatterGroupInfo, ScatterPoint, ScatterPointInfo, ScatterSizeMapping, ScatterSlotData } from './data';
import { ScatterGeometryCache, XMapping, YToCoordinate, coordinateToX, isInPane, xToCoordinate } from './geometry';
import { hitTestScatter } from './hit-test';
import { HoverController, HoverHost } from './hover-controller';
import {
	ScatterHorzScaleBehavior,
	ScatterXAxisOwner,
	claimScatterXAxis,
	isScatterHorzScaleBehavior,
	releaseScatterXAxis,
} from './horz-scale-behavior';
import { ScatterModel, buildScatterModel } from './model';
import {
	ScatterOwnOptions,
	applyOwnOptions,
	applySeriesOptions,
	fullOptions,
	initialOwnOptions,
	optionChange,
	paintOptions,
	splitOptions,
} from './option-handling';
import { ScatterSeriesOptions, ScatterSeriesPartialOptions, underlyingSeriesDefaults } from './options';
import type { ScatterRenderOptions } from './renderer';
import { cappedStrokeWidth, describeSizeMapping } from './size';
import { ResolvedScatterGroup, describeGroup, strokeColorOf, withGroupVisibility } from './style';
import { ScatterSeriesView } from './view';
import { XAxisController, XAxisHost } from './x-axis-controller';
import { MAX_X_MAGNITUDE, slotValue, stepValue } from './x-axis';

/** The custom series a scatter series draws with. */
export type ScatterUnderlyingSeries = ISeriesApi<
	'Custom',
	number,
	ScatterSlotData | WhitespaceData<number>,
	CustomSeriesOptions,
	SeriesPartialOptions<CustomSeriesOptions>
>;

/** Called with the hovered point, or `null` when no point is hovered any more. */
export type ScatterHoveredPointHandler<TPoint extends ScatterPoint> = (point: ScatterPointInfo<TPoint> | null) => void;

/** The X axis a scatter series spans. */
export interface ScatterXDomain {
	/** X value at the left edge of the plot. */
	min: number;
	/** X value at the right edge of the plot. */
	max: number;
	/** Step of the axis ticks the domain was rounded to. */
	tickStep: number;
}

/**
 * A scatter series: every point of the dataset, in any number of groups, drawn
 * by a single custom series on a chart created with `createScatterChart`.
 *
 * The API draws the chart content only. Titles, legends and tooltips are the
 * host's: it learns which point is hovered from `subscribeHoveredPointChange`,
 * or from `hoveredInfo.objectId` in the chart's crosshair events, asks
 * {@link ScatterSeriesApi.pointById} where to put its tooltip, and builds its
 * legend from {@link ScatterSeriesApi.groups}.
 */
export interface ScatterSeriesApi<TPoint extends ScatterPoint = ScatterPoint> {
	/**
	 * Replaces the points. They need no ordering and may share X values. The
	 * array is copied, the points are not. A call that throws (data which is
	 * not an array, an `xFormatter` that throws on the new axis) changes
	 * nothing.
	 */
	setData(points: readonly TPoint[]): void;
	/** The points, as last set: a copy of the array, holding the points themselves. */
	data(): readonly TPoint[];
	/**
	 * Changes options. Nested objects are merged, arrays (`groups`,
	 * `baselines`, `palette`) and `xFormatter` are replaced, and `null` sets an
	 * option back to its default: an end of a range to automatic, or — from
	 * JavaScript — a whole option such as `xRange` or `plotBorder`. A call that
	 * throws (options the series cannot use, an `xFormatter` that throws)
	 * changes nothing.
	 */
	applyOptions(options: ScatterSeriesPartialOptions): void;
	/**
	 * The current options, as a copy: changing it changes neither the series
	 * nor the defaults. Change options with {@link applyOptions}.
	 */
	options(): Readonly<ScatterSeriesOptions>;
	/**
	 * The underlying custom series, for its price scale, `priceFormat`,
	 * `priceToCoordinate` and so on. Set scatter options and `visible` through
	 * this API, not through the series; its data is the slot grid of the X axis.
	 * Its own `options().hitTestTolerance` is `-Infinity`, which turns the
	 * chart's hit test of the slots off: the series' tolerance is in
	 * {@link ScatterSeriesApi.options}.
	 */
	series(): ScatterUnderlyingSeries;
	/**
	 * The groups as they are drawn, in drawing order: the declared ones, then
	 * the ones the points name without being declared. Each has its colour and
	 * shape resolved (the palette applied) and its number of points, ready for
	 * a legend.
	 */
	groups(): readonly ScatterGroupInfo[];
	/**
	 * Shows or hides a group, as a legend does: the group keeps its colour and
	 * place, the X axis stays as it is and the price scale fits the visible
	 * points. A group the points name without declaring it is declared, with
	 * the ones before it, so its palette colour does not change.
	 */
	setGroupVisible(groupId: string, visible: boolean): void;
	/** The X axis domain the series currently spans. */
	xDomain(): ScatterXDomain;
	/**
	 * Fits the X domain to the plot, edge to edge (or `xMargins` inside the
	 * edges, and, at a free edge the user can scroll, far enough inside for the
	 * end label). The series does it by itself when the domain changes, and
	 * after resizes unless the user zoomed in (when the host enables scrolling
	 * or zooming); a user zooming out as far as the fit, or panning at its
	 * zoom, or resetting the time axis with a double-click, is back at the fit.
	 * Call it to return to the whole domain.
	 */
	fitXDomain(): void;
	/**
	 * The horizontal pane coordinate of an X value, in CSS pixels from the left
	 * edge of the pane: where the series draws a point with that `x` — the X
	 * counterpart of `series().priceToCoordinate(y)`, for overlays of your own.
	 * A value outside the X domain, or out of view, still gets a coordinate,
	 * outside the pane.
	 *
	 * The mapping is that of the axis, so it does not depend on whether the
	 * series or a group is visible. It is the chart's scale as it is now: the
	 * chart applies a new X domain on its next frame, so read it while the
	 * chart paints (in a primitive's `updateAllViews`), from a crosshair or
	 * hovered-point handler, or a frame after `setData`.
	 *
	 * `null` for a value which is not a finite number, while the axis has no
	 * slots (the series taken off the chart with `chart.removeSeries`), and
	 * once the series or its chart is removed.
	 */
	xToCoordinate(x: number): Coordinate | null;
	/**
	 * The X value at a horizontal pane coordinate in CSS pixels: the inverse of
	 * {@link xToCoordinate}, the X counterpart of
	 * `series().coordinateToPrice(y)`. A coordinate outside the pane gives the
	 * value it would have there. `null` in the cases `xToCoordinate` returns
	 * `null`.
	 */
	coordinateToX(coordinate: number): number | null;
	/**
	 * How `sizeValue` is mapped to sizes, as the points are drawn: the domain,
	 * the range of sizes and the scale, and `sizeFor(value)` giving the size
	 * of any value, for a bubble-size legend. `null` when no point is sized by
	 * its `sizeValue`. A snapshot: call it again after `setData` or
	 * `applyOptions`.
	 */
	sizeMapping(): ScatterSizeMapping | null;
	/**
	 * Where a point is drawn, by its `objectId`. `null` when there is no such
	 * point, or it is not drawn: a hidden group or series, coordinates which
	 * are not numbers, or a marker entirely outside the plot. With duplicate
	 * ids, the first point with the id.
	 *
	 * The geometry is that of the chart's scales as they are now. The chart
	 * applies the scales of new data or options on its next frame, so read it
	 * from a crosshair or hovered-point handler, or a frame after `setData`.
	 */
	pointById(objectId: string): ScatterPointInfo<TPoint> | null;
	/**
	 * The point at a pane coordinate in CSS pixels: the topmost point under it,
	 * else the nearest point within a few pixels. For hosts handling the
	 * pointer themselves; the chart's own hover uses the same test.
	 */
	hitTest(x: number, y: number): ScatterPointInfo<TPoint> | null;
	/** The hovered point: under the pointer, else set with {@link setHoveredPoint}. */
	hoveredPoint(): ScatterPointInfo<TPoint> | null;
	/**
	 * Highlights a point from outside the chart (a legend or table row
	 * hovered), as if it were under the pointer. `null` clears it. A point
	 * under the pointer takes precedence.
	 */
	setHoveredPoint(objectId: string | null): void;
	/**
	 * Subscribes to the hovered point. The handler runs after the chart has
	 * painted, with the geometry of that frame, whenever what
	 * {@link hoveredPoint} returns changes: another point, no point (`null`),
	 * or the same point drawn elsewhere or differently — new data, new
	 * options, a resize, a rescaled axis. A tooltip placed from it follows the
	 * point. A handler last given a point is given `null`, once, when the
	 * series is removed (`remove()`, or taken off with `chart.removeSeries`).
	 * After `chart.remove()` the chart paints no more: the handler is given
	 * `null` on the next frame when a hover change was pending, else from
	 * `remove()`.
	 */
	subscribeHoveredPointChange(handler: ScatterHoveredPointHandler<TPoint>): void;
	/** Unsubscribes a handler added with {@link subscribeHoveredPointChange}. */
	unsubscribeHoveredPointChange(handler: ScatterHoveredPointHandler<TPoint>): void;
	/**
	 * Removes the series from the chart, releases its subscriptions and gives
	 * the chart back its own `timeScale.tickMarkMaxCharacterLength` (and fixed
	 * edges). The hovered-point subscribers last given a point are given
	 * `null` first. It may be called more than once, and after
	 * `chart.remove()`; the API does nothing afterwards, and returns `null`
	 * for points — as it does from `chart.remove()` on.
	 */
	remove(): void;
}

/** The start of the console warnings. */
const WARNING = 'lwc-plugin-scatter-series: ';

const SCALE_MODE_WARNING = 'percentage and indexed-to-100 price scales mean nothing here; use Normal or Logarithmic.';

/**
 * Where a scatter series is in its life. `attached`: its underlying series is
 * on the chart, and it acts on it. `detached`: the host took the underlying
 * series off with `chart.removeSeries`; the series lets go of the chart after
 * the current call, never from inside the chart's own dispatch of an event.
 * `disposed`: the chart was removed (`chart.remove()`), and with it everything
 * the series did to it. `removed`: `remove()` was called. The first two are
 * read from the chart each time; the last two are final.
 */
type Lifecycle = 'attached' | 'detached' | 'disposed' | 'removed';

/**
 * A scatter series: the model of its points, and the chart's custom series it
 * draws them with. The X axis ({@link XAxisController}) and the hovered point
 * ({@link HoverController}) are handled apart.
 *
 * The public members are arrow functions on the instance, not prototype
 * methods: a host may call them through a Proxy (a Vue `reactive()`, say),
 * whose `this` could not read the `#private` fields.
 */
export class ScatterSeriesApiImpl<TPoint extends ScatterPoint> implements ScatterSeriesApi<TPoint>, ScatterXAxisOwner {
	readonly #chart: IChartApiBase<number>;
	readonly #behavior: ScatterHorzScaleBehavior;
	readonly #series: ScatterUnderlyingSeries;
	readonly #geometryCache: ScatterGeometryCache = new ScatterGeometryCache();
	#own: ScatterOwnOptions;
	// The paint options of `#own`: made when first needed after it changes.
	#paint: ScatterRenderOptions | null = null;
	#points: readonly TPoint[] = [];
	#model: ScatterModel<TPoint>;
	#state: Lifecycle = 'attached';
	readonly #warned: Set<string> = new Set();
	#scaleModeCheckedAt: number = -1;

	// Every task queued by the series and its controllers: `remove()` cancels them all.
	readonly #tasks: CoalescedTask[] = [];
	readonly #task: typeof createCoalescedTask = (run: () => void, enqueue?: (callback: () => void) => void): CoalescedTask => {
		const task = createCoalescedTask(run, enqueue);
		this.#tasks.push(task);
		return task;
	};
	// Once a paint is over: the hovered point may have moved with the scales.
	readonly #drawnTask: CoalescedTask = this.#task(() => this.#afterDraw());
	// Lets go of the chart the series was taken off, after the current call (see `#acts`).
	readonly #releaseTask: CoalescedTask = this.#task(() => {
		if (this.#lifecycle() === 'detached') {
			this.remove();
		}
	});
	readonly #xAxis: XAxisController;
	readonly #hover: HoverController<TPoint>;

	public constructor(chart: IChartApiBase<number>, options: ScatterSeriesPartialOptions, paneIndex: number) {
		const behavior = chart.horzBehaviour();
		if (!isScatterHorzScaleBehavior(behavior)) {
			throw new Error('A scatter series needs a chart with a ScatterHorzScaleBehavior of the same build: use createScatterChart.');
		}
		claimScatterXAxis(behavior, this);
		this.#chart = chart;
		this.#behavior = behavior;
		const xAxisHost: XAxisHost = {
			series: () => this.#series,
			model: () => this.#model,
			options: () => this.#own.scatter,
			acts: () => this.#acts(),
		};
		this.#xAxis = new XAxisController(chart, behavior, xAxisHost, this.#task);
		const hoverHost: HoverHost<TPoint> = {
			model: () => this.#model,
			series: () => this.#series,
			hoveredPoint: () => this.hoveredPoint(),
		};
		this.#hover = new HoverController(hoverHost, this.#task);
		try {
			const split = splitOptions(options);
			this.#own = initialOwnOptions(split);
			this.#model = buildScatterModel<TPoint>([], fullOptions(underlyingSeriesDefaults, underlyingSeriesDefaults.color, this.#own));
			const view = new ScatterSeriesView({
				model: () => this.#model,
				options: () => this.#paintOptions(),
				backgroundColor: () => this.#backgroundColor(),
				xMapping: () => this.#xAxis.xMapping(),
				hoveredIndex: () => this.#hover.index(),
				geometry: (model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate) =>
					this.#geometryCache.geometry(model, mapping, yToCoordinate),
				hit: (model: ScatterModel, index: number | null) => this.#hover.recordHit(model, index),
				drawn: () => this.#drawnTask.schedule(),
			});
			this.#series = chart.addCustomSeries(
				view,
				{
					...split.base,
					autoscaleInfoProvider: this.#autoscaleInfoProvider,
					// The chart falls back to hit testing the vertical extent of each slot
					// when the renderer reports no point: hovered, with no objectId, between
					// points. This tolerance turns that off; the renderer uses the series' own.
					hitTestTolerance: Number.NEGATIVE_INFINITY,
				},
				paneIndex
			);
			chart.subscribeCrosshairMove(this.#hover.onCrosshairMove);
			this.#xAxis.subscribe();
			this.#rebuildModel();
			this.#xAxis.relayOut();
			this.#repaintModel();
		} catch (error) {
			// Undo what was done to the chart, so that the host can try again.
			this.remove();
			throw error;
		}
	}

	public readonly setData = (points: readonly TPoint[]): void => {
		if (!this.#acts()) {
			return;
		}
		const next = points.slice();
		this.#atomically(() => {
			this.#points = next;
			this.#rebuildModel();
			this.#xAxis.relayOut();
			this.#repaintModel();
		});
	};

	public readonly data = (): readonly TPoint[] => {
		return this.#points.slice();
	};

	public readonly applyOptions = (options: ScatterSeriesPartialOptions): void => {
		if (!this.#acts()) {
			return;
		}
		const split = splitOptions(options);
		const change = optionChange(split);
		// Options the series or the chart cannot use throw here, with nothing changed.
		this.#atomically(() => {
			this.#setOwn(applyOwnOptions(this.#own, split));
			if (change !== 'paint') {
				// The model takes the new colour, which the series takes below.
				this.#rebuildModel(split.base.color);
				if (change === 'axis') {
					this.#xAxis.relayOut();
				}
				this.#repaintModel();
			}
			applySeriesOptions(this.#series, split.base);
		});
		if (change === 'paint' && Object.keys(split.base).length === 0 && (Object.keys(split.scatter).length > 0 || split.autoscale !== null)) {
			this.#requestRepaint();
		}
		// `visible` and the styles change what the hovered point is, or how it looks.
		this.#hover.scheduleNotification();
	};

	public readonly options = (): Readonly<ScatterSeriesOptions> => {
		const base = this.#series.options();
		return cloneOptions(fullOptions(base, base.color, this.#own));
	};

	public readonly series = (): ScatterUnderlyingSeries => {
		return this.#series;
	};

	public readonly groups = (): readonly ScatterGroupInfo[] => {
		const model = this.#model;
		const background = this.#backgroundColor();
		return model.groups.map((group: ResolvedScatterGroup) => describeGroup(group, model.groupPointCounts[group.index], background));
	};

	public readonly setGroupVisible = (groupId: string, visible: boolean): void => {
		if (!this.#acts()) {
			return;
		}
		const groups = withGroupVisibility(this.#own.scatter.groups, this.#model.groups, groupId, visible);
		if (groups !== null) {
			this.applyOptions({ groups });
		}
	};

	public readonly xDomain = (): ScatterXDomain => {
		const grid = this.#model.grid;
		return {
			min: slotValue(grid, 0),
			max: slotValue(grid, grid.count - 1),
			tickStep: stepValue(grid.tickStep),
		};
	};

	public readonly fitXDomain = (): void => {
		this.#xAxis.fit();
	};

	public readonly xToCoordinate = (x: number): Coordinate | null => {
		const mapping = Number.isFinite(x) ? this.#liveXMapping() : null;
		return mapping === null ? null : (xToCoordinate(mapping, x) as Coordinate);
	};

	public readonly coordinateToX = (coordinate: number): number | null => {
		const mapping = Number.isFinite(coordinate) ? this.#liveXMapping() : null;
		return mapping === null || mapping.pxPerUnit === 0 ? null : coordinateToX(mapping, coordinate);
	};

	public readonly sizeMapping = (): ScatterSizeMapping | null => {
		const scaling = this.#model.sizeScaling;
		return scaling === null ? null : describeSizeMapping(scaling);
	};

	public readonly pointById = (objectId: string): ScatterPointInfo<TPoint> | null => {
		if (!this.#isSeriesVisible()) {
			return null;
		}
		const index = this.#model.idToIndex.get(objectId);
		return index === undefined ? null : this.#pointInfo(index);
	};

	public readonly hitTest = (x: number, y: number): ScatterPointInfo<TPoint> | null => {
		// Visibility first: it also tells a removed chart, which must not be asked for a mapping.
		if (!this.#isSeriesVisible()) {
			return null;
		}
		const mapping = this.#xAxis.xMapping();
		if (mapping === null) {
			return null;
		}
		const model = this.#model;
		const paint = this.#paintOptions();
		const geometry = this.#geometryCache.geometry(model, mapping, (price: number) => this.#series.priceToCoordinate(price));
		const hit = hitTestScatter(geometry, x, y, this.#hover.index(), paint.hitTestTolerance, paint.hoveredSizeIncrease);
		return hit === null ? null : this.#pointInfo(hit.index);
	};

	public readonly hoveredPoint = (): ScatterPointInfo<TPoint> | null => {
		const index = this.#hover.index();
		return index === null || !this.#isSeriesVisible() ? null : this.#pointInfo(index);
	};

	public readonly setHoveredPoint = (objectId: string | null): void => {
		if (!this.#acts() || !this.#hover.setApiHovered(objectId)) {
			return;
		}
		this.#requestRepaint();
		this.#hover.scheduleNotification();
	};

	public readonly subscribeHoveredPointChange = (handler: ScatterHoveredPointHandler<TPoint>): void => {
		this.#hover.subscribe(handler);
	};

	public readonly unsubscribeHoveredPointChange = (handler: ScatterHoveredPointHandler<TPoint>): void => {
		this.#hover.unsubscribe(handler);
	};

	public readonly remove = (): void => {
		const state = this.#lifecycle();
		if (state === 'removed') {
			return;
		}
		this.#state = 'removed';
		for (const task of this.#tasks) {
			task.cancel();
		}
		try {
			this.#hover.dispose();
		} finally {
			releaseScatterXAxis(this.#behavior, this);
			this.#detach(state);
		}
	};

	/**
	 * Whether the underlying series is on the chart (a host may take it off
	 * with `chart.removeSeries(series.series())` rather than `remove()`).
	 * @internal
	 */
	public readonly attached = (): boolean => {
		return this.#lifecycle() === 'attached';
	};

	/** Reads the lifecycle from the chart, unless it is final. Changes nothing on the chart. */
	#lifecycle(): Lifecycle {
		if (this.#state === 'attached' || this.#state === 'detached') {
			this.#state = isChartRemoved(this.#chart)
				? 'disposed'
				: isSeriesAttached(this.#chart, this.#series) ? 'attached' : 'detached';
		}
		return this.#state;
	}

	/**
	 * Whether the series acts on its chart, for the entry points. One the host
	 * took off the chart lets go of it, as `remove()` does, after the current
	 * call — which may be the chart's own dispatch of an event.
	 */
	#acts(): boolean {
		const state = this.#lifecycle();
		if (state === 'detached') {
			this.#releaseTask.schedule();
		}
		return state === 'attached';
	}

	/** Undoes on the chart what the series did to it, unless the chart is gone. */
	#detach(state: Exclude<Lifecycle, 'removed'>): void {
		if (state === 'disposed') {
			// The series and the subscriptions went with the chart, which must not be asked to paint again.
			return;
		}
		try {
			this.#chart.unsubscribeCrosshairMove(this.#hover.onCrosshairMove);
			this.#xAxis.unsubscribe();
			if (state === 'attached') {
				this.#chart.removeSeries(this.#series);
			}
			this.#xAxis.restoreHostOptions();
		} catch {
			// Nothing left to undo on a chart in the middle of being torn down.
		}
	}

	#setOwn(own: ScatterOwnOptions): void {
		this.#own = own;
		this.#paint = null;
	}

	#paintOptions(): Readonly<ScatterRenderOptions> {
		if (this.#paint === null) {
			this.#paint = paintOptions(this.#own);
		}
		return this.#paint;
	}

	/** The chart's background (the top of a gradient): the automatic ring colour of filled points. */
	#backgroundColor(): string {
		const background = this.#chart.options().layout.background;
		return background.type === ColorType.VerticalGradient ? background.topColor : background.color;
	}

	/**
	 * Runs a change of the points or options, all or nothing: should it throw,
	 * the points, the options and the model are as they were, the chart is
	 * given them again — with the user's zoom — and the error is thrown on.
	 */
	#atomically(change: () => void): void {
		const points = this.#points;
		const own = this.#own;
		const model = this.#model;
		const axis = this.#xAxis.snapshot();
		try {
			change();
		} catch (error) {
			this.#points = points;
			this.#setOwn(own);
			this.#model = model;
			if (this.#xAxis.changedSince(axis) && this.#lifecycle() === 'attached') {
				this.#xAxis.restore(axis);
				this.#requestRepaint();
			}
			throw error;
		}
	}

	/**
	 * Builds the model again from the points and options. The caller gives the
	 * chart what changed: the axis, then a repaint.
	 *
	 * @param color - The series colour, when the series is about to take a new one.
	 */
	#rebuildModel(color?: string): void {
		const base = this.#series.options();
		const model = buildScatterModel(this.#points, fullOptions(base, color ?? base.color, this.#own));
		if (model.duplicateIds) {
			this.#warnOnce('several points share an id, which pointById and hover cannot tell apart.');
		}
		if (model.xOutOfRange) {
			this.#warnOnce(`points with X beyond ±${MAX_X_MAGNITUDE} are not drawn.`);
		}
		if (model.xWidened) {
			this.#warnOnce('an X span below 1e-98 is widened.');
		}
		this.#model = model;
	}

	/** Has the chart autoscale and paint the new model (which may differ in its scales, not its slots). */
	#repaintModel(): void {
		this.#requestRepaint();
		this.#hover.scheduleNotification();
	}

	/** Repaints without changing the data: the chart redraws a series whose options change. */
	#requestRepaint(): void {
		this.#series.applyOptions({});
	}

	#warnOnce(message: string): void {
		if (!this.#warned.has(message)) {
			this.#warned.add(message);
			// eslint-disable-next-line no-console
			console.warn(`${WARNING}${message}`);
		}
	}

	/** The X mapping, or `null` once the series or its chart is removed: a removed chart must not be asked. */
	#liveXMapping(): XMapping | null {
		return this.#acts() ? this.#xAxis.xMapping() : null;
	}

	/** Whether points can be drawn and hovered: the series on a live chart, and visible. */
	#isSeriesVisible(): boolean {
		return this.attached() && this.#series.options().visible;
	}

	/** Where point `index` is drawn, or `null` when it is not drawn at all. */
	#pointInfo(index: number): ScatterPointInfo<TPoint> | null {
		const resolved = this.#model.resolved[index];
		const mapping = this.#xAxis.xMapping();
		if (resolved === undefined || !resolved.visible || mapping === null) {
			return null;
		}
		const x = xToCoordinate(mapping, resolved.x);
		const y = this.#series.priceToCoordinate(resolved.y);
		// The hovered point is drawn larger.
		const size = index === this.#hover.index() ? resolved.size + this.#paintOptions().hoveredSizeIncrease : resolved.size;
		const radius = size / 2;
		if (y === null || !isInPane(x, y, radius, this.#chart.timeScale().width(), this.#series.getPane().getHeight())) {
			return null;
		}
		const group = resolved.groupIndex >= 0 ? this.#model.groups[resolved.groupIndex] : null;
		return {
			objectId: resolved.id,
			point: this.#points[index],
			index,
			groupId: group !== null ? group.id : null,
			x,
			y,
			radius,
			color: resolved.color,
			opacity: resolved.opacity,
			shape: resolved.shape,
			hollow: resolved.hollow,
			strokeColor: strokeColorOf(resolved, this.#backgroundColor()),
			strokeWidth: cappedStrokeWidth(size, resolved.strokeWidth),
		};
	}

	readonly #autoscaleInfoProvider = (baseImplementation: () => AutoscaleInfo | null): AutoscaleInfo | null => {
		const scatter = (): AutoscaleInfo | null =>
			scatterAutoscaleInfo(baseImplementation(), this.#model, this.#own.scatter.yRange, this.#paintOptions());
		const user = this.#own.autoscale;
		return user !== undefined ? user(scatter) : scatter();
	};

	#afterDraw(): void {
		if (this.#acts()) {
			this.#xAxis.afterDraw();
			// A new price scale mode moves the points: checked when they move.
			const fills = this.#geometryCache.fills();
			if (fills !== this.#scaleModeCheckedAt) {
				this.#scaleModeCheckedAt = fills;
				this.#warnAboutScaleMode();
			}
		}
		// Of a removed chart, it notifies `null` once.
		this.#hover.notify();
	}

	/**
	 * Warns once when the price scale shows values relative to the first one
	 * in view: for a scatter series, the first slot of the X axis in view, not
	 * a point the user can see.
	 */
	#warnAboutScaleMode(): void {
		if (this.#warned.has(SCALE_MODE_WARNING)) {
			return;
		}
		const mode = this.#series.priceScale().options().mode;
		if (mode === PriceScaleMode.Percentage || mode === PriceScaleMode.IndexedTo100) {
			this.#warnOnce(SCALE_MODE_WARNING);
		}
	}
}
