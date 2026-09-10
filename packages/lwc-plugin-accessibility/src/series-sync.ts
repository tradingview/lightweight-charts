import { DataChangedScope, IPaneApi, IRange, Time } from 'lightweight-charts';

import { DescribeEnv, describeSeriesUpdate } from './describe';
import { AccessibilityPaneOptions } from './options';
import { PaneCursor } from './pane-cursor';
import { SeriesStats } from './series-data';
import { AnySeries } from './types';
import { PaneUpdates, UpdateAnnouncer } from './update-announcer';

/** What the series bookkeeping reads from, and calls back into, on the primitive. */
export interface SeriesSyncHost {
	pane: () => IPaneApi<Time> | null;
	options: () => AccessibilityPaneOptions;
	describeEnv: () => DescribeEnv;
	visibleRange: () => IRange<number> | null;
	hasFocus: () => boolean;
	cursor: PaneCursor;
	updates: PaneUpdates;
	/** The chart-level shared region, when one is in place. */
	announcer: () => UpdateAnnouncer | null;
	/** The set of series in the pane changed. */
	onSeriesChanged: () => void;
	/** The focused series' data changed while the pane is in use. */
	onActiveDataChanged: () => void;
}

/**
 * Keeps one pane's view of its series up to date: which series are there, what
 * their newest point and length are, and which of them changed since the last
 * announcement.
 *
 * Everything here is driven by `subscribeDataChanged`, so scrolling and zooming
 * do no data work at all. Streaming updates invalidate a shared snapshot; data
 * is read only for focused navigation or a debounced announcement.
 */
export class SeriesSync {
	private readonly _host: SeriesSyncHost;
	// Lazy snapshots shared by navigation and announcement statistics.
	private readonly _stats = new SeriesStats();
	// One `subscribeDataChanged` handler per series, so we react to real data
	// changes instead of polling and re-hashing on every redraw.
	private readonly _handlers = new Map<AnySeries, (scope: DataChangedScope) => void>();

	public constructor(host: SeriesSyncHost) {
		this._host = host;
	}

	/**
	 * Reconciles our subscriptions with the series currently in the pane. Cheap to
	 * call on every redraw: it only reads the already-allocated series handles and
	 * returns early unless the set of series changed. Actual data-content changes
	 * are delivered by the subscriptions instead.
	 */
	public sync(): void {
		const pane = this._host.pane();
		if (!pane) {
			return;
		}
		const current = pane.getSeries();
		const known = this._host.cursor.seriesList();
		if (current.length === known.length && current.every((series: AnySeries, index: number) => series === known[index])) {
			return;
		}
		for (const [series, handler] of this._handlers) {
			if (!current.includes(series)) {
				series.unsubscribeDataChanged(handler);
				this._handlers.delete(series);
				this._host.updates.forget(series);
				this._stats.forget(series);
			}
		}
		for (const series of current) {
			if (!this._handlers.has(series)) {
				const handler = (scope: DataChangedScope): void => this._handleDataChanged(series, scope);
				series.subscribeDataChanged(handler);
				this._handlers.set(series, handler);
			}
		}
		this._host.cursor.setSeriesList(current);
		this._host.onSeriesChanged();
	}

	/** One changed series' contribution to a data-update announcement. */
	public describeUpdate(series: AnySeries): string {
		const cursor = this._host.cursor;
		// Latest value and visible count reuse one reconciled snapshot.
		const range = this._host.options().dataScope === 'visible' ? this._host.visibleRange() : null;
		return describeSeriesUpdate(this._host.describeEnv(), {
			label: cursor.seriesLabel(series, cursor.seriesList().indexOf(series)),
			series,
			latest: this._stats.latest(series),
			scopedCount: this._stats.countInRange(series, range),
		});
	}

	public dispose(): void {
		for (const [series, handler] of this._handlers) {
			series.unsubscribeDataChanged(handler);
		}
		this._handlers.clear();
		this._stats.clear();
	}

	/**
	 * Fired by the library when a series' data actually changes (set/update) – not
	 * on scroll or zoom.
	 */
	private _handleDataChanged(series: AnySeries, scope: DataChangedScope): void {
		const cursor = this._host.cursor;
		const index = cursor.seriesList().indexOf(series);
		if (index < 0) {
			return;
		}
		this._stats.update(series, scope);
		if (index === cursor.activeSeriesIndex()) {
			if (this._host.hasFocus()) {
				cursor.applyDataChange(scope, this._stats.snapshot(series));
				this._host.onActiveDataChanged();
			} else {
				cursor.markStale();
			}
		}
		if (!this._host.options().announceDataUpdates) {
			return;
		}
		this._host.updates.markDirty(series);
		const announcer = this._host.announcer();
		if (announcer) {
			// Shared region: the announcer owns the single debounce timer and pulls
			// our summaries at flush time via the internal PaneLink.
			announcer.notifyDirty(this._host.updates);
		} else {
			this._host.updates.schedule();
		}
	}
}
