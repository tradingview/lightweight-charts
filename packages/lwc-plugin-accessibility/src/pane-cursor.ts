import { IChartApiBase, IRange, Time } from 'lightweight-charts';

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
import { AnySeries, SeriesDataPoint } from './types';

/** What the cursor reads from, and calls back into, on the owning primitive. */
export interface CursorHost {
	chart: () => IChartApiBase<Time> | null;
	options: () => AccessibilityPaneOptions;
	messages: () => AccessibilityMessages;
	describeEnv: () => DescribeEnv;
	announce: (message: string) => void;
	/** Called after the active point or series moved, so the focus ring follows. */
	onMoved: () => void;
}

/**
 * Where the keyboard is in the data: which series of the pane is active, which
 * of its points is focused, and the announcements that describe them.
 *
 * The active series' data is cached in `_points` because `series.data()` returns
 * a clone; the cache is refreshed only when the pane is actually in use (see
 * {@link markStale}).
 */
export class PaneCursor {
	private readonly _host: CursorHost;
	private _seriesList: AnySeries[] = [];
	private _points: readonly SeriesDataPoint[] = [];
	// Set when the active series changes while the pane is unfocused, so the
	// (O(n)-copy) re-read of `_points` is deferred until the pane is used again.
	private _stale = false;
	private _seriesIndex = 0;
	private _pointIndex = -1;

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

	/** Adopts the pane's current series, keeping the active index in range. */
	public setSeriesList(current: readonly AnySeries[]): void {
		this._seriesList = current.slice();
		if (this._seriesIndex >= this._seriesList.length) {
			this._seriesIndex = Math.max(0, this._seriesList.length - 1);
		}
		this.refreshActivePoints();
	}

	/** Re-reads the active series' data into the navigation cache. */
	public refreshActivePoints(): void {
		const series = this.activeSeries();
		this._points = series ? series.data() : [];
		this._stale = false;
		if (this._pointIndex >= this._points.length) {
			this._pointIndex = this._points.length - 1;
		}
	}

	public reset(): void {
		this._seriesList = [];
		this._points = [];
		this._stale = false;
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
				? firstVisibleIndex(this._points, this._visibleRange(), this._logicalIndexOf)
				: this._pointIndex + delta;
		// Navigation spans the whole series; setActivePoint pages the viewport so
		// the target stays on screen, giving keyboard users access to every point.
		this.setActivePoint(clamp(base, 0, this._points.length - 1));
	}

	public setActivePoint(index: number): void {
		this._pointIndex = index;
		this._scrollActiveIntoView();
		this._host.onMoved();
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
		this._host.announce(this._host.messages().seriesPosition({
			label: this.activeSeriesLabel(),
			position: next + 1,
			total: this._seriesList.length,
			point: this._pointIndex >= 0 ? ` ${this._describePoint(this._pointIndex)}` : '',
		}));
	}

	/**
	 * Zooms the time scale in / out (the `+` / `-` keys) by shrinking / growing the
	 * visible logical span, keeping the focused point where it is on screen.
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
		return describeSummary(this._host.describeEnv(), points, label, series);
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
		return describePoint(
			this._host.describeEnv(),
			this._points,
			index,
			this.activeSeriesLabel(),
			this.activeSeries()
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
}
