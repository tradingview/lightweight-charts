import { paneContentElement } from '@tradingview/lwc-toolkit/dom/pane-element';
import { PanePluginBase } from '@tradingview/lwc-toolkit/pane-plugin-base';
import {
	IChartApiBase,
	IPaneApi,
	IRange,
	PaneAttachedParameter,
	Time,
} from 'lightweight-charts';

import { DescribeEnv, extractRange, extractValue } from './describe';
import { PaneLayer, PaneLayerView } from './dom/pane-dom';
import { Formatters } from './format';
import { FocusRingStyle, focusRingCoordinate } from './focus-ring';
import { HighContrastWatcher, resolveHighContrast } from './high-contrast';
import { AccessibilityCommand, commandForKey } from './keyboard';
import { AccessibilityMessages, defaultMessages, mergeMessages } from './messages';
import { AccessibilityPaneOptions, PointRange, defaultPaneOptions, definedOptions } from './options';
import { createCommands } from './pane-commands';
import { PaneCursor } from './pane-cursor';
import { SeriesSync } from './series-sync';
import { AnySeries, SeriesDataPoint } from './types';
import { ControllerHooks, PaneUpdates, UpdateAnnouncer, paneLinks } from './update-announcer';

/** How many animation frames the layer waits for its pane widget to appear. */
const MAX_INIT_ATTEMPTS = 60;

/**
 * AccessibilityPlugin – a pane primitive that adds a semantic accessibility
 * layer to one pane of a Lightweight Charts™ chart.
 *
 * Most applications should use {@link addAccessibilityPlugin}, which attaches
 * one primitive per pane. Each pane gets an independent, labelled,
 * keyboard-focusable semantic layer. Within a pane the plugin provides:
 *
 * - An ARIA-described overlay (the pane's canvas is hidden from assistive
 *   technology with `aria-hidden`, and table scaffolding is presentational).
 * - Keyboard navigation: the left/right arrows move between data points, and
 *   the up/down arrows switch between the series in the pane.
 * - `aria-live` announcements of the focused point, series changes, on-demand
 *   summaries and background data updates.
 * - A "view as table" panel (`T`), the WCAG text alternative for the chart.
 * - An optional visible focus indicator that stays synchronised with the canvas
 *   as the user scrolls or zooms.
 *
 * To keep the DOM lightweight regardless of the number of bars, the plugin uses
 * an "active-point-only" strategy: it never mirrors every data point into the
 * DOM, rendering only a small fixed set of nodes per pane (a semantic overlay, a
 * live region, a description, a focus indicator and an optional shortcuts
 * overlay). Keyboard navigation always covers the whole series; the default
 * `dataScope: 'visible'` keeps the spoken summaries scoped to the viewport on
 * large data sets.
 */
export class AccessibilityPlugin extends PanePluginBase<Time> {
	private _options: AccessibilityPaneOptions;
	private _messages: AccessibilityMessages;
	// Only used to find the pane before the layer exists; afterwards the pane is
	// identified by the row that actually hosts the layer.
	private readonly _initialPaneIndex: number;
	private _isAttached = false;
	private _layer: PaneLayer | null = null;

	private readonly _formatters: Formatters;
	private readonly _cursor: PaneCursor;
	private readonly _updates: PaneUpdates;
	private readonly _series: SeriesSync;
	/** What each key does; built once the cursor and the option accessors exist. */
	private readonly _commands: Record<AccessibilityCommand, () => void>;
	// When attached via addAccessibilityPlugin, data-update announcements are
	// routed through one shared region instead of this pane's own polite region.
	private _updateAnnouncer: UpdateAnnouncer | null = null;
	private _controller: ControllerHooks | null = null;

	private _shortcutsOpen = false;
	private _hasFocus = false;
	private _built = false;
	private _initAttempts = 0;
	private _initHandle: ReturnType<typeof requestAnimationFrame> | null = null;
	// Resolved high-contrast state, plus the OS media queries that drive `'auto'`.
	private _highContrast = false;
	private _highContrastInitialised = false;
	private _contrastWatcher: HighContrastWatcher | null = null;
	// The last handler notified, so a newly supplied one is called with the
	// current state instead of waiting for the next change.
	private _contrastListener: ((enabled: boolean) => void) | undefined = undefined;

	/**
	 * @param options - per-pane options; see {@link AccessibilityPaneOptions}.
	 * @param paneIndex - index of the pane this primitive is attached to. Only
	 * needed when attaching manually to a pane other than the first;
	 * {@link addAccessibilityPlugin} passes it automatically.
	 */
	public constructor(options: Partial<AccessibilityPaneOptions> = {}, paneIndex: number = 0) {
		super();
		this._options = { ...defaultPaneOptions, ...definedOptions(options) };
		this._messages = mergeMessages(defaultMessages, this._options.messages);
		this._initialPaneIndex = paneIndex;
		this._formatters = new Formatters(() => ({
			chart: this._chartOrNull(),
			options: this._options,
			messages: this._messages,
		}));
		this._cursor = new PaneCursor({
			chart: (): IChartApiBase<Time> | null => this._chartOrNull(),
			options: (): AccessibilityPaneOptions => this._options,
			messages: (): AccessibilityMessages => this._messages,
			describeEnv: (): DescribeEnv => this._describeEnv(),
			announce: (message: string): void => this._announce(message),
			paneIndex: (): number => this._paneIndex(),
			onMoved: (): void => this._positionIndicator(),
		});
		this._updates = new PaneUpdates({
			config: () => ({
				enabled: this._options.announceDataUpdates,
				debounceMs: this._options.updateDebounceMs,
				maxSeries: this._options.updateMaxSeries,
				messages: this._messages,
			}),
			seriesOrder: (): readonly AnySeries[] => this._cursor.seriesList(),
			describe: (series: AnySeries): string => this._series.describeUpdate(series),
			write: (message: string): void => this._announceStatus(message),
		});
		this._series = new SeriesSync({
			pane: (): IPaneApi<Time> | null => this._pane(),
			options: (): AccessibilityPaneOptions => this._options,
			describeEnv: (): DescribeEnv => this._describeEnv(),
			visibleRange: (): IRange<number> | null =>
				this._chartOrNull()?.timeScale().getVisibleLogicalRange() ?? null,
			hasFocus: (): boolean => this._hasFocus,
			cursor: this._cursor,
			updates: this._updates,
			announcer: (): UpdateAnnouncer | null => this._updateAnnouncer,
			onSeriesChanged: (): void => {
				this._render();
				this._positionIndicator();
			},
			onActiveDataChanged: (): void => this._positionIndicator(),
		});
		this._commands = createCommands({
			cursor: this._cursor,
			layer: (): PaneLayer | null => this._layer,
			options: (): AccessibilityPaneOptions => this._options,
			messages: (): AccessibilityMessages => this._messages,
			announce: (message: string): void => this._announce(message),
			highContrast: (): boolean => this._highContrast,
			shortcutsOpen: (): boolean => this._shortcutsOpen,
			setShortcutsOpen: (open: boolean): void => {
				this._shortcutsOpen = open;
			},
			render: (): void => this._render(),
		});
		// Internal coordination is registered off the public surface (see PaneLink).
		paneLinks.set(this, {
			attachAnnouncer: (announcer: UpdateAnnouncer | null): void => this._attachAnnouncer(announcer),
			attachController: (hooks: ControllerHooks | null): void => {
				this._controller = hooks;
			},
			source: this._updates,
		});
	}

	// region IPanePrimitive lifecycle ---------------------------------------------------

	public attached(param: PaneAttachedParameter<Time>): void {
		super.attached(param);
		this._isAttached = true;
		this._tryInit();
	}

	public detached(): void {
		this._updates.dispose();
		this._series.dispose();
		// The announcer itself is owned and disposed by addAccessibilityPlugin;
		// here we just drop our reference to it.
		this._updateAnnouncer = null;
		if (this._initHandle !== null) {
			cancelAnimationFrame(this._initHandle);
			this._initHandle = null;
		}
		const layer = this._layer;
		if (layer) {
			layer.container.removeEventListener('keydown', this._handleKeyDown);
			layer.container.removeEventListener('focusin', this._handleFocusIn);
			layer.container.removeEventListener('focusout', this._handleFocusOut);
			layer.host.removeEventListener('pointerdown', this._handlePointerDown);
			layer.remove();
		}
		this._contrastWatcher?.dispose();
		this._contrastWatcher = null;
		this._cursor.reset();

		this._isAttached = false;
		this._layer = null;
		this._shortcutsOpen = false;
		this._highContrast = false;
		this._highContrastInitialised = false;
		this._contrastListener = undefined;
		this._built = false;
		this._initAttempts = 0;
		// Tell the controller (if any) before releasing the chart, so it can drop
		// this pane from its list when the library detached us.
		const controller = this._controller;
		this._controller = null;
		super.detached();
		controller?.detached();
	}

	/**
	 * Called by the library whenever the viewport changes (scroll / zoom / resize)
	 * and on every redraw. We use it to keep the focus indicator aligned with the
	 * canvas and to reconcile our per-series data subscriptions. Data *content*
	 * changes are handled by those subscriptions, so this path never reads or
	 * hashes bar data and stays cheap during scrolling and zooming.
	 */
	public updateAllViews(): void {
		// A cheap pane-count check, so panes added or removed at runtime are picked
		// up by the controller without a full teardown.
		this._controller?.sync();
		if (!this._built) {
			this._tryInit();
			return;
		}
		this._positionIndicator();
		this._series.sync();
	}

	// region Options --------------------------------------------------------------------

	public applyOptions(options: Partial<AccessibilityPaneOptions>): void {
		// An explicit `undefined` must not erase the current value.
		this._options = { ...this._options, ...definedOptions(options) };
		// Re-merge from defaultMessages so repeated partial overrides compose
		// against English rather than each other.
		this._messages = mergeMessages(defaultMessages, this._options.messages);
		this._render();
		this._positionIndicator();
		// Re-resolve in case `highContrast` changed; _render above has already
		// re-styled the overlay in case `showShortcuts` / `messages` did.
		this._refreshHighContrast();
	}

	public options(): Readonly<AccessibilityPaneOptions> {
		return this._options;
	}

	public focus(): void {
		this._layer?.container.focus();
	}

	/**
	 * A freshly created pane may not have its HTML element yet. The pane widget
	 * is built by the next redraw, so request one – the resulting updateAllViews
	 * retries this init. The animation-frame fallback covers the window in which
	 * the chart is still processing the invalidation, and is cancelled on detach.
	 */
	private _tryInit(): void {
		this._initHandle = null;
		if (this._built || !this._isAttached) {
			return;
		}
		const pane = this._pane();
		const paneElement = pane?.getHTMLElement() ?? null;
		const paneContent = pane ? paneContentElement(pane) : null;
		if (!paneElement || !paneContent) {
			this.requestUpdate();
			if (this._initAttempts++ < MAX_INIT_ATTEMPTS) {
				this._initHandle = requestAnimationFrame(() => this._tryInit());
			}
			return;
		}
		this._built = true;

		// A shared announcer already in place owns the single chart-level polite
		// region, so this pane does not build its own.
		this._layer = new PaneLayer(paneElement, paneContent, this._view(), this._updateAnnouncer === null);
		this._contrastWatcher = new HighContrastWatcher(() => this._refreshHighContrast());
		// Resolve high contrast last: restyles the nodes above and fires the initial
		// onHighContrastChange so the host can set its matching chart theme.
		this._refreshHighContrast();
		this._series.sync();

		this._layer.container.addEventListener('keydown', this._handleKeyDown);
		this._layer.container.addEventListener('focusin', this._handleFocusIn);
		this._layer.container.addEventListener('focusout', this._handleFocusOut);
		this._layer.host.addEventListener('pointerdown', this._handlePointerDown);
	}

	/**
	 * Routes this pane's data-update announcements through the chart-level shared
	 * region (set by {@link addAccessibilityPlugin} via the internal PaneLink).
	 * A non-null announcer removes this pane's own polite region so only the shared
	 * region remains; `null` (used at teardown) detaches from the announcer.
	 */
	private _attachAnnouncer(announcer: UpdateAnnouncer | null): void {
		this._updateAnnouncer = announcer;
		if (announcer) {
			this._layer?.dropStatusRegion();
		}
	}

	// region Rendering ------------------------------------------------------------------

	/** The chart while attached, `null` otherwise – the base class getter throws. */
	private _chartOrNull(): IChartApiBase<Time> | null {
		return this._isAttached ? this.chart : null;
	}

	private _pane(): IPaneApi<Time> | null {
		const panes = this._chartOrNull()?.panes() ?? [];
		// Pane indices shift when panes are added or removed, so once our DOM is
		// in place, identify the pane by the row that actually hosts our layer;
		// the constructor index is only the initial (pre-build) lookup. Built but
		// hosted nowhere means our pane was removed – return null rather than
		// silently re-binding to whatever pane holds the index now.
		const container = this._layer?.container;
		if (container) {
			return panes.find((pane: IPaneApi<Time>) => pane.getHTMLElement()?.contains(container) ?? false) ?? null;
		}
		return panes[this._initialPaneIndex] ?? null;
	}

	/** The pane's current index, which changes when panes are added, removed or moved. */
	private _paneIndex(): number {
		return this._pane()?.paneIndex() ?? this._initialPaneIndex;
	}

	private _focusRingStyle(): FocusRingStyle {
		return {
			color: this._options.focusIndicatorColor,
			size: this._options.focusIndicatorSize,
			highContrast: this._highContrast,
		};
	}

	private _view(): PaneLayerView {
		const series = this._cursor.activeSeries();
		const seriesCount = this._cursor.seriesCount();
		return {
			roleDescription: this._messages.roleDescription,
			label: this._messages.paneLabel({
				title: this._options.chartTitle ?? this._messages.defaultChartTitle,
				paneIndex: this._paneIndex(),
				paneCount: this._chartOrNull()?.panes().length ?? 1,
				seriesCount,
				seriesLabel: series ? this._cursor.seriesLabel(series, this._cursor.activeSeriesIndex()) : null,
			}),
			description: this._messages.description({ multiSeries: seriesCount > 1 }),
			lang: this._options.lang ?? this._formatters.locale(),
			direction: this._direction(),
			focusRing: this._focusRingStyle(),
			hasFocus: this._hasFocus,
			shortcutsEnabled: this._options.showShortcuts,
			shortcutsOpen: this._shortcutsOpen,
			multiSeries: seriesCount > 1,
			pageStep: this._options.pageStep,
			messages: this._messages,
		};
	}

	/**
	 * The host page's writing direction, read from the element the chart was
	 * created in: the library forces `direction: ltr` on the chart element itself,
	 * so the plugin's own panels would otherwise stay on the left of a
	 * right-to-left page.
	 */
	private _direction(): 'ltr' | 'rtl' {
		const host = this._chartOrNull()?.chartElement().parentElement ?? null;
		return host && window.getComputedStyle(host).direction === 'rtl' ? 'rtl' : 'ltr';
	}

	private _render(): void {
		this._layer?.render(this._view());
	}

	/**
	 * Recomputes the high-contrast state; on a change (or when a new listener was
	 * supplied) restyles the plugin's own visuals and notifies the host through
	 * onHighContrastChange.
	 */
	private _refreshHighContrast(): void {
		const next = resolveHighContrast(this._options.highContrast);
		const listener = this._options.onHighContrastChange;
		const changed = !this._highContrastInitialised || next !== this._highContrast;
		if (!changed && listener === this._contrastListener) {
			return;
		}
		this._highContrast = next;
		this._highContrastInitialised = true;
		this._contrastListener = listener;
		if (changed) {
			this._render();
			this._positionIndicator();
		}
		listener?.(next);
	}

	private _describeEnv(): DescribeEnv {
		const inView = this._messages.inView;
		return {
			messages: this._messages,
			scopeNote: this._options.dataScope === 'visible' && inView ? ` ${inView}` : '',
			formatValue: (value: number | undefined, series: AnySeries | null): string =>
				this._formatters.value(value, series),
			formatChange: (value: number, series: AnySeries | null): string =>
				this._formatters.change(value, series),
			formatTime: (time: Time): string => this._formatters.time(time),
			formatPercent: (value: number): string => this._formatters.percent(value),
			value: (point: SeriesDataPoint | undefined, series: AnySeries | null): number | undefined =>
				extractValue(point, series, this._options.valueAccessor),
			range: (point: SeriesDataPoint | undefined, series: AnySeries | null): PointRange | undefined =>
				extractRange(point, series, this._options.rangeAccessor),
		};
	}

	// region Announcements --------------------------------------------------------------

	/** Speaks through this pane's assertive region, mirroring to `onAnnounce`. */
	private _announce(message: string): void {
		if (message.length === 0) {
			return;
		}
		this._options.onAnnounce?.(message);
		this._layer?.liveWriter.write(message);
	}

	/** Speaks through this pane's own polite region (no shared region in place). */
	private _announceStatus(message: string): void {
		if (message.length === 0) {
			return;
		}
		this._options.onAnnounce?.(message);
		this._layer?.statusWriter.write(message);
	}

	// region Focus and keyboard ---------------------------------------------------------

	private _handleFocusIn = (): void => {
		this._hasFocus = true;
		// Data may have streamed in while the pane was unfocused; catch up before
		// anything reads the navigation cache.
		if (this._cursor.isStale()) {
			this._cursor.refreshActivePoints();
		}
		this._render();
		this._positionIndicator();
		// Tell the shared announcer this pane is now the active one, so in the
		// default 'active' mode its data updates are the ones that get announced.
		this._updateAnnouncer?.setActiveSource(this._updates);
		// By default nothing is announced on focus: the accessible name (aria-label)
		// and the aria-describedby hint are spoken when focus lands, and an
		// assertive message here would interrupt the name (e.g. VoiceOver cuts off
		// the title). `announceOnFocus` opts into "what is on screen" instead.
		if (this._options.announceOnFocus) {
			this._cursor.announceVisibleRange();
		}
	};

	private _handleFocusOut = (event: FocusEvent): void => {
		const next = event.relatedTarget as Node | null;
		if (next && this._layer?.container.contains(next)) {
			return;
		}
		this._hasFocus = false;
		this._shortcutsOpen = false;
		this._layer?.table.close();
		this._render();
		this._layer?.hideRing();
	};

	/**
	 * Pointer users cannot reach the semantic layer (it is `pointer-events: none`
	 * so the chart stays interactive), so `focusOnPointerDown` opts into moving
	 * the keyboard focus there when the pane is pressed – mouse and keyboard then
	 * share one notion of "the focused chart".
	 */
	private _handlePointerDown = (): void => {
		if (this._options.focusOnPointerDown) {
			this.focus();
		}
	};

	private _handleKeyDown = (event: KeyboardEvent): void => {
		// Leave shortcut combinations (e.g. browser or screen-reader commands such
		// as Ctrl+Home, or VoiceOver's modifier chords) to the platform.
		if (event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}
		const command = commandForKey(
			{ key: event.key, code: event.code, shiftKey: event.shiftKey },
			this._options.keyBindings
		);
		if (command === null) {
			return;
		}
		// An empty pane still closes an open panel; everything else needs data.
		if (command !== 'closePanels' && this._cursor.pointCount() === 0 && this._cursor.seriesCount() === 0) {
			return;
		}
		event.preventDefault();
		this._commands[command]();
	};

	// region Visible focus indicator ----------------------------------------------------

	private _positionIndicator(): void {
		const layer = this._layer;
		if (!layer) {
			return;
		}
		const coordinate = focusRingCoordinate(
			this._chartOrNull(),
			this._cursor.activeSeries(),
			this._cursor.activePoint(),
			this._options.showFocusIndicator && this._hasFocus,
			this._options.valueAccessor
		);
		if (coordinate === null) {
			layer.hideRing();
			return;
		}
		layer.showRingAt(coordinate.x, coordinate.y);
	}
}
