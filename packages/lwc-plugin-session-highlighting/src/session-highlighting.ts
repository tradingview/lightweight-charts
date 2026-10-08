import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';
import {
	DataChangedScope,
	IPrimitivePaneView,
	SeriesAttachedParameter,
	Time,
} from 'lightweight-charts';

import {
	Highlight,
	SessionHighlighter,
	colorsForTimes,
	shrinkTo,
	updateLastColor,
	visibleDataRange,
} from './highlights.js';
import { SessionHighlightingOptions, mergeOptions, resolveOptions } from './options.js';
import { HighlightColumn, SessionHighlightingPaneView, SessionHighlightingState } from './renderer.js';

export { defaultOptions, type SessionHighlightingOptions } from './options.js';
export type { SessionHighlighter } from './highlights.js';

/**
 * Shades the background behind each bar of the attached series with the
 * colour a highlighter function returns for the bar's time. Attach it with
 * `series.attachPrimitive(highlighting)`.
 *
 * The highlighter is asked once per bar when data is set and once for the last
 * bar when an incremental update appends or replaces it; popping bars does not
 * ask it, and a historical update that removes a bar asks it for every bar
 * again. Only the bars on screen are drawn.
 */
export class SessionHighlighting extends PluginBase {
	private readonly _paneViews: readonly SessionHighlightingPaneView[];
	private _highlighter: SessionHighlighter;
	private _options: SessionHighlightingOptions;
	private _highlights: Highlight[] = [];
	private _attached = false;

	public constructor(highlighter: SessionHighlighter, options?: Partial<SessionHighlightingOptions>) {
		super();
		this._highlighter = highlighter;
		this._options = resolveOptions(options);
		this._paneViews = [new SessionHighlightingPaneView(this._state([]))];
	}

	public override attached(param: SeriesAttachedParameter<Time>): void {
		super.attached(param);
		this._attached = true;
		this._recolorAll();
	}

	public override detached(): void {
		this._attached = false;
		this._highlights = [];
		super.detached();
	}

	/** Called by the chart before it paints, so a `requestUpdate()` is enough to get here. */
	public updateAllViews(): void {
		const state = this._state(this._attached ? this._visibleColumns() : []);
		this._paneViews.forEach(view => view.update(state));
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews;
	}

	/** The current options, with every default filled in. */
	public options(): Readonly<SessionHighlightingOptions> {
		return { ...this._options };
	}

	/** Changes any subset of the options. An option left out is not changed. */
	public applyOptions(options: Partial<SessionHighlightingOptions>): void {
		this._options = mergeOptions(this._options, options);
		this.requestUpdate();
	}

	/** Replaces the highlighter and recolours every bar with it. */
	public setHighlighter(highlighter: SessionHighlighter): void {
		this._highlighter = highlighter;
		if (this._attached) {
			this._recolorAll();
		}
	}

	protected override dataUpdated(scope: DataChangedScope): void {
		if (scope === 'update') {
			const data = this.series.data();
			const last = data[data.length - 1];
			if (last === undefined) {
				this._highlights = [];
			} else {
				const patched = data.length < this._highlights.length
					? shrinkTo(this._highlights, data.length, last.time)
					: updateLastColor(this._highlights, data.length, last.time, this._highlighter);
				if (!patched) {
					this._recolorAll();
					return;
				}
			}
			this.requestUpdate();
			return;
		}
		this._recolorAll();
	}

	private _recolorAll(): void {
		this._highlights = colorsForTimes(this.series.data().map(item => item.time), this._highlighter);
		this.requestUpdate();
	}

	/** The columns for the bars inside the visible range, skipping unshaded ones. */
	private _visibleColumns(): HighlightColumn[] {
		const timeScale = this.chart.timeScale();
		const highlights = this._highlights;
		const { from, to } = visibleDataRange(
			highlights.length,
			index => timeScale.timeToIndex(highlights[index].timestamp, true) ?? 0,
			timeScale.getVisibleLogicalRange()
		);
		const columns: HighlightColumn[] = [];
		for (let index = from; index < to; index++) {
			const highlight = highlights[index];
			if (highlight.color === '') {
				continue;
			}
			const x = timeScale.timeToCoordinate(highlight.timestamp);
			if (x !== null) {
				columns.push({ x, color: highlight.color });
			}
		}
		return columns;
	}

	private _state(columns: readonly HighlightColumn[]): SessionHighlightingState {
		return {
			columns,
			barSpacing: this._attached ? this.chart.timeScale().options().barSpacing : 0,
			options: this._options,
		};
	}
}
