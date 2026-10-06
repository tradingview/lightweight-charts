import {
	AutoscaleInfo,
	AutoscaleInfoProvider,
	ColorType,
	Coordinate,
	CustomSeriesOptions,
	IChartApiBase,
	IPaneApi,
	ISeriesApi,
	Logical,
	LogicalRange,
	MouseEventParams,
	PriceScaleMode,
	SeriesPartialOptions,
	SeriesType,
	WhitespaceData,
} from 'lightweight-charts';
import { Delegate } from '@tradingview/lwc-toolkit/delegate';

import type { ScatterGroupInfo, ScatterPoint, ScatterPointInfo, ScatterSizeMapping, ScatterSlotData } from './data';
import { ScatterGeometryCache, XMapping, YToCoordinate, coordinateToX, isInPane, xToCoordinate } from './geometry';
import { hitTestScatter } from './hit-test';
import {
	ScatterHorzScaleBehavior,
	ScatterXAxisOwner,
	claimScatterXAxis,
	formatScatterX,
	isScatterHorzScaleBehavior,
	releaseScatterXAxis,
	setScatterXAxis,
} from './horz-scale-behavior';
import { cloneOptions, mergeOptions } from './merge';
import { ScatterModel, ScatterSlotItem, buildScatterModel, sameGrid, sameSlots } from './model';
import {
	ScatterGroup,
	ScatterSeriesOptions,
	ScatterSeriesPartialOptions,
	scatterOptionDefaults,
	scatterOptionKeys,
	underlyingSeriesDefaults,
} from './options';
import type { ScatterRenderOptions } from './renderer';
import { cappedStrokeWidth, mapSizeValue } from './size';
import { ResolvedScatterGroup, describeGroup, strokeColorOf } from './style';
import { ScatterSeriesView } from './view';
import {
	SlotGrid,
	TickLevel,
	XAxisGeometry,
	XAxisLabels,
	chooseXLabels,
	sameLevels,
	slotValue,
	stepValue,
	tickLevels,
} from './x-axis';

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
	 * array is copied, the points are not.
	 */
	setData(points: readonly TPoint[]): void;
	/** The points, as last set: a copy of the array, holding the points themselves. */
	data(): readonly TPoint[];
	/**
	 * Changes options. Nested objects are merged, arrays (`groups`,
	 * `baselines`, `palette`) and `xFormatter` are replaced, and an end of a
	 * range can be set back to `null`.
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
	 * edges). The series does it by itself when the domain changes, and after
	 * resizes unless the user scrolled or zoomed (when the host enables
	 * either); a user zooming out to the whole domain is back at the fit. Call
	 * it to return to the whole domain.
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
	 * point. When the series is removed, or its chart, a handler last given a
	 * point is given `null`, once.
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

type ScatterOnlyOptions = typeof scatterOptionDefaults;

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

/**
 * Two visible ranges this close, in slots, are the same: the chart's own
 * arithmetic does not return a range exactly as it was set.
 */
const RANGE_TOLERANCE = 1e-3;

/** Scatter options which change how the series is painted, but not its points or its slots. */
const PAINT_ONLY_KEYS: ReadonlySet<string> = new Set([
	'hoveredOpacity',
	'hoveredSizeIncrease',
	'hoveredRingWidth',
	'hoveredRingColor',
	'hoveredRingGap',
	'plotBorder',
]);

/**
 * Scatter options which change how the points look — the model is built
 * again — but neither the slots nor the X axis, which the chart keeps.
 */
const RESTYLE_KEYS: ReadonlySet<string> = new Set([
	'opacity',
	'pointSize',
	'pointSizeLimits',
	'shape',
	'strokeColor',
	'strokeWidth',
	'hollow',
	'palette',
	'sizeRange',
	'sizeDomain',
	'sizeScale',
]);

let measureContext: CanvasRenderingContext2D | null | undefined;

/** A context to measure text with, or `null` where there is none. */
function textMeasureContext(): CanvasRenderingContext2D | null {
	if (measureContext === undefined) {
		measureContext = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
	}
	return measureContext;
}

/**
 * Whether the user can move the X axis: scrolling or zooming switched on.
 *
 * The flags are those of the library's `TimeScale._isAllScalingAndScrollingDisabled`
 * (`src/model/time-scale.ts`), which decides whether the chart treats both
 * edges as fixed: keep the two lists the same when the library adds a flag.
 */
function canMoveXAxis(options: Readonly<ReturnType<IChartApiBase<number>['options']>>): boolean {
	const anyOn = (value: unknown, keys: readonly string[]): boolean => {
		if (typeof value === 'boolean') {
			return value;
		}
		const record = value as Record<string, unknown>;
		return keys.some((key: string) => {
			const flag = record[key];
			return typeof flag === 'object' && flag !== null ? (flag as { time?: boolean }).time === true : flag === true;
		});
	};
	return anyOn(options.handleScroll, ['mouseWheel', 'pressedMouseMove', 'horzTouchDrag', 'vertTouchDrag']) ||
		anyOn(options.handleScale, ['mouseWheel', 'pinch', 'axisPressedMouseMove', 'axisDoubleClickReset']);
}

function sameRange(a: LogicalRange, b: LogicalRange): boolean {
	return Math.abs(a.from - b.from) < RANGE_TOLERANCE && Math.abs(a.to - b.to) < RANGE_TOLERANCE;
}

function samePointInfo<TPoint extends ScatterPoint>(a: ScatterPointInfo<TPoint> | null, b: ScatterPointInfo<TPoint> | null): boolean {
	if (a === null || b === null) {
		return a === b;
	}
	return a.objectId === b.objectId &&
		a.point === b.point &&
		a.index === b.index &&
		a.groupId === b.groupId &&
		a.x === b.x &&
		a.y === b.y &&
		a.radius === b.radius &&
		a.color === b.color &&
		a.opacity === b.opacity &&
		a.shape === b.shape &&
		a.hollow === b.hollow &&
		a.strokeColor === b.strokeColor &&
		a.strokeWidth === b.strokeWidth;
}

/** The point under the pointer, as the chart reported it. */
interface PointerHover {
	/** Its `objectId`. */
	id: string;
	/** Its data index: the point actually hit, should several share the id. */
	index: number;
}

export class ScatterSeriesApiImpl<TPoint extends ScatterPoint> implements ScatterSeriesApi<TPoint>, ScatterXAxisOwner {
	private readonly _chart: IChartApiBase<number>;
	private readonly _behavior: ScatterHorzScaleBehavior;
	private readonly _series: ScatterUnderlyingSeries;
	private readonly _hoveredChanged: Delegate<ScatterPointInfo<TPoint> | null> = new Delegate();
	private readonly _geometryCache: ScatterGeometryCache = new ScatterGeometryCache();
	private readonly _hostLabelLength: number | undefined;
	private _scatterOptions: ScatterOnlyOptions;
	private _renderOptions: ScatterRenderOptions | null = null;
	private _userAutoscaleInfoProvider: AutoscaleInfoProvider | undefined;
	private _hitTestTolerance: number = underlyingSeriesDefaults.hitTestTolerance;
	private _points: readonly TPoint[] = [];
	private _model: ScatterModel<TPoint>;

	// What the chart was last given.
	private _appliedGrid: SlotGrid | null = null;
	private _appliedLevels: readonly TickLevel[] | null = null;
	private _appliedEnds: boolean = false;
	private _appliedSlots: readonly ScatterSlotItem[] | null = null;
	private _appliedFormatter: ((x: number) => string) | null = null;
	private _appliedLabelLength: number | null = null;
	private _appliedMargins: number = 0;
	// The chart's own fixed edges, kept while `xMargins` needs them freed.
	private _hostEdges: { fixLeftEdge: boolean; fixRightEdge: boolean } | null = null;

	// Label measuring.
	private _labelFont: string = '';
	private readonly _labelWidths: Map<string, number> = new Map();

	// Fitting the X domain.
	private _fittedRange: LogicalRange | null = null;
	private _rangeFollowsFit: boolean = true;
	private _width: number = 0;
	// Laying the axis out: set while the series itself changes the chart's
	// slots and range, whose events are not the user's.
	private _layingOut: boolean = false;
	private _layoutScheduled: boolean = false;
	private _fitScheduled: boolean = false;

	// Hover.
	private _pointerHovered: PointerHover | null = null;
	private _lastHit: { model: ScatterModel<TPoint>; index: number } | null = null;
	private _apiHoveredId: string | null = null;
	private _notified: ScatterPointInfo<TPoint> | null = null;
	private _notificationScheduled: boolean = false;
	private _drawnScheduled: boolean = false;

	private _duplicatesWarned: boolean = false;
	private _scaleModeWarned: boolean = false;
	private _removed: boolean = false;
	private _chartRemoved: boolean = false;

	public constructor(chart: IChartApiBase<number>, options: ScatterSeriesPartialOptions, paneIndex: number) {
		const behavior = chart.horzBehaviour();
		if (!isScatterHorzScaleBehavior(behavior)) {
			throw new Error(
				'A scatter series needs a chart with a numeric X axis: create it with createScatterChart, ' +
				'or with createChartEx and a ScatterHorzScaleBehavior from the same copy of this package ' +
				'(the standalone build and the main entry point do not mix).'
			);
		}
		claimScatterXAxis(behavior, this);
		this._chart = chart;
		this._behavior = behavior;
		this._hostLabelLength = chart.options().timeScale.tickMarkMaxCharacterLength;
		const { scatter, base } = this._splitOptions(options);
		this._scatterOptions = mergeOptions(scatterOptionDefaults, scatter);
		this._model = buildScatterModel<TPoint>([], this._fullOptions(underlyingSeriesDefaults.color));

		const view = new ScatterSeriesView({
			model: () => this._model,
			options: () => this._paintOptions(),
			backgroundColor: () => this._backgroundColor(),
			xMapping: () => this._xMapping(),
			hoveredIndex: () => this._hoveredIndex(),
			geometry: (model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate) =>
				this._geometryCache.geometry(model, mapping, yToCoordinate),
			hit: (model: ScatterModel, index: number | null) => {
				this._lastHit = index === null ? null : { model: model as ScatterModel<TPoint>, index };
			},
			drawn: this._onDrawn,
		});
		this._series = chart.addCustomSeries(
			view,
			{
				...base,
				autoscaleInfoProvider: this._autoscaleInfoProvider,
				// The chart falls back to hit testing the vertical extent of each slot
				// when the renderer reports no point, which would report the series as
				// hovered — with no objectId — in the empty space between points.
				// A tolerance this negative turns the fallback off; the series' own
				// `hitTestTolerance` is kept here and used by the renderer.
				hitTestTolerance: Number.NEGATIVE_INFINITY,
			},
			paneIndex
		);
		chart.subscribeCrosshairMove(this._onCrosshairMove);
		chart.timeScale().subscribeSizeChange(this._onSizeChange);
		chart.timeScale().subscribeVisibleLogicalRangeChange(this._onVisibleRangeChange);
		this._rebuild();
	}

	public setData(points: readonly TPoint[]): void {
		if (!this._isLive()) {
			return;
		}
		this._points = points.slice();
		this._rebuild();
	}

	public data(): readonly TPoint[] {
		// A copy: the series indexes into its own.
		return this._points.slice();
	}

	public applyOptions(options: ScatterSeriesPartialOptions): void {
		if (!this._isLive()) {
			return;
		}
		const { scatter, base, autoscaleChanged, toleranceChanged } = this._splitOptions(options);
		const scatterKeys = Object.keys(scatter);
		if (Object.keys(base).length > 0) {
			this._series.applyOptions(base);
		}
		if (scatterKeys.length > 0) {
			this._scatterOptions = mergeOptions(this._scatterOptions, scatter);
		}
		if (scatterKeys.length > 0 || toleranceChanged) {
			this._renderOptions = null;
		}
		if (scatterKeys.some((key: string) => !PAINT_ONLY_KEYS.has(key) && !RESTYLE_KEYS.has(key))) {
			this._rebuild();
		} else if (base.color !== undefined || scatterKeys.some((key: string) => RESTYLE_KEYS.has(key))) {
			this._rebuild(false);
		} else if (scatterKeys.length > 0 || autoscaleChanged) {
			this._requestRepaint();
		}
		// `visible` and the styles change what the hovered point is, or how it looks.
		this._scheduleHoveredNotification();
	}

	public options(): Readonly<ScatterSeriesOptions> {
		// A copy: changing it changes neither the series nor the defaults.
		return cloneOptions(this._fullOptions(this._series.options().color));
	}

	public series(): ScatterUnderlyingSeries {
		return this._series;
	}

	public groups(): readonly ScatterGroupInfo[] {
		const model = this._model;
		const background = this._backgroundColor();
		return model.groups.map((group: ResolvedScatterGroup) => describeGroup(group, model.groupPointCounts[group.index], background));
	}

	public setGroupVisible(groupId: string, visible: boolean): void {
		if (!this._isLive()) {
			return;
		}
		const declared = this._scatterOptions.groups;
		const position = declared.findIndex((group: ScatterGroup) => group.id === groupId);
		let next: ScatterGroup[];
		if (position !== -1) {
			if ((declared[position].visible !== false) === visible) {
				return;
			}
			next = declared.map((group: ScatterGroup, index: number) => (index === position ? { ...group, visible } : group));
		} else {
			const resolved = this._model.groups;
			const target = resolved.findIndex((group: ResolvedScatterGroup) => group.id === groupId);
			// An unknown group, or an undeclared one being shown: it is shown already.
			if (target === -1 || visible) {
				return;
			}
			// Declaring the group moves it among the declared ones. Declare the
			// undeclared groups before it too, so the order and the palette
			// colours stay as they are.
			next = declared.slice();
			for (const group of resolved.slice(0, target + 1)) {
				if (!group.declared) {
					next.push(group.id === groupId ? { id: groupId, visible: false } : { id: group.id });
				}
			}
		}
		this.applyOptions({ groups: next });
	}

	public xDomain(): ScatterXDomain {
		const grid = this._model.grid;
		return {
			min: slotValue(grid, 0),
			max: slotValue(grid, grid.count - 1),
			tickStep: stepValue(grid.tickStep),
		};
	}

	public fitXDomain(): void {
		if (!this._isLive()) {
			return;
		}
		const grid = this._model.grid;
		const timeScale = this._chart.timeScale();
		const width = timeScale.width();
		const first = timeScale.timeToIndex(slotValue(grid, 0), false);
		if (width <= 1 || first === null) {
			return;
		}
		// The chart puts logical index i at `width − (right − i + 0.5) × spacing − 1`
		// for a visible range ending at `right`. The first slot lands on the
		// margin m and the last one (n slots later) on `width − 1 − m` when the
		// spacing is (width − 1 − 2m) / n and the range ends m / spacing − 0.5
		// slots after the last slot; setVisibleLogicalRange sets the spacing to
		// width / (to − from + 1), hence `from`. With no margin, the ends of
		// the domain are the plot edges.
		const last = grid.count - 1;
		const margin = this._xMargin(width);
		const spacing = (width - 1 - 2 * margin) / last;
		const to = first + last - 0.5 + margin / spacing;
		const range = { from: to + 1 - width / spacing, to } as LogicalRange;
		this._fittedRange = range;
		this._rangeFollowsFit = true;
		timeScale.setVisibleLogicalRange(range);
	}

	public xToCoordinate(x: number): Coordinate | null {
		const mapping = Number.isFinite(x) ? this._liveXMapping() : null;
		return mapping === null ? null : (xToCoordinate(mapping, x) as Coordinate);
	}

	public coordinateToX(coordinate: number): number | null {
		const mapping = Number.isFinite(coordinate) ? this._liveXMapping() : null;
		return mapping === null || mapping.pxPerUnit === 0 ? null : coordinateToX(mapping, coordinate);
	}

	public sizeMapping(): ScatterSizeMapping | null {
		const scaling = this._model.sizeScaling;
		if (scaling === null) {
			return null;
		}
		return {
			domain: { ...scaling.domain },
			range: { ...scaling.range },
			scale: scaling.scale,
			// The function the points are sized with.
			sizeFor: (value: number): number => (Number.isFinite(value) ? mapSizeValue(value, scaling) : Number.NaN),
		};
	}

	public pointById(objectId: string): ScatterPointInfo<TPoint> | null {
		if (!this._isSeriesVisible()) {
			return null;
		}
		const index = this._model.idToIndex.get(objectId);
		return index === undefined ? null : this._pointInfo(index);
	}

	public hitTest(x: number, y: number): ScatterPointInfo<TPoint> | null {
		// Visibility first: it also tells a removed chart, which must not be asked for a mapping.
		if (!this._isSeriesVisible()) {
			return null;
		}
		const mapping = this._xMapping();
		if (mapping === null) {
			return null;
		}
		const model = this._model;
		const geometry = this._geometryCache.geometry(model, mapping, (price: number) => this._series.priceToCoordinate(price));
		const hit = hitTestScatter(
			geometry,
			x,
			y,
			this._hoveredIndex(),
			this._hitTestTolerance,
			this._paintOptions().hoveredSizeIncrease
		);
		return hit === null ? null : this._pointInfo(hit.index);
	}

	public hoveredPoint(): ScatterPointInfo<TPoint> | null {
		const index = this._hoveredIndex();
		return index === null || !this._isSeriesVisible() ? null : this._pointInfo(index);
	}

	public setHoveredPoint(objectId: string | null): void {
		if (!this._isLive() || objectId === this._apiHoveredId) {
			return;
		}
		this._apiHoveredId = objectId;
		this._requestRepaint();
		this._scheduleHoveredNotification();
	}

	public subscribeHoveredPointChange(handler: ScatterHoveredPointHandler<TPoint>): void {
		this._hoveredChanged.subscribe(handler);
	}

	public unsubscribeHoveredPointChange(handler: ScatterHoveredPointHandler<TPoint>): void {
		this._hoveredChanged.unsubscribe(handler);
	}

	public remove(): void {
		if (this._removed) {
			return;
		}
		const attachment = this._attachment();
		this._removed = true;
		const hovered = this._notified;
		this._notified = null;
		try {
			// A host tooltip learns that the point is gone, as when the pointer leaves it.
			if (hovered !== null) {
				this._hoveredChanged.fire(null);
			}
		} finally {
			this._hoveredChanged.destroy();
			releaseScatterXAxis(this._behavior, this);
			this._detach(attachment);
		}
	}

	/** Undoes on the chart what the series did to it, unless the chart is gone. */
	private _detach(attachment: 'attached' | 'detached' | 'disposed'): void {
		if (attachment === 'disposed') {
			// The chart was removed first (a host tearing down the chart before
			// the series): the series and the subscriptions went with it, and
			// the chart must not be asked to paint again.
			return;
		}
		try {
			this._chart.unsubscribeCrosshairMove(this._onCrosshairMove);
			this._chart.timeScale().unsubscribeSizeChange(this._onSizeChange);
			this._chart.timeScale().unsubscribeVisibleLogicalRangeChange(this._onVisibleRangeChange);
			if (attachment === 'attached') {
				this._chart.removeSeries(this._series);
			}
			if (this._appliedLabelLength !== null) {
				// `undefined` would be skipped by the merge; `0` means the default too.
				this._chart.applyOptions({ timeScale: { tickMarkMaxCharacterLength: this._hostLabelLength ?? 0 } });
			}
			if (this._hostEdges !== null) {
				this._chart.applyOptions({ timeScale: this._hostEdges });
				this._hostEdges = null;
			}
		} catch {
			// Nothing left to undo on a chart in the middle of being torn down.
		}
	}

	/**
	 * Whether the underlying series is still on the chart: a host may take it
	 * off with `chart.removeSeries(series.series())` rather than `remove()`.
	 * @internal
	 */
	public attached(): boolean {
		return !this._removed && this._attachment() === 'attached';
	}

	/**
	 * Where the underlying series is: on the chart, taken off it, or gone with
	 * the chart.
	 */
	private _attachment(): 'attached' | 'detached' | 'disposed' {
		if (this._isChartRemoved()) {
			return 'disposed';
		}
		const series = this._series as unknown as ISeriesApi<SeriesType, number>;
		return this._chart.panes().some((pane: IPaneApi<number>) => pane.getSeries().indexOf(series) !== -1)
			? 'attached'
			: 'detached';
	}

	/**
	 * Whether the chart was removed (`chart.remove()`), with or without the
	 * series: a removed chart has no panes (a live one always has one), and
	 * throws when asked for coordinates. Once removed, always removed.
	 */
	private _isChartRemoved(): boolean {
		if (!this._chartRemoved) {
			try {
				this._chartRemoved = this._chart.panes().length === 0;
			} catch {
				this._chartRemoved = true;
			}
		}
		return this._chartRemoved;
	}

	/** Whether the series still acts on its chart: neither was removed. */
	private _isLive(): boolean {
		return !this._removed && !this._isChartRemoved();
	}

	/**
	 * Cleans up after a series taken off the chart without `remove()`, once
	 * another scatter series claims the chart.
	 * @internal
	 */
	public release(): void {
		this.remove();
	}

	private _fullOptions(color: string): ScatterSeriesOptions {
		const base = this._series !== undefined ? this._series.options() : underlyingSeriesDefaults;
		return {
			...base,
			color,
			hitTestTolerance: this._hitTestTolerance,
			autoscaleInfoProvider: this._userAutoscaleInfoProvider,
			...this._scatterOptions,
		};
	}

	private _paintOptions(): Readonly<ScatterRenderOptions> {
		if (this._renderOptions === null) {
			const options = this._scatterOptions;
			const pixels = (value: number, fallback: number): number => (Number.isFinite(value) ? Math.max(0, value) : fallback);
			this._renderOptions = {
				hoveredOpacity: options.hoveredOpacity,
				hoveredSizeIncrease: pixels(options.hoveredSizeIncrease, 0),
				hoveredRingWidth: pixels(options.hoveredRingWidth, 0),
				hoveredRingColor: options.hoveredRingColor ?? null,
				hoveredRingGap: pixels(options.hoveredRingGap, scatterOptionDefaults.hoveredRingGap),
				plotBorder: options.plotBorder,
				baselines: options.baselines,
				hitTestTolerance: this._hitTestTolerance,
			};
		}
		return this._renderOptions;
	}

	/** The chart's background (the top of a gradient): the automatic ring colour of filled points. */
	private _backgroundColor(): string {
		const background = this._chart.options().layout.background;
		return background.type === ColorType.VerticalGradient ? background.topColor : background.color;
	}

	/** Splits options into the scatter ones, kept here, and the series ones, passed on. */
	private _splitOptions(options: ScatterSeriesPartialOptions): {
		scatter: Record<string, unknown>;
		base: SeriesPartialOptions<CustomSeriesOptions>;
		autoscaleChanged: boolean;
		toleranceChanged: boolean;
	} {
		const scatter: Record<string, unknown> = {};
		const base: Record<string, unknown> = {};
		let autoscaleChanged = false;
		let toleranceChanged = false;
		for (const [key, value] of Object.entries(options)) {
			if (scatterOptionKeys.has(key)) {
				scatter[key] = value;
			} else if (key === 'hitTestTolerance') {
				if (typeof value === 'number' && Number.isFinite(value)) {
					this._hitTestTolerance = Math.max(0, value);
					toleranceChanged = true;
				}
			} else if (key === 'autoscaleInfoProvider') {
				// Ours wraps the user's, which sees the scatter range as its base.
				this._userAutoscaleInfoProvider = value as AutoscaleInfoProvider | undefined;
				autoscaleChanged = true;
			} else {
				base[key] = value;
			}
		}
		return { scatter, base: base as SeriesPartialOptions<CustomSeriesOptions>, autoscaleChanged, toleranceChanged };
	}

	/**
	 * Builds the model again from the points and options.
	 *
	 * @param layOut - Whether the slots or the X axis may have changed, which
	 * the chart is then given; `false` for options that only style the points.
	 */
	private _rebuild(layOut: boolean = true): void {
		if (!this._isLive()) {
			return;
		}
		const model = buildScatterModel(this._points, this._fullOptions(this._series.options().color));
		if (model.duplicateIds && !this._duplicatesWarned) {
			this._duplicatesWarned = true;
			console.warn(
				'lwc-plugin-scatter-series: several points share an id. Give every point a unique id: ' +
				'pointById, setHoveredPoint and hoveredInfo.objectId cannot tell such points apart.'
			);
		}
		this._model = model;
		if (layOut) {
			this._layOutXAxis();
		}
		// The new model may differ in its scales but not in its slots (sizes,
		// baselines): have the chart autoscale and paint again.
		this._requestRepaint();
		this._scheduleHoveredNotification();
	}

	/**
	 * Gives the chart what it needs of the current model, and only what
	 * changed: the slots (weighed again when the grid or the label chain
	 * changed), the label distance, and the visible range — fitted again when
	 * the domain or the width changed, unless the user has scrolled or zoomed
	 * it. The range events the chart fires meanwhile are the series' own.
	 *
	 * @param widthChanged - Whether the plot was resized.
	 */
	private _layOutXAxis(widthChanged: boolean = false): void {
		const layingOut = this._layingOut;
		this._layingOut = true;
		try {
			this._layOutXAxisNow(widthChanged);
		} finally {
			this._layingOut = layingOut;
		}
	}

	private _layOutXAxisNow(widthChanged: boolean): void {
		const model = this._model;
		const grid = model.grid;
		const formatter = this._scatterOptions.xFormatter;
		const timeScale = this._chart.timeScale();
		const gridChanged = !sameGrid(this._appliedGrid, grid);
		const followsFit = this._followsFit();
		// Labels for the plot as it is about to be shown: fitted, or as the user
		// zoomed it (a new grid is always fitted).
		const labels = this._chooseLabels(grid, followsFit || gridChanged || this._fittedRange === null);
		const levels = labels !== null ? labels.levels : tickLevels(grid, grid.tickStep);
		const ends = labels !== null && labels.ends;
		const reweigh = gridChanged ||
			this._appliedLevels === null ||
			!sameLevels(this._appliedLevels, levels) ||
			ends !== this._appliedEnds;
		const marginChanged = this._scatterOptions.xMargins !== this._appliedMargins;
		this._appliedMargins = this._scatterOptions.xMargins;
		this._applyEdges();
		const refit = gridChanged || this._fittedRange === null || (followsFit && (reweigh || widthChanged || marginChanged));
		const userRange = !refit && reweigh ? timeScale.getVisibleLogicalRange() : null;

		// The behaviour weighs the time points as the slots are set, so it must
		// know the grid and the chain first.
		setScatterXAxis(this._behavior, { grid, levels, ends, formatter });
		const slots = model.slots as (ScatterSlotData | WhitespaceData<number>)[];
		if (reweigh) {
			this._setSlotsWeighedAgain(slots, grid);
		} else if (this._appliedSlots === null || !sameSlots(this._appliedSlots, model.slots)) {
			this._series.setData(slots);
		}
		this._appliedGrid = grid;
		this._appliedLevels = levels;
		this._appliedEnds = ends;
		this._appliedSlots = model.slots;
		this._applyLabelDistance(labels, formatter !== this._appliedFormatter);
		this._appliedFormatter = formatter;

		if (refit) {
			this.fitXDomain();
		} else if (userRange !== null) {
			// The chart keeps the range through the slots set again; should it not, the user's comes back.
			const range = timeScale.getVisibleLogicalRange();
			if (range === null || !sameRange(range, userRange)) {
				timeScale.setVisibleLogicalRange(userRange);
			}
		}
	}

	/**
	 * Sets the slots so that the chart weighs every time point again, with the
	 * grid and the label chain just given to the behaviour.
	 *
	 * The chart weighs the time points from the first one that changed on, and
	 * keeps the weights of the leading ones that stay. When the first slot
	 * stays, it is moved off by one slot for a moment, so that every point is
	 * weighed again. The data is never emptied: the time scale keeps its
	 * points, and the host its visible range — no `null` range, and none of an
	 * empty axis, reaches a host listening to range changes.
	 */
	private _setSlotsWeighedAgain(slots: (ScatterSlotData | WhitespaceData<number>)[], grid: SlotGrid): void {
		const applied = this._appliedSlots;
		if (applied !== null && applied.length > 0 && slots.length > 0 && applied[0].time === slots[0].time) {
			this._series.setData([{ ...slots[0], time: slotValue(grid, -1) }, ...slots.slice(1)]);
		}
		this._series.setData(slots);
	}

	/**
	 * The labels for the plot fitted to the domain, or as it is in view, or
	 * `null` before the chart knows its width.
	 *
	 * @param fitted - Whether to label the plot fitted to the domain, rather than as the user zoomed it.
	 */
	private _chooseLabels(grid: SlotGrid, fitted: boolean): XAxisLabels | null {
		const width = this._chart.timeScale().width();
		if (width <= 1 || grid.count < 2) {
			return null;
		}
		const fontSize = this._chart.options().layout.fontSize;
		const font = this._currentLabelFont();
		if (font !== this._labelFont || this._labelWidths.size > 10000) {
			this._labelFont = font;
			this._labelWidths.clear();
		}
		const state = { grid, levels: [], ends: false, formatter: this._scatterOptions.xFormatter };
		const context = textMeasureContext();
		const labelWidth = (slot: number): number => {
			const text = formatScatterX(state, slotValue(grid, slot));
			let size = this._labelWidths.get(text);
			if (size === undefined) {
				if (context !== null) {
					context.font = font;
					size = context.measureText(text).width;
				} else {
					size = text.length * fontSize * FALLBACK_CHARACTER_EM;
				}
				this._labelWidths.set(text, size);
			}
			return size;
		};
		return chooseXLabels(
			grid,
			this._labelGeometry(grid, width, fitted),
			labelWidth,
			{ gap: fontSize * LABEL_GAP_EM, minPitch: fontSize * LABEL_PITCH_EM }
		);
	}

	/** Where the slots are drawn: fitted to the plot, else as the time scale shows them now. */
	private _labelGeometry(grid: SlotGrid, width: number, fitted: boolean): XAxisGeometry {
		if (!fitted) {
			const mapping = this._xMapping();
			if (mapping !== null && mapping.pxPerUnit > 0) {
				return { spacing: mapping.pxPerUnit * stepValue(grid.step), origin: mapping.origin, width, zoomed: true };
			}
		}
		const margin = this._xMargin(width);
		return { spacing: (width - 1 - 2 * margin) / (grid.count - 1), origin: margin, width };
	}

	/** The font the time scale draws its labels in. */
	private _currentLabelFont(): string {
		const options = this._chart.options();
		const { fontSize, fontFamily } = options.layout;
		return `${options.timeScale.allowBoldLabels ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
	}

	/**
	 * Tells the time scale how far apart to keep the X labels, as the
	 * character count it takes. Applying the option also drops the chart's
	 * cached label texts, which a new formatter needs.
	 */
	private _applyLabelDistance(labels: XAxisLabels | null, force: boolean): void {
		const options = this._chart.options();
		// The chart's own conversion from characters to pixels.
		const pixelsPerCharacter = ((options.layout.fontSize + 4) * 5) / 8;
		const length = labels !== null ? labels.minDistance / pixelsPerCharacter : this._appliedLabelLength;
		if (length === null || (length === this._appliedLabelLength && !force)) {
			return;
		}
		this._appliedLabelLength = length;
		this._chart.applyOptions({ timeScale: { tickMarkMaxCharacterLength: length } });
	}

	/**
	 * `xMargins` needs room before the first slot and after the last one, which
	 * the chart refuses at a fixed edge (`fixLeftEdge` / `fixRightEdge`, on in a
	 * scatter chart by default). While margins are asked for, the series frees
	 * both edges — again whenever the host fixes one, keeping that as its
	 * setting; without margins, it gives the chart back the host's setting.
	 *
	 * @returns Whether it changed the chart's edges.
	 */
	private _applyEdges(): boolean {
		if (this._marginsNeedFreeEdges()) {
			const { fixLeftEdge, fixRightEdge } = this._chart.options().timeScale;
			if (!fixLeftEdge && !fixRightEdge) {
				return false;
			}
			const kept = this._hostEdges;
			this._hostEdges = {
				fixLeftEdge: fixLeftEdge || (kept !== null && kept.fixLeftEdge),
				fixRightEdge: fixRightEdge || (kept !== null && kept.fixRightEdge),
			};
			this._chart.applyOptions({ timeScale: { fixLeftEdge: false, fixRightEdge: false } });
			return true;
		}
		if (this._hostEdges !== null) {
			const edges = this._hostEdges;
			this._hostEdges = null;
			this._chart.applyOptions({ timeScale: edges });
			return true;
		}
		return false;
	}

	/** Whether `xMargins` asks for room past the ends of the domain. */
	private _marginsNeedFreeEdges(): boolean {
		const margin = this._scatterOptions.xMargins;
		return Number.isFinite(margin) && margin > 0;
	}

	/** Whether the host fixed an edge of the chart again while margins need them free. */
	private _edgesFixedAgain(): boolean {
		if (!this._marginsNeedFreeEdges()) {
			return false;
		}
		const { fixLeftEdge, fixRightEdge } = this._chart.options().timeScale;
		return fixLeftEdge || fixRightEdge;
	}

	/** The room kept at each end of the X domain for a plot `width` pixels wide. */
	private _xMargin(width: number): number {
		const margin = this._scatterOptions.xMargins;
		return Number.isFinite(margin) ? Math.min(Math.max(0, margin), (width - 1) / 4) : 0;
	}

	/** Whether the visible range is still the fitted one: the user did not scroll or zoom it. */
	private _followsFit(): boolean {
		return this._fittedRange === null || this._rangeFollowsFit || !canMoveXAxis(this._chart.options());
	}

	private _xMapping(): XMapping | null {
		const grid = this._model.grid;
		const timeScale = this._chart.timeScale();
		const start = slotValue(grid, 0);
		const first = timeScale.timeToIndex(start, false);
		if (first === null) {
			return null;
		}
		const origin = timeScale.logicalToCoordinate(first as unknown as Logical);
		const next = timeScale.logicalToCoordinate((first + 1) as unknown as Logical);
		if (origin === null || next === null) {
			return null;
		}
		return { start, origin, pxPerUnit: (next - origin) / stepValue(grid.step) };
	}

	/** The X mapping, or `null` once the series or its chart is removed: a removed chart must not be asked. */
	private _liveXMapping(): XMapping | null {
		return this._isLive() ? this._xMapping() : null;
	}

	/** Whether points can be drawn and hovered: the series on a live chart, and visible. */
	private _isSeriesVisible(): boolean {
		return this.attached() && this._series.options().visible;
	}

	/** Where point `index` is drawn, or `null` when it is not drawn at all. */
	private _pointInfo(index: number): ScatterPointInfo<TPoint> | null {
		const resolved = this._model.resolved[index];
		const mapping = this._xMapping();
		if (resolved === undefined || !resolved.visible || mapping === null) {
			return null;
		}
		const x = xToCoordinate(mapping, resolved.x);
		const y = this._series.priceToCoordinate(resolved.y);
		// The hovered point is drawn larger.
		const size = index === this._hoveredIndex() ? resolved.size + this._paintOptions().hoveredSizeIncrease : resolved.size;
		const radius = size / 2;
		if (y === null || !isInPane(x, y, radius, this._chart.timeScale().width(), this._series.getPane().getHeight())) {
			return null;
		}
		const group = resolved.groupIndex >= 0 ? this._model.groups[resolved.groupIndex] : null;
		return {
			objectId: resolved.id,
			point: this._points[index],
			index,
			groupId: group !== null ? group.id : null,
			x,
			y,
			radius,
			color: resolved.color,
			opacity: resolved.opacity,
			shape: resolved.shape,
			hollow: resolved.hollow,
			strokeColor: strokeColorOf(resolved, this._backgroundColor()),
			strokeWidth: cappedStrokeWidth(size, resolved.strokeWidth),
		};
	}

	/**
	 * Data index of the hovered point: under the pointer, else set through the
	 * API. A point is hovered only while it is drawn.
	 */
	private _hoveredIndex(): number | null {
		const model = this._model;
		const pointer = this._pointerHovered;
		if (pointer !== null) {
			const index = model.resolved[pointer.index]?.id === pointer.id ? pointer.index : model.idToIndex.get(pointer.id);
			if (index !== undefined && model.resolved[index].visible) {
				return index;
			}
		}
		if (this._apiHoveredId !== null) {
			const index = model.idToIndex.get(this._apiHoveredId);
			if (index !== undefined && model.resolved[index].visible) {
				return index;
			}
		}
		return null;
	}

	/**
	 * Notifies the hovered point after the chart's next paint. The chart
	 * applies a new visible range and price range on its next frame, so the
	 * frame callback is registered after the chart's own, which the change has
	 * already requested; it runs right after that paint. A change the chart
	 * paints is notified from the paint itself (see `_onDrawn`); this covers
	 * the ones it does not, such as hiding the series.
	 */
	private _scheduleHoveredNotification(): void {
		if (this._notificationScheduled) {
			return;
		}
		this._notificationScheduled = true;
		requestAnimationFrame(() => {
			this._notificationScheduled = false;
			this._notifyHovered();
		});
	}

	private _notifyHovered(): void {
		if (this._removed) {
			return;
		}
		// The usual case on every frame: nothing hovered, nothing to tell.
		if (this._notified === null && this._hoveredIndex() === null) {
			return;
		}
		const info = this.hoveredPoint();
		if (samePointInfo(info, this._notified)) {
			return;
		}
		this._notified = info;
		this._hoveredChanged.fire(info);
	}

	/** Repaints without changing the data: the chart redraws a series whose options change. */
	private _requestRepaint(): void {
		this._series.applyOptions({});
	}

	private readonly _autoscaleInfoProvider = (baseImplementation: () => AutoscaleInfo | null): AutoscaleInfo | null => {
		const scatter = (): AutoscaleInfo | null => this._autoscaleInfo(baseImplementation());
		const user = this._userAutoscaleInfoProvider;
		return user !== undefined ? user(scatter) : scatter();
	};

	/**
	 * The price range of the visible slots, widened to the horizontal
	 * baselines and pinned to `yRange`, with room for the largest point at an
	 * open end (the margins are in pixels) — as it is drawn when hovered.
	 */
	private _autoscaleInfo(base: AutoscaleInfo | null): AutoscaleInfo | null {
		const model = this._model;
		const yRange = this._scatterOptions.yRange;
		let min = base?.priceRange?.minValue ?? null;
		let max = base?.priceRange?.maxValue ?? null;
		for (const baseline of model.yBaselines) {
			min = min === null ? baseline.value : Math.min(min, baseline.value);
			max = max === null ? baseline.value : Math.max(max, baseline.value);
		}
		const fixedMin = yRange.min !== null && Number.isFinite(yRange.min) ? yRange.min : null;
		const fixedMax = yRange.max !== null && Number.isFinite(yRange.max) ? yRange.max : null;
		min = fixedMin ?? min;
		max = fixedMax ?? max;
		if (min === null || max === null) {
			return base;
		}
		if (min > max) {
			if (fixedMin !== null && fixedMax === null) {
				max = min;
			} else {
				min = max;
			}
		}
		// One pixel more than the radius, for the antialiased edge, and the
		// growth and the ring of a hovered point.
		const paint = this._paintOptions();
		const hoverReach = paint.hoveredSizeIncrease / 2 + (paint.hoveredRingWidth > 0 ? paint.hoveredRingGap + paint.hoveredRingWidth : 0);
		const radius = model.maxSize > 0 ? model.maxSize / 2 + hoverReach + 1 : 0;
		return {
			priceRange: { minValue: min, maxValue: max },
			margins: {
				above: fixedMax !== null ? 0 : Math.max(radius, base?.margins?.above ?? 0),
				below: fixedMin !== null ? 0 : Math.max(radius, base?.margins?.below ?? 0),
			},
		};
	}

	private readonly _onCrosshairMove = (param: MouseEventParams<number>): void => {
		const info = param.hoveredInfo;
		const id = info !== undefined && info.series === this._series && typeof info.objectId === 'string'
			? info.objectId
			: null;
		let next: PointerHover | null = null;
		if (id !== null) {
			// The renderer's hit test has just found the point: take its index,
			// which tells apart points sharing the id.
			const hit = this._lastHit;
			const index = hit !== null && hit.model === this._model && this._model.resolved[hit.index]?.id === id
				? hit.index
				: this._model.idToIndex.get(id);
			next = index !== undefined ? { id, index } : null;
		}
		const current = this._pointerHovered;
		if (next?.id !== current?.id || next?.index !== current?.index) {
			this._pointerHovered = next;
			this._scheduleHoveredNotification();
		}
	};

	/**
	 * After every paint: the hovered point may have moved with the scales, and
	 * the label font may have changed with the chart options. Runs once the
	 * paint is over, not in the middle of it.
	 */
	private readonly _onDrawn = (): void => {
		if (this._drawnScheduled) {
			return;
		}
		this._drawnScheduled = true;
		queueMicrotask(() => {
			this._drawnScheduled = false;
			if (this._isLive()) {
				// The host fixed an edge again while margins need them free: free
				// them, and fit the domain within the margins again.
				if (this._applyEdges() && this._followsFit()) {
					this.fitXDomain();
				}
				// The labels were measured in another font: measure them again.
				if (this._labelFont !== '' && this._labelFont !== this._currentLabelFont()) {
					this._layOutXAxis();
				}
				this._warnAboutScaleMode();
			}
			// Of a removed chart, it notifies `null` once.
			this._notifyHovered();
		});
	};

	/**
	 * Warns once when the price scale shows values relative to the first one
	 * in view: for a scatter series, that is the first slot of the X axis in
	 * view, not a point the user can see.
	 */
	private _warnAboutScaleMode(): void {
		if (this._scaleModeWarned) {
			return;
		}
		const mode = this._series.priceScale().options().mode;
		if (mode === PriceScaleMode.Percentage || mode === PriceScaleMode.IndexedTo100) {
			this._scaleModeWarned = true;
			console.warn(
				'lwc-plugin-scatter-series: percentage and indexed-to-100 price scales show Y relative to the first ' +
				'slot of the X axis in view, not to any point, which means nothing on a scatter plot. ' +
				'Use PriceScaleMode.Normal or PriceScaleMode.Logarithmic.'
			);
		}
	}

	private readonly _onSizeChange = (width: number): void => {
		if (width === this._width) {
			return;
		}
		this._width = width;
		// The width changes in the middle of a paint when the price scale grows
		// or shrinks. A range set right now would be merged into that paint's
		// own invalidation and lose to the range it already applied (verified on
		// 5.2), so lay the axis out again once the paint is over.
		queueMicrotask(() => {
			if (this._isLive()) {
				this._layOutXAxis(true);
			}
		});
	};

	/**
	 * Follows the range the chart shows: the fitted one, or one the user
	 * scrolled or zoomed (when the host lets the user move the axis). Zoomed
	 * out as far as the chart goes — at fixed edges, it stops a few pixels
	 * short of the fit — or further out than the margins, the whole domain is
	 * in view: that is the fit, which the series then sets exactly. Otherwise
	 * the labels are chosen again for the part in view.
	 */
	private readonly _onVisibleRangeChange = (range: LogicalRange | null): void => {
		if (range === null || this._fittedRange === null || this._layingOut || !this._isLive()) {
			return;
		}
		if (sameRange(range, this._fittedRange)) {
			this._rangeFollowsFit = true;
		} else if (this._edgesFixedAgain()) {
			// The chart moved the range to edges the host has just fixed: not the
			// user's doing. The next draw frees them and fits again (`_onDrawn`).
			return;
		} else {
			this._rangeFollowsFit = this._showsWholeDomain();
		}
		if (canMoveXAxis(this._chart.options())) {
			this._scheduleLayout(this._rangeFollowsFit && !sameRange(range, this._fittedRange));
		}
	};

	/**
	 * Whether the whole X domain is in view: both of its ends inside the plot,
	 * or inside the margins when there are some.
	 */
	private _showsWholeDomain(): boolean {
		const timeScale = this._chart.timeScale();
		const width = timeScale.width();
		const grid = this._model.grid;
		const left = timeScale.timeToCoordinate(slotValue(grid, 0));
		const right = timeScale.timeToCoordinate(slotValue(grid, grid.count - 1));
		const margin = this._xMargin(width);
		return left !== null && right !== null && left >= margin - 0.5 && right <= width - 1 - margin + 0.5;
	}

	/**
	 * Lays the axis out again once the chart is done with the range it just
	 * changed — never from within its event — fitting the domain first when
	 * asked to.
	 */
	private _scheduleLayout(fit: boolean): void {
		this._fitScheduled = this._fitScheduled || fit;
		if (this._layoutScheduled) {
			return;
		}
		this._layoutScheduled = true;
		queueMicrotask(() => {
			this._layoutScheduled = false;
			const fitNow = this._fitScheduled;
			this._fitScheduled = false;
			if (!this._isLive()) {
				return;
			}
			if (fitNow) {
				this.fitXDomain();
			}
			this._layOutXAxis();
		});
	}
}
