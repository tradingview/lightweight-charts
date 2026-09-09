import { DataChangedScope, IChartApiBase, IRange, Time } from 'lightweight-charts';

import { markerNote, priceLineNote } from './annotations';
import { DataTableModel, buildTableModel } from './data-table';
import { DescribeEnv, describePoint, describeSummary } from './describe';
import { AccessibilityMessages } from './messages';
import {
	clamp,
	firstVisibleIndex,
	nearestIndexByLogical,
	scrollIntoViewRange,
	visibleBounds,
	zoomRange,
} from './navigation';
import { AccessibilityPaneOptions } from './options';
import { normalizeValue } from './sonification';
import { AnySeries, SeriesDataPoint } from './types';

/** What the cursor reads from, and calls back into, on the owning primitive. */
export interface CursorHost {
	chart: () => IChartApiBase<Time> | null;
	options: () => AccessibilityPaneOptions;
	messages: () => AccessibilityMessages;
	describeEnv: () => DescribeEnv;
	announce: (message: string) => void;
	/** Index of the pane the cursor lives in, reported by `onFocusChange`. */
	paneIndex: () => number;
	/** Called after the active point or series moved, so the focus ring follows. */
	onMoved: () => void;
}

/**
 * Where the keyboard is in the data: which series of the pane is active, which
 * of its points is focused, and the announcements that describe them.
 *
 * The active series' data is cached in `_points` because `series.data()` returns
 * a clone; the cache is refreshed only when the pane is actually in use (see
 * {@link markStale}) and a streamed `'update'` patches it in place instead of
 * re-reading the whole series.
 */
export class PaneCursor {
	private readonly _host: CursorHost;
	private _seriesList: AnySeries[] = [];
	private _points: SeriesDataPoint[] = [];
	// Set when the active series changes while the pane is unfocused, so the
	// (O(n)-copy) re-read of `_points` is deferred until the pane is used again.
	private _stale = false;
	private _seriesIndex = 0;
	private _pointIndex = -1;
	// Value extremes of the active series, computed on demand for the
	// sonification hook and invalidated whenever `_points` changes.
	private _extremes: { min: number; max: number } | null = null;

	public constructor(host: CursorHost) {
		this._host = host;
	}

	public seriesList(): readonly AnySeries[] {
		return this._seriesList;
	}

	public seriesCount(): number {
		return this._seriesList.length;
	}

	public activeSeries(): AnySeries | null {
		return this._seriesList[this._seriesIndex] ?? null;
	}

	public activeSeriesIndex(): number {
		return this._seriesIndex;
	}

	public activePoint(): SeriesDataPoint | undefined {
		return this._points[this._pointIndex];
	}

	public activePointIndex(): number {
		return this._pointIndex;
	}

	public pointCount(): number {
		return this._points.length;
	}

	public isStale(): boolean {
		return this._stale;
	}

	public markStale(): void {
		this._stale = true;
	}

	/** Accessible label of `series`: the option, then its `title`, then `Series N`. */
	public seriesLabel(series: AnySeries, index: number): string {
		const options = this._host.options();
		if (options.seriesLabel) {
			return options.seriesLabel(series, index);
		}
		const title = series.options().title;
		return title.length > 0 ? title : this._host.messages().defaultSeriesLabel(index + 1);
	}

	public activeSeriesLabel(): string {
		const series = this.activeSeries();
		return series ? this.seriesLabel(series, this._seriesIndex) : '';
	}

	/** Adopts the pane's current series, keeping the *same* series active if it is still there. */
	public setSeriesList(current: readonly AnySeries[]): void {
		// By identity, not by index: removing a series before the active one
		// would otherwise silently move the focus to a different series.
		const active = this.activeSeries();
		this._seriesList = current.slice();
		const kept = active ? this._seriesList.indexOf(active) : -1;
		this._seriesIndex = kept >= 0 ? kept : clamp(this._seriesIndex, 0, Math.max(0, this._seriesList.length - 1));
		this.refreshActivePoints();
	}

	/** Re-reads the active series' data into the navigation cache. */
	public refreshActivePoints(): void {
		const series = this.activeSeries();
		this._points = series ? series.data().slice() : [];
		this._stale = false;
		this._extremes = null;
		if (this._pointIndex >= this._points.length) {
			this._pointIndex = this._points.length - 1;
		}
	}

	/** Refreshes the cache: 'update' can also change historical points or remove data. */
	public applyDataChange(_scope: DataChangedScope): void {
		this.refreshActivePoints();
	}

	public reset(): void {
		this._seriesList = [];
		this._points = [];
		this._stale = false;
		this._extremes = null;
		this._seriesIndex = 0;
		this._pointIndex = -1;
	}

	// region Navigation -----------------------------------------------------------------

	public movePoint(delta: number): void {
		if (this._points.length === 0) {
			return;
		}
		const base =
			this._pointIndex < 0
				? firstVisibleIndex(this._points, this._visibleRange(), this._logicalIndexOf) + (delta > 0 ? 0 : delta)
				: this._pointIndex + delta;
		// Navigation spans the whole series; setActivePoint pages the viewport so
		// the target stays on screen, giving keyboard users access to every point.
		this.setActivePoint(clamp(base, 0, this._points.length - 1));
	}

	public setActivePoint(index: number): void {
		this._pointIndex = index;
		this._scrollActiveIntoView();
		this._host.onMoved();
		this._syncCrosshair();
		this._sonify();
		this._notifyFocusChange();
		this._host.announce(this._describePoint(index));
	}

	public setFirstPoint(): void {
		if (this._points.length > 0) {
			this.setActivePoint(0);
		}
	}

	public setLastPoint(): void {
		if (this._points.length > 0) {
			this.setActivePoint(this._points.length - 1);
		}
	}

	public moveSeries(delta: number): void {
		if (this._seriesList.length <= 1) {
			return;
		}
		const next = clamp(this._seriesIndex + delta, 0, this._seriesList.length - 1);
		if (next === this._seriesIndex) {
			return;
		}
		// Series in a pane need not share timestamps (e.g. a moving average that
		// starts later), so carry the focused *time* across, not the raw index:
		// the nearest point in time is selected in the new series.
		const previousPoint = this._points[this._pointIndex];
		const targetLogical = previousPoint ? this._logicalIndexOf(previousPoint) : null;
		this._seriesIndex = next;
		this.refreshActivePoints();
		if (this._pointIndex >= 0 && this._points.length > 0) {
			this._pointIndex = targetLogical !== null
				? nearestIndexByLogical(this._points, targetLogical, this._logicalIndexOf)
				: clamp(this._pointIndex, 0, this._points.length - 1);
			this._scrollActiveIntoView();
		}
		this._host.onMoved();
		this._syncCrosshair();
		this._notifyFocusChange();
		this._host.announce(this._host.messages().seriesPosition({
			label: this.activeSeriesLabel(),
			position: next + 1,
			total: this._seriesList.length,
			point: this._pointIndex >= 0 ? ` ${this._describePoint(this._pointIndex)}` : '',
		}));
	}

	/**
	 * Zooms the time scale in / out (the `+` / `-` keys) by shrinking / growing the
	 * visible logical span, keeping the focused point where it is on screen. The
	 * new range is announced, so a screen-reader user knows what the key did.
	 */
	public zoom(zoomIn: boolean): void {
		const timeScale = this._host.chart()?.timeScale();
		if (!timeScale) {
			return;
		}
		const options = this._host.options();
		const point = this.activePoint();
		const range = zoomRange(
			timeScale.getVisibleLogicalRange(),
			point ? this._logicalIndexOf(point) : null,
			zoomIn,
			options.zoomStep,
			options.minZoomSpan
		);
		if (!range) {
			return;
		}
		timeScale.setVisibleLogicalRange(range);
		this._host.onMoved();
		this.announceVisibleRange();
	}

	/** Announces what is currently on screen (`+` / `-`, and pane entry when opted in). */
	public announceVisibleRange(): void {
		const message = this.visibleRangeMessage();
		if (message.length > 0) {
			this._host.announce(message);
		}
	}

	/**
	 * The "showing N points, from … to …" message for the current viewport, or
	 * `''` when the active series has nothing on screen. Derived from the cached
	 * points rather than `timeScale.getVisibleRange()`, which only catches up on
	 * the next redraw.
	 */
	public visibleRangeMessage(): string {
		const bounds = visibleBounds(this._points, this._visibleRange(), this._logicalIndexOf);
		if (!bounds) {
			return '';
		}
		const env = this._host.describeEnv();
		return this._host.messages().visibleRange({
			from: env.formatTime(this._points[bounds.from].time),
			to: env.formatTime(this._points[bounds.to].time),
			count: bounds.to - bounds.from + 1,
		});
	}

	// region Descriptions ---------------------------------------------------------------

	/** The points a summary should describe, narrowed to the `dataScope` option. */
	public scopedPoints(points: readonly SeriesDataPoint[] = this._points): readonly SeriesDataPoint[] {
		if (this._host.options().dataScope !== 'visible') {
			return points;
		}
		// A viewport scrolled fully past the data is an empty scope, not the
		// whole series.
		const bounds = visibleBounds(points, this._visibleRange(), this._logicalIndexOf);
		return bounds ? points.slice(bounds.from, bounds.to + 1) : [];
	}

	/** The `Enter` / `Space` summary of the active series. */
	public describe(): string {
		const label = this.activeSeriesLabel();
		const series = this.activeSeries();
		const points = this.scopedPoints();
		const options = this._host.options();
		if (options.describeChart) {
			return options.describeChart({ points, series, label, scope: options.dataScope });
		}
		const env = this._host.describeEnv();
		const notes = options.announcePriceLines
			? priceLineNote(env.messages, series, (value: number) => env.formatValue(value, series))
			: '';
		return describeSummary(env, points, label, series, notes);
	}

	/** The "view as table" model for the active series' scoped points. */
	public tableModel(): DataTableModel {
		return buildTableModel(this._host.describeEnv(), {
			points: this.scopedPoints(),
			series: this.activeSeries(),
			label: this.activeSeriesLabel(),
			maxRows: this._host.options().tableMaxRows,
		});
	}

	/**
	 * Maps a data point to its index on the chart's shared time scale, which need
	 * not match the series' own data indices (a series can start later).
	 */
	private _logicalIndexOf = (point: SeriesDataPoint): number | null =>
		this._host.chart()?.timeScale().timeToIndex(point.time, true) ?? null;

	private _visibleRange(): IRange<number> | null {
		return this._host.chart()?.timeScale().getVisibleLogicalRange() ?? null;
	}

	private _describePoint(index: number): string {
		const env = this._host.describeEnv();
		const series = this.activeSeries();
		const point = this._points[index];
		const markers = series && point ? this._host.options().markers?.(series) : undefined;
		return describePoint(
			env,
			this._points,
			index,
			this.activeSeriesLabel(),
			series,
			markers && point ? markerNote(env.messages, markers, point.time) : ''
		);
	}

	/**
	 * Pages the visible logical range so the active point stays on screen. Runs for
	 * every navigation step, so the arrow / Page / Home / End keys can traverse the
	 * whole series even when only part of it is visible.
	 */
	private _scrollActiveIntoView(): void {
		const timeScale = this._host.chart()?.timeScale();
		if (!timeScale || this._points.length === 0) {
			return;
		}
		const range = scrollIntoViewRange(
			this._points,
			this._pointIndex,
			timeScale.getVisibleLogicalRange(),
			this._logicalIndexOf
		);
		if (range) {
			timeScale.setVisibleLogicalRange(range);
		}
	}

	/** Moves the chart's crosshair onto the focused point (opt-in `syncCrosshair`). */
	private _syncCrosshair(): void {
		const chart = this._host.chart();
		const series = this.activeSeries();
		const point = this.activePoint();
		if (!this._host.options().syncCrosshair || !chart || !series || !point) {
			return;
		}
		const value = this._host.describeEnv().value(point, series);
		if (value !== undefined) {
			chart.setCrosshairPosition(value, point.time, series);
		}
	}

	private _notifyFocusChange(): void {
		const onFocusChange = this._host.options().onFocusChange;
		if (!onFocusChange) {
			return;
		}
		const series = this.activeSeries();
		const point = this.activePoint();
		onFocusChange({
			paneIndex: this._host.paneIndex(),
			series,
			seriesIndex: this._seriesIndex,
			point,
			pointIndex: this._pointIndex,
			value: this._host.describeEnv().value(point, series),
		});
	}

	/** Hands the focused point to the sonification hook (opt-in `onSonify`). */
	private _sonify(): void {
		const onSonify = this._host.options().onSonify;
		const point = this.activePoint();
		if (!onSonify || !point) {
			return;
		}
		const series = this.activeSeries();
		const value = this._host.describeEnv().value(point, series);
		const { min, max } = this._valueExtremes();
		onSonify({
			value,
			min,
			max,
			normalized: value === undefined ? 0.5 : normalizeValue(value, min, max),
			index: this._pointIndex,
			total: this._points.length,
			time: point.time,
		});
	}

	/** Value extremes of the whole active series, cached until its data changes. */
	private _valueExtremes(): { min: number; max: number } {
		if (this._extremes === null) {
			const series = this.activeSeries();
			const value = this._host.describeEnv().value;
			let min = Number.POSITIVE_INFINITY;
			let max = Number.NEGATIVE_INFINITY;
			for (const point of this._points) {
				const current = value(point, series);
				if (current === undefined) {
					continue;
				}
				min = Math.min(min, current);
				max = Math.max(max, current);
			}
			this._extremes = Number.isFinite(min) ? { min, max } : { min: 0, max: 0 };
		}
		return this._extremes;
	}
}
