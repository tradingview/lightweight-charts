import {
	BarPrice,
	IChartApiBase,
	IPaneApi,
	IPanePrimitive,
	ISeriesApi,
	PaneAttachedParameter,
	SeriesDataItemTypeMap,
	SeriesType,
	Time,
	isBusinessDay,
	isUTCTimestamp,
} from 'lightweight-charts';

/** A series of any type attached to the pane. */
type AnySeries = ISeriesApi<SeriesType, Time>;

/**
 * The union of every data item a series can return (line, area, candlestick,
 * bar, histogram, whitespace, …) – exactly what {@link ISeriesApi.data} yields
 * for a series of unknown type.
 */
type SeriesDataPoint = SeriesDataItemTypeMap<Time>[SeriesType];

interface PresentationRoleState {
	count: number;
	previousValue: string | null;
}

const presentationRoles = new WeakMap<HTMLElement, PresentationRoleState>();
const ariaHiddenStates = new WeakMap<HTMLElement, PresentationRoleState>();

function retainPresentationRole(element: HTMLElement): void {
	const state = presentationRoles.get(element);
	if (state) {
		state.count += 1;
		return;
	}
	presentationRoles.set(element, {
		count: 1,
		previousValue: element.getAttribute('role'),
	});
	element.setAttribute('role', 'presentation');
}

function releasePresentationRole(element: HTMLElement): void {
	const state = presentationRoles.get(element);
	if (!state) {
		return;
	}
	state.count -= 1;
	if (state.count > 0) {
		return;
	}
	presentationRoles.delete(element);
	if (state.previousValue === null) {
		element.removeAttribute('role');
	} else {
		element.setAttribute('role', state.previousValue);
	}
}

function retainAriaHidden(element: HTMLElement): void {
	const state = ariaHiddenStates.get(element);
	if (state) {
		state.count += 1;
		return;
	}
	ariaHiddenStates.set(element, {
		count: 1,
		previousValue: element.getAttribute('aria-hidden'),
	});
	element.setAttribute('aria-hidden', 'true');
}

function releaseAriaHidden(element: HTMLElement): void {
	const state = ariaHiddenStates.get(element);
	if (!state) {
		return;
	}
	state.count -= 1;
	if (state.count > 0) {
		return;
	}
	ariaHiddenStates.delete(element);
	if (state.previousValue === null) {
		element.removeAttribute('aria-hidden');
	} else {
		element.setAttribute('aria-hidden', state.previousValue);
	}
}

/**
 * Options for the {@link AccessibilityPlugin}.
 *
 * Every option has a sensible default. For normal chart-level integration, use
 * {@link addAccessibilityPlugin}; it creates one correctly indexed primitive per
 * pane:
 *
 * ```js
 * addAccessibilityPlugin(chart, { chartTitle: 'Apple daily close' });
 * ```
 */
export interface AccessibilityOptions {
	/**
	 * Human readable title for the pane. Announced by screen readers when the
	 * pane receives focus and used as the accessible name of the pane region.
	 */
	chartTitle: string;
	/**
	 * Index of the pane this primitive is attached to. Must match the pane it is
	 * attached to (e.g. `chart.panes()[1].attachPrimitive(new AccessibilityPlugin({ paneIndex: 1 }))`).
	 * Defaults to `0`, which is correct for the main pane. When using
	 * {@link addAccessibilityPlugin}, this is set automatically.
	 */
	paneIndex: number;
	/**
	 * When `true` a visible focus ring is drawn over the currently focused data
	 * point. This is the "visible focus indicator" required by WCAG 2.4.7.
	 */
	showFocusIndicator: boolean;
	/** Colour of the visible focus indicator. */
	focusIndicatorColor: string;
	/** Diameter (in CSS pixels) of the visible focus indicator. */
	focusIndicatorSize: number;
	/**
	 * When `true` changes to the underlying data are announced through a polite
	 * `aria-live` region.
	 */
	announceDataUpdates: boolean;
	/**
	 * Number of points to jump when using `PageUp` / `PageDown`. `PageUp` moves
	 * forward in time and `PageDown` back, following the ARIA slider convention
	 * that `PageUp` increases the value.
	 */
	pageStep: number;
	/**
	 * Controls what the on-demand summary (`Enter` / `Space`) and the data-update
	 * announcements describe. Keyboard navigation always covers the whole series
	 * regardless of this setting.
	 *
	 * - `'visible'` (default): only the points within the current visible range
	 *   (e.g. "65 data points in view").
	 * - `'all'`: the full data set, regardless of what is on screen.
	 */
	dataScope: 'all' | 'visible';
	/**
	 * Formats a numeric value for screen reader announcements. Defaults to the
	 * chart's `localization.priceFormatter` if set, otherwise the active series'
	 * own price formatter.
	 */
	priceFormatter?: (value: number) => string;
	/**
	 * Formats a {@link Time} value for screen reader announcements. Defaults to the
	 * chart's `localization.timeFormatter` if set, otherwise a locale-aware date.
	 */
	timeFormatter?: (time: Time) => string;
	/**
	 * Produces the accessible label for a series, used when announcing data
	 * points and when switching series. Defaults to the series' `title` option,
	 * falling back to `Series N`.
	 */
	seriesLabel?: (series: AnySeries, index: number) => string;
	/**
	 * Produces the chart summary announced when the user presses `Enter` /
	 * `Space`. Receives the active series' data and label. Takes precedence over
	 * {@link AccessibilityMessages.summary}.
	 */
	describeChart?: (points: readonly SeriesDataPoint[], seriesLabel: string) => string;
	/**
	 * Overrides for the announced text, so the plugin can speak in any language.
	 * Anything left out falls back to the built-in English {@link defaultMessages}.
	 * Numbers and dates are localised separately (see {@link priceFormatter} /
	 * {@link timeFormatter} and the chart's `localization.locale`).
	 */
	messages?: PartialAccessibilityMessages;
	/**
	 * BCP-47 language tag set as the `lang` attribute on the announced regions, so
	 * screen readers pronounce them with the right voice. Defaults to the chart's
	 * `localization.locale`.
	 */
	lang?: string;
	/**
	 * Show a visible keyboard-shortcuts overlay for sighted keyboard users: a
	 * "Press H" hint while the pane is focused, and an `H`-toggled panel listing
	 * the controls (`Esc` closes it). Screen-reader users always get the spoken
	 * `H` help regardless of this option. Defaults to `false`.
	 */
	showShortcuts: boolean;
	/**
	 * High-contrast styling for the plugin's own visuals (focus ring, focus outline
	 * and the shortcuts overlay). `'auto'` (default) follows the OS
	 * `prefers-contrast` / `forced-colors`; pass a predicate to wire it to your own
	 * setting. This does not restyle the chart's series / grid / font — use
	 * {@link onHighContrastChange} for that.
	 */
	highContrast: boolean | 'auto' | (() => boolean);
	/**
	 * Called when the resolved high-contrast state changes (and once on attach),
	 * so the host can restyle the chart's own series / grid / font to match.
	 */
	onHighContrastChange?: (enabled: boolean) => void;
}

const defaultOptions: AccessibilityOptions = {
	chartTitle: 'Interactive financial chart',
	paneIndex: 0,
	showFocusIndicator: true,
	focusIndicatorColor: '#2962FF',
	focusIndicatorSize: 14,
	announceDataUpdates: true,
	pageStep: 10,
	dataScope: 'visible',
	showShortcuts: false,
	highContrast: 'auto',
};

/** Elements that can receive keyboard focus and so must be neutralised inside the hidden chart DOM. */
const FOCUSABLE_SELECTOR =
	'a[href],button,input,select,textarea,iframe,[tabindex],[contenteditable="true"],audio[controls],video[controls]';

/** CSS applied to elements that should be available to assistive technology but invisible on screen. */
const VISUALLY_HIDDEN =
	'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;';

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/** The media queries whose changes flip the `'auto'` high-contrast state. */
const HIGH_CONTRAST_QUERIES = ['(prefers-contrast: more)', '(forced-colors: active)'];

/** Whether the OS asks for higher contrast (used by the `'auto'` high-contrast mode). */
function prefersHighContrast(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) {
		return false;
	}
	return HIGH_CONTRAST_QUERIES.some(query => window.matchMedia(query).matches);
}

/**
 * Writes messages to an `aria-live` element by clearing it and setting the text
 * on the next animation frame. Re-setting textContent across a frame boundary
 * forces assistive technology to re-announce even when the message is identical
 * to the previous one (e.g. Home pressed twice, or two equal update summaries);
 * a synchronous clear-and-set does not reliably do that.
 */
class LiveRegionWriter {
	private readonly _region: () => HTMLElement | null;
	private _frame: ReturnType<typeof requestAnimationFrame> | null = null;

	public constructor(region: () => HTMLElement | null) {
		this._region = region;
	}

	public write(message: string): void {
		const region = this._region();
		if (!region || message.length === 0) {
			return;
		}
		region.textContent = '';
		if (this._frame !== null) {
			cancelAnimationFrame(this._frame);
		}
		this._frame = requestAnimationFrame(() => {
			this._frame = null;
			const target = this._region();
			if (target) {
				target.textContent = message;
			}
		});
	}

	/** Cancels a pending write (used at teardown). */
	public dispose(): void {
		if (this._frame !== null) {
			cancelAnimationFrame(this._frame);
			this._frame = null;
		}
	}
}

/**
 * Extracts the representative numeric value from a data point, if it has one.
 * Value-based series (line, area, …) carry `value`; OHLC series (bar,
 * candlestick) carry `close`; whitespace points carry neither.
 */
function extractValue(point: SeriesDataPoint | undefined): number | undefined {
	if (!point) {
		return undefined;
	}
	if ('value' in point && typeof point.value === 'number') {
		return point.value;
	}
	if ('close' in point && typeof point.close === 'number') {
		return point.close;
	}
	return undefined;
}

function defaultTimeFormatter(time: Time, locale?: string): string {
	let date: Date;
	if (isUTCTimestamp(time)) {
		date = new Date(time * 1000);
	} else if (isBusinessDay(time)) {
		// BusinessDay months are 1-12, whereas Date expects 0-11.
		date = new Date(Date.UTC(time.year, time.month - 1, time.day));
	} else {
		// Business-day string, e.g. '2019-05-15' – parse it so it is localised
		// like the other time formats (with a verbatim fallback if it does not
		// match the expected YYYY-MM-DD shape).
		const [year, month, day] = time.split('-').map(Number);
		if (!year || !month || !day) {
			return time;
		}
		date = new Date(Date.UTC(year, month - 1, day));
	}
	// `locale || undefined` guards against the empty-string locale used server-side,
	// which is not a valid Intl locale. Formatting must be in UTC: the library
	// renders the time axis in UTC, and the dates built above are UTC-midnight
	// instants that would otherwise shift a day in timezones west of UTC.
	return date.toLocaleDateString(locale || undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	});
}

/** Field labels for an OHLC (bar / candlestick) data point. */
export interface OhlcLabels {
	open: string;
	high: string;
	low: string;
	close: string;
}

/** Words describing a series' overall direction in the summary. */
export interface DirectionLabels {
	up: string;
	down: string;
	unchanged: string;
}

/** Pre-formatted fields passed to {@link AccessibilityMessages.summary}. */
export interface SummaryArgs {
	label: string;
	count: number;
	/** Localised scope note built from {@link AccessibilityMessages.inView}, with a leading space, or `''`. */
	scopeNote: string;
	firstValue: string;
	firstTime: string;
	lastValue: string;
	lastTime: string;
	direction: 'up' | 'down' | 'unchanged';
	directionLabel: string;
	changeValue: string;
	/** Formatted percentage change, or `null` when it is undefined (the series starts at zero). */
	percent: string | null;
	lowValue: string;
	lowTime: string;
	highValue: string;
	highTime: string;
}

/** Pre-formatted OHLC values passed to {@link AccessibilityMessages.ohlcValues} (absent fields are `null`). */
export interface OhlcValueArgs {
	labels: OhlcLabels;
	open: string | null;
	high: string | null;
	low: string | null;
	close: string;
}

/**
 * Every screen-reader string produced by the plugin. Atomic strings are localised
 * directly; sentences are formatter functions so a translation controls word order
 * and pluralisation. All numeric / date values arrive **pre-formatted**, and
 * position counters are **1-based**, so a message function only assembles words.
 *
 * Override some or all entries via {@link AccessibilityOptions.messages}; anything
 * left out falls back to the built-in English {@link defaultMessages}.
 */
export interface AccessibilityMessages {
	/** Spoken role of the pane region (`aria-roledescription`). */
	roleDescription: string;
	/** Spoken when a data point has no numeric value. */
	noValue: string;
	/** Scope word added to summaries when `dataScope` is `'visible'` (the plugin adds the leading space). */
	inView: string;
	/** Field labels for OHLC points, used by the default {@link ohlcValues}. */
	ohlc: OhlcLabels;
	/** Words for the summary's overall direction. */
	directions: DirectionLabels;
	/** Default label for the series at 1-based `position` when it has no title. */
	defaultSeriesLabel: (position: number) => string;
	/** Accessible name of the pane region. */
	paneLabel: (args: { title: string; seriesCount: number; seriesLabel: string | null }) => string;
	/**
	 * Accessible description of the pane (via `aria-describedby`). Read after the
	 * name on focus, and gives the pane real content so screen readers don't
	 * report the `application` region as "empty".
	 */
	description: (args: { multiSeries: boolean }) => string;
	/** Announced on `H`. */
	help: (args: { multiSeries: boolean; pageStep: number }) => string;
	/** Hint shown on the visible overlay while the pane is focused (when `showShortcuts`). */
	shortcutsHint: string;
	/** Heading of the visible shortcuts panel. */
	shortcutsTitle: string;
	/**
	 * Rows for the *visible* shortcuts panel (for sighted keyboard users), so list
	 * only keys with an on-screen effect. Screen-reader-only actions — such as the
	 * Enter / Space summary, which is spoken but produces nothing visible — belong
	 * in {@link help}, not here.
	 */
	shortcuts: (args: { multiSeries: boolean; pageStep: number }) => readonly { keys: string; action: string }[];
	/** Announced for the focused data point (`position` is 1-based). */
	point: (args: { position: number; total: number; time: string; label: string; values: string }) => string;
	/** Announced when switching series (`position` is 1-based; `point` is pre-spaced or `''`). */
	seriesPosition: (args: { label: string; position: number; total: number; point: string }) => string;
	/** Assembles a point's value(s); for OHLC series this controls order and separators. */
	ohlcValues: (args: OhlcValueArgs) => string;
	/** The `Enter` / `Space` summary. Bypassed entirely when {@link AccessibilityOptions.describeChart} is set. */
	summary: (args: SummaryArgs) => string;
	/** Summary when the active series has no valued points in scope (`scopeNote` as in {@link summary}). */
	noData: (args: { label: string; scopeNote: string }) => string;
	/** One series' contribution to a data-update announcement. */
	seriesUpdate: (args: { label: string; count: number; scopeNote: string; latest: string }) => string;
	/** Wraps the per-series update summaries into one announcement (`total` >= 1). */
	dataUpdated: (args: { summaries: readonly string[]; total: number; shownMax: number }) => string;
}

/** A partial {@link AccessibilityMessages} override: top-level entries and the two string groups are each optional. */
export type PartialAccessibilityMessages =
	Partial<Omit<AccessibilityMessages, 'ohlc' | 'directions'>> & {
		ohlc?: Partial<OhlcLabels>;
		directions?: Partial<DirectionLabels>;
	};

/** Built-in English strings. Reproduces the plugin's original wording exactly; use as a template for a translation. */
export const defaultMessages: AccessibilityMessages = {
	roleDescription: 'Interactive chart pane',
	noValue: 'no value',
	inView: 'in view',
	ohlc: { open: 'open', high: 'high', low: 'low', close: 'close' },
	directions: { up: 'up', down: 'down', unchanged: 'unchanged' },
	defaultSeriesLabel: (position: number): string => `Series ${position}`,
	paneLabel: ({ title, seriesCount, seriesLabel }): string => {
		const seriesPart =
			seriesCount > 1
				? `${seriesCount} series. `
				: seriesLabel
					? `${seriesLabel}. `
					: '';
		return `${title}. ${seriesPart}Press H for keyboard help.`;
	},
	description: ({ multiSeries }): string =>
		multiSeries
			? 'Use the left and right arrow keys to move between data points, and the up and down arrows to switch series.'
			: 'Use the left and right arrow keys to move between data points.',
	help: ({ multiSeries, pageStep }): string =>
		`Keyboard controls. Left and right arrows move between data points. ${multiSeries ? 'Up and down arrows switch between series. ' : ''}Page Up jumps ${pageStep} points forward, Page Down ${pageStep} points back. Home and End jump to the first and last points. Plus and minus zoom the chart in and out. Enter or Space reads a summary of the series.`,
	shortcutsHint: 'Press H for keyboard shortcuts',
	shortcutsTitle: 'Keyboard shortcuts',
	shortcuts: ({ multiSeries, pageStep }) => [
		{ keys: '← / →', action: 'Move between data points' },
		...(multiSeries ? [{ keys: '↑ / ↓', action: 'Switch between series' }] : []),
		{ keys: 'Page Up / Page Down', action: `Jump ${pageStep} points` },
		{ keys: 'Home / End', action: 'First / last point' },
		{ keys: '+ / −', action: 'Zoom in / out' },
		// Enter / Space (the spoken summary) is intentionally omitted: it has no
		// on-screen effect, so it stays in `help` (for screen readers) only.
		{ keys: 'H', action: 'Show or hide this panel' },
		{ keys: 'Esc', action: 'Close this panel' },
	],
	// Most important information first: the value, then the date; the position
	// counter is context, so it comes last.
	point: ({ position, total, time, label, values }): string =>
		`${label} ${values}, ${time}. Point ${position} of ${total}.`,
	seriesPosition: ({ label, position, total, point }): string =>
		`${label}, series ${position} of ${total}.${point}`,
	ohlcValues: ({ labels, open, high, low, close }): string => {
		const parts: string[] = [];
		if (open !== null) {
			parts.push(`${labels.open} ${open}`);
		}
		if (high !== null) {
			parts.push(`${labels.high} ${high}`);
		}
		if (low !== null) {
			parts.push(`${labels.low} ${low}`);
		}
		parts.push(`${labels.close} ${close}`);
		return parts.join(', ');
	},
	summary: ({ label, count, scopeNote, firstValue, firstTime, lastValue, lastTime, directionLabel, changeValue, percent, lowValue, lowTime, highValue, highTime }): string =>
		`${label} with ${count} data points${scopeNote}. From ${firstValue} on ${firstTime} to ${lastValue} on ${lastTime}. Overall ${directionLabel} by ${changeValue}${percent !== null ? `, ${percent} percent` : ''}. Lowest ${lowValue} on ${lowTime}, highest ${highValue} on ${highTime}.`,
	noData: ({ label, scopeNote }): string => `${label}: no data available${scopeNote}.`,
	seriesUpdate: ({ label, count, scopeNote, latest }): string =>
		`${label}, ${count} data points${scopeNote}. Latest ${latest}`,
	dataUpdated: ({ summaries, total, shownMax }): string => {
		if (total === 1) {
			return `Chart data updated. ${summaries[0]}.`;
		}
		const shown = summaries.slice(0, shownMax);
		const remaining = total > shown.length
			? ` ${total - shown.length} more series changed.`
			: '';
		return `Chart data updated. ${total} series changed. ${shown.join(' ')}.${remaining}`;
	},
};

/**
 * Overlays a partial override onto {@link defaultMessages}. Top-level entries
 * replace wholesale; the known string groups (`ohlc`, `directions`) shallow-merge.
 * Keep the group list in sync if a new nested group is added to the interface.
 */
function mergeMessages(base: AccessibilityMessages, override?: PartialAccessibilityMessages): AccessibilityMessages {
	if (!override) {
		return base;
	}
	const merged: AccessibilityMessages = {
		...base,
		...override,
		ohlc: { ...base.ohlc, ...override.ohlc },
		directions: { ...base.directions, ...override.directions },
	};
	// An explicit `undefined` in the override must not erase a default entry.
	(Object.keys(merged) as (keyof AccessibilityMessages)[]).forEach(key => {
		if (merged[key] === undefined) {
			(merged as unknown as Record<string, unknown>)[key] = base[key];
		}
	});
	return merged;
}

/** Source of unique ids for the per-pane `aria-describedby` target. */
let descriptionIdCounter = 0;

/** Debounce window (ms) for coalescing data-update announcements. */
const UPDATE_DEBOUNCE_MS = 150;

/** Maximum number of changed series listed in a single update announcement. */
const UPDATE_MAX_SERIES = 3;

/** Fraction the visible range grows / shrinks per `+` / `-` zoom keypress. */
const ZOOM_STEP = 0.2;

/** Smallest visible logical span (in bars) that zooming-in will produce. */
const MIN_ZOOM_SPAN = 2;

/**
 * Builds the spoken text for a batch of changed-series summaries. Shared by the
 * standalone per-pane path and the chart-level {@link UpdateAnnouncer}. Returns
 * an empty string when there is nothing to announce.
 */
function formatUpdateMessage(summaries: readonly string[], messages: AccessibilityMessages): string {
	if (summaries.length === 0) {
		return '';
	}
	return messages.dataUpdated({ summaries, total: summaries.length, shownMax: UPDATE_MAX_SERIES });
}

/**
 * Private channel between {@link AccessibilityPlugin}, {@link addAccessibilityPlugin}
 * and {@link UpdateAnnouncer}. Keeping this cross-object coordination in a
 * module-scoped WeakMap (rather than on the plugin class) means it never appears
 * on the public `AccessibilityPlugin` surface or in the generated typings.
 */
interface PluginLink {
	attachAnnouncer(announcer: UpdateAnnouncer | null): void;
	collectPendingUpdateSummaries(): string[];
}
const pluginLinks = new WeakMap<AccessibilityPlugin, PluginLink>();

/**
 * AccessibilityPlugin – a pane primitive that adds a semantic accessibility
 * layer to one pane of a Lightweight Charts™ chart.
 *
 * Most applications should use {@link addAccessibilityPlugin}, which attaches
 * one correctly indexed primitive per pane. Each pane gets an independent,
 * labelled, keyboard-focusable semantic layer. Within a pane the plugin
 * provides:
 *
 * - An ARIA-described overlay (the pane's canvas is hidden from assistive
 *   technology with `aria-hidden`, and table scaffolding is presentational).
 * - Keyboard navigation: the left/right arrows move between data points, and
 *   the up/down arrows switch between the series in the pane.
 * - `aria-live` announcements of the focused point, series changes, on-demand
 *   summaries and background data updates.
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
export class AccessibilityPlugin implements IPanePrimitive<Time> {
	private _options: AccessibilityOptions;
	private _chart: IChartApiBase<Time> | null = null;
	private _container: HTMLElement | null = null;

	private _liveRegion: HTMLElement | null = null;
	private _statusRegion: HTMLElement | null = null;
	private _descriptionRegion: HTMLElement | null = null;
	private _focusIndicator: HTMLElement | null = null;
	// Visible (opt-in) keyboard-shortcuts overlay for sighted keyboard users.
	private _shortcutsHint: HTMLElement | null = null;
	private _shortcutsPanel: HTMLElement | null = null;
	private _shortcutsOpen = false;
	private _domObserver: MutationObserver | null = null;
	private _requestUpdate: (() => void) | null = null;

	// Restored on detach so we leave the host DOM exactly as we found it.
	// Descendants of the pane element whose attributes we changed, paired with
	// their original value, so detach() can restore them.
	private _presentedElements: HTMLElement[] = [];
	private _hiddenCanvases: HTMLElement[] = [];
	private _neutralised: [HTMLElement, string | null, string | null][] = [];

	private _seriesList: AnySeries[] = [];
	private _points: readonly SeriesDataPoint[] = [];
	// Set when the active series changes while the pane is unfocused, so the
	// (O(n)-copy) re-read of `_points` is deferred until the pane is used again.
	private _activePointsStale = false;
	private _activeSeriesIndex = 0;
	private _activePointIndex = -1;
	// One `subscribeDataChanged` handler per series, so we react to real data
	// changes instead of polling and re-hashing on every redraw.
	private _dataChangedHandlers = new Map<AnySeries, () => void>();
	private _dirtySeries = new Set<AnySeries>();
	private _announceUpdateHandle: ReturnType<typeof setTimeout> | null = null;
	private readonly _liveWriter = new LiveRegionWriter(() => this._liveRegion);
	private readonly _statusWriter = new LiveRegionWriter(() => this._statusRegion);
	// When attached via addAccessibilityPlugin, data-update announcements are
	// routed through one shared region instead of this pane's own polite region.
	private _updateAnnouncer: UpdateAnnouncer | null = null;
	private _hasFocus = false;
	private _built = false;
	private _initAttempts = 0;

	private _messages: AccessibilityMessages;
	// Memoised percent formatter, rebuilt only when the chart's locale changes.
	private _percentFormatter: Intl.NumberFormat | null = null;
	private _percentLocale: string | undefined;
	// Resolved high-contrast state, plus the OS media queries that drive `'auto'`.
	private _highContrast = false;
	private _highContrastInitialised = false;
	private _contrastMedia: MediaQueryList[] = [];

	public constructor(options: Partial<AccessibilityOptions> = {}) {
		this._options = { ...defaultOptions, ...options };
		this._messages = mergeMessages(defaultMessages, this._options.messages);
		// Internal coordination is registered off the public surface (see PluginLink).
		pluginLinks.set(this, {
			attachAnnouncer: announcer => this._attachAnnouncer(announcer),
			collectPendingUpdateSummaries: () => this._collectPendingUpdateSummaries(),
		});
	}

	// region IPanePrimitive lifecycle ---------------------------------------------------

	public attached(param: PaneAttachedParameter<Time>): void {
		this._chart = param.chart;
		this._requestUpdate = param.requestUpdate;
		this._tryInit();
	}

	/**
	 * A freshly created pane may not have its HTML element yet. The pane widget
	 * is built by the next redraw, so request one – the resulting updateAllViews
	 * retries this init. The animation-frame fallback covers the window in which
	 * the chart is still processing the invalidation.
	 */
	private _tryInit(): void {
		if (this._built || !this._chart) {
			return;
		}
		const paneElement = this._pane()?.getHTMLElement() ?? null;
		const paneContent = paneElement ? this._paneContentElement(paneElement) : null;
		if (!paneElement || !paneContent) {
			this._requestUpdate?.();
			if (this._initAttempts++ < 60) {
				requestAnimationFrame(() => this._tryInit());
			}
			return;
		}
		this._built = true;

		this._buildDom(paneElement, paneContent);
		this._syncSeries();

		this._container?.addEventListener('keydown', this._handleKeyDown);
		this._container?.addEventListener('focusin', this._handleFocusIn);
		this._container?.addEventListener('focusout', this._handleFocusOut);
	}

	public detached(): void {
		if (this._announceUpdateHandle !== null) {
			clearTimeout(this._announceUpdateHandle);
			this._announceUpdateHandle = null;
		}
		this._liveWriter.dispose();
		this._statusWriter.dispose();
		this._unsubscribeAll();
		// The announcer itself is owned and disposed by addAccessibilityPlugin;
		// here we just drop our reference to it.
		this._updateAnnouncer = null;
		const container = this._container;
		if (container) {
			container.removeEventListener('keydown', this._handleKeyDown);
			container.removeEventListener('focusin', this._handleFocusIn);
			container.removeEventListener('focusout', this._handleFocusOut);
			container.remove();
		}
		// Stop observing before restoring, so our own restores are not re-swept.
		this._domObserver?.disconnect();
		this._domObserver = null;
		for (const media of this._contrastMedia) {
			media.removeEventListener('change', this._onContrastChange);
		}
		this._contrastMedia = [];
		this._restorePresentationRoles();
		this._restoreHiddenCanvases();
		this._restoreFocusables();

		this._chart = null;
		this._requestUpdate = null;
		this._container = null;
		this._liveRegion = null;
		this._statusRegion = null;
		this._descriptionRegion = null;
		this._focusIndicator = null;
		this._shortcutsHint = null;
		this._shortcutsPanel = null;
		this._shortcutsOpen = false;
		this._highContrast = false;
		this._highContrastInitialised = false;
		this._seriesList = [];
		this._points = [];
		this._activePointsStale = false;
		this._activePointIndex = -1;
		this._activeSeriesIndex = 0;
		this._built = false;
		this._initAttempts = 0;
	}

	/**
	 * Called by the library whenever the viewport changes (scroll / zoom / resize)
	 * and on every redraw. We use it to keep the focus indicator aligned with the
	 * canvas and to reconcile our per-series data subscriptions. Data *content*
	 * changes are handled by those subscriptions, so this path never reads or
	 * hashes bar data and stays cheap during scrolling and zooming.
	 */
	public updateAllViews(): void {
		if (!this._built) {
			this._tryInit();
			return;
		}
		this._positionIndicator();
		this._syncSeries();
	}

	// region Options --------------------------------------------------------------------

	public applyOptions(options: Partial<AccessibilityOptions>): void {
		this._options = { ...this._options, ...options };
		// Re-merge from defaultMessages so repeated partial overrides compose
		// against English rather than each other.
		this._messages = mergeMessages(defaultMessages, this._options.messages);
		this._container?.setAttribute('aria-roledescription', this._messages.roleDescription);
		this._updatePaneLabel();
		this._updateDescription();
		this._applyLang();
		if (this._focusIndicator) {
			this._styleFocusIndicator(this._focusIndicator);
		}
		this._styleFocusOutline();
		this._positionIndicator();
		this._renderShortcuts();
		// Re-resolve in case `highContrast` changed; always re-style the overlay in
		// case `showShortcuts` / `messages` did.
		this._refreshHighContrast();
		this._styleShortcutsOverlay();
	}

	public options(): Readonly<AccessibilityOptions> {
		return this._options;
	}

	public focus(): void {
		this._container?.focus();
	}

	/**
	 * Routes this pane's data-update announcements through the chart-level shared
	 * region (set by {@link addAccessibilityPlugin} via the internal PluginLink).
	 * A non-null announcer removes this pane's own polite region so only the shared
	 * region remains; `null` (used at teardown) detaches from the announcer.
	 */
	private _attachAnnouncer(announcer: UpdateAnnouncer | null): void {
		this._updateAnnouncer = announcer;
		if (announcer && this._statusRegion) {
			this._statusRegion.remove();
			this._statusRegion = null;
		}
	}

	// region Pane / series resolution ---------------------------------------------------

	private _pane(): IPaneApi<Time> | null {
		const panes = this._chart?.panes() ?? [];
		// Pane indices shift when panes are added or removed, so once our DOM is
		// in place, identify the pane by the row that actually hosts our layer;
		// the configured index is only the initial (pre-build) lookup. Built but
		// hosted nowhere means our pane was removed – return null rather than
		// silently re-binding to whatever pane holds the index now.
		if (this._container) {
			return panes.find(pane => pane.getHTMLElement()?.contains(this._container) ?? false) ?? null;
		}
		return panes[this._options.paneIndex] ?? null;
	}

	private _activeSeries(): AnySeries | null {
		return this._seriesList[this._activeSeriesIndex] ?? null;
	}

	private _seriesLabel(series: AnySeries, index: number): string {
		if (this._options.seriesLabel) {
			return this._options.seriesLabel(series, index);
		}
		const title = series.options().title;
		return title.length > 0 ? title : this._messages.defaultSeriesLabel(index + 1);
	}

	// region DOM construction -----------------------------------------------------------

	private _paneContentElement(paneElement: HTMLElement): HTMLElement | null {
		const cells = Array.from(paneElement.children).filter(
			(cell): cell is HTMLElement => cell instanceof HTMLElement
		);
		// The pane row holds the (optional) left price-axis cell, the main pane
		// cell and the (optional) right price-axis cell. Every one of them can
		// contain a canvas, so "first cell with a canvas" would wrongly pick the
		// left axis when it is visible. The library only sets `position:relative`
		// on the main pane cell, so we key off that and fall back to the first
		// canvas-bearing cell for forward compatibility.
		const paneCell =
			cells.find(cell => cell.style.position === 'relative' && cell.querySelector('canvas')) ??
			cells.find(cell => cell.querySelector('canvas'));
		if (!paneCell) {
			return null;
		}
		return paneCell.firstElementChild instanceof HTMLElement
			? paneCell.firstElementChild
			: paneCell;
	}

	private _buildDom(paneElement: HTMLElement, paneContent: HTMLElement): void {
		this._markTableStructurePresentational(paneElement);

		// Hide the visual canvas(es) from assistive technology and take any
		// focusable descendant (e.g. the attribution link) out of the tab order –
		// a focusable element inside an aria-hidden subtree is a WCAG failure.
		const chartTable = paneElement.closest('table') ?? paneElement;
		this._hideCanvases(chartTable);
		this._neutraliseFocusables(paneElement);

		const semanticLayer = document.createElement('div');
		semanticLayer.className = 'lw-chart-a11y-layer';
		semanticLayer.tabIndex = 0;
		// `application` role lets screen readers forward arrow keys to our handler
		// instead of using them for virtual cursor navigation.
		semanticLayer.setAttribute('role', 'application');
		semanticLayer.setAttribute('aria-roledescription', this._messages.roleDescription);
		semanticLayer.setAttribute('aria-label', this._buildPaneLabel());
		semanticLayer.style.cssText = [
			'position:absolute',
			'inset:0',
			'outline:none',
			'outline-offset:-3px',
			'pointer-events:none',
			'z-index:5',
		].join(';');
		paneContent.appendChild(semanticLayer);
		this._container = semanticLayer;

		// A visually-hidden description gives the application real content – so a
		// screen reader doesn't report the region as "empty" – and is read after the
		// name on focus via aria-describedby.
		const description = document.createElement('div');
		const descriptionId = `lw-chart-a11y-desc-${++descriptionIdCounter}`;
		description.id = descriptionId;
		description.className = 'lw-chart-a11y-description';
		description.style.cssText = VISUALLY_HIDDEN;
		semanticLayer.setAttribute('aria-describedby', descriptionId);
		semanticLayer.appendChild(description);
		this._descriptionRegion = description;
		this._updateDescription();

		// Assertive: announces the focused point / series change immediately in
		// response to a key press. (Not `role="status"`, which would imply the
		// contradictory `aria-live="polite"`.)
		const liveRegion = document.createElement('div');
		liveRegion.className = 'lw-chart-a11y-live-region';
		liveRegion.setAttribute('aria-live', 'assertive');
		liveRegion.setAttribute('aria-atomic', 'true');
		liveRegion.style.cssText = VISUALLY_HIDDEN;
		semanticLayer.appendChild(liveRegion);
		this._liveRegion = liveRegion;

		// Skip the per-pane polite region when a shared announcer is already in
		// place (it owns the single chart-level polite region). DOM construction can
		// be deferred past the announcer injection, so this guard – together with the
		// removal in _attachAnnouncer – keeps exactly one polite region either way.
		if (!this._updateAnnouncer) {
			const statusRegion = document.createElement('div');
			statusRegion.className = 'lw-chart-a11y-status-region';
			statusRegion.setAttribute('aria-live', 'polite');
			statusRegion.setAttribute('aria-atomic', 'true');
			statusRegion.style.cssText = VISUALLY_HIDDEN;
			semanticLayer.appendChild(statusRegion);
			this._statusRegion = statusRegion;
		}

		const focusIndicator = document.createElement('div');
		focusIndicator.className = 'lw-chart-a11y-focus-ring';
		this._styleFocusIndicator(focusIndicator);
		semanticLayer.appendChild(focusIndicator);
		this._focusIndicator = focusIndicator;

		this._buildShortcutsOverlay(semanticLayer);
		this._setupContrastMedia();
		// Resolve high contrast last: styles the nodes above and fires the initial
		// onHighContrastChange so the host can set its matching chart theme.
		this._refreshHighContrast();

		this._applyLang();
		this._watchForRecreatedElements(paneElement);
	}

	/**
	 * Builds the visible keyboard-shortcuts overlay (a focus hint and an H-toggled
	 * panel). Always created but only shown when {@link AccessibilityOptions.showShortcuts}
	 * is set; `aria-hidden` because screen-reader users get the spoken `H` help.
	 */
	private _buildShortcutsOverlay(semanticLayer: HTMLElement): void {
		const hint = document.createElement('div');
		hint.className = 'lw-chart-a11y-shortcuts-hint';
		hint.setAttribute('aria-hidden', 'true');
		semanticLayer.appendChild(hint);
		this._shortcutsHint = hint;

		const panel = document.createElement('div');
		panel.className = 'lw-chart-a11y-shortcuts-panel';
		panel.setAttribute('aria-hidden', 'true');
		semanticLayer.appendChild(panel);
		this._shortcutsPanel = panel;

		this._renderShortcuts();
	}

	private _markTableStructurePresentational(paneElement: HTMLElement): void {
		const elements = [
			paneElement.closest('table'),
			paneElement,
			...Array.from(paneElement.children),
		].filter((element): element is HTMLElement => element instanceof HTMLElement);

		for (const element of elements) {
			retainPresentationRole(element);
			this._presentedElements.push(element);
		}
	}

	private _styleFocusIndicator(element: HTMLElement): void {
		const size = this._options.focusIndicatorSize;
		const color = this._options.focusIndicatorColor;
		// High contrast: a thicker ring with a white-then-black halo so it stands
		// out on any background. (box-shadow is dropped in forced-colors mode, where
		// the border itself still shows.)
		const ring = this._highContrast
			? [`border:3px solid ${color}`, 'box-shadow:0 0 0 2px #fff, 0 0 0 4px #000']
			: [`border:2px solid ${color}`, 'box-shadow:0 0 0 2px rgba(255,255,255,0.9)'];
		element.style.cssText = [
			'position:absolute',
			'box-sizing:border-box',
			`width:${size}px`,
			`height:${size}px`,
			'border-radius:50%',
			...ring,
			'transform:translate(-50%, -50%)',
			'pointer-events:none',
			'z-index:4',
			'display:none',
		].join(';');
	}

	private _styleFocusOutline(): void {
		if (!this._container) {
			return;
		}
		const width = this._highContrast ? 4 : 3;
		this._container.style.outline = this._hasFocus
			? `${width}px solid ${this._options.focusIndicatorColor}`
			: 'none';
	}

	// region High contrast & shortcuts overlay ------------------------------------------

	private _setupContrastMedia(): void {
		if (typeof window === 'undefined' || !window.matchMedia) {
			return;
		}
		this._contrastMedia = HIGH_CONTRAST_QUERIES.map(query => window.matchMedia(query));
		for (const media of this._contrastMedia) {
			media.addEventListener('change', this._onContrastChange);
		}
	}

	private _onContrastChange = (): void => {
		this._refreshHighContrast();
	};

	private _resolveHighContrast(): boolean {
		const highContrast = this._options.highContrast;
		if (typeof highContrast === 'function') {
			return highContrast();
		}
		if (highContrast === 'auto') {
			return prefersHighContrast();
		}
		return highContrast;
	}

	/**
	 * Recomputes the high-contrast state; on a change (or the first call) restyles
	 * the plugin's own visuals and notifies the host through onHighContrastChange.
	 */
	private _refreshHighContrast(): void {
		const next = this._resolveHighContrast();
		if (this._highContrastInitialised && next === this._highContrast) {
			return;
		}
		this._highContrast = next;
		this._highContrastInitialised = true;
		if (this._focusIndicator) {
			this._styleFocusIndicator(this._focusIndicator);
		}
		this._styleFocusOutline();
		this._positionIndicator();
		this._styleShortcutsOverlay();
		this._options.onHighContrastChange?.(next);
	}

	private _hintVisible(): boolean {
		return this._options.showShortcuts && this._hasFocus && !this._shortcutsOpen;
	}

	private _setShortcutsOpen(open: boolean): void {
		this._shortcutsOpen = open && this._options.showShortcuts;
		this._styleShortcutsOverlay();
	}

	/** (Re)builds the hint and panel text from the current messages. */
	private _renderShortcuts(): void {
		if (this._shortcutsHint) {
			this._shortcutsHint.textContent = this._messages.shortcutsHint;
		}
		const panel = this._shortcutsPanel;
		if (!panel) {
			return;
		}
		panel.textContent = '';
		const title = document.createElement('div');
		title.textContent = this._messages.shortcutsTitle;
		title.style.cssText = 'font-weight:600;margin-bottom:6px;';
		panel.appendChild(title);
		const rows = this._messages.shortcuts({
			multiSeries: this._seriesList.length > 1,
			pageStep: this._options.pageStep,
		});
		for (const { keys, action } of rows) {
			const row = document.createElement('div');
			row.style.cssText = 'display:flex;gap:10px;align-items:baseline;margin-top:3px;';
			const keyEl = document.createElement('kbd');
			keyEl.textContent = keys;
			// `currentColor` keeps the key border in step with the (contrast-aware) text colour.
			keyEl.style.cssText = 'flex:0 0 auto;border:1px solid currentColor;border-radius:3px;padding:0 5px;font-family:monospace;white-space:nowrap;';
			const actionEl = document.createElement('span');
			actionEl.textContent = action;
			row.appendChild(keyEl);
			row.appendChild(actionEl);
			panel.appendChild(row);
		}
	}

	/** Positions / shows / hides the overlay and applies the contrast palette. */
	private _styleShortcutsOverlay(): void {
		const base = 'position:absolute;z-index:6;color:#fff;font-size:0.8125rem;line-height:1.45;pointer-events:none;';
		const surface = this._highContrast
			? 'background:#000;border:2px solid #fff;'
			: 'background:rgba(20,24,28,0.9);border:1px solid rgba(255,255,255,0.25);';
		if (this._shortcutsHint) {
			this._shortcutsHint.style.cssText = base + surface +
				'left:8px;bottom:8px;padding:3px 8px;border-radius:4px;white-space:nowrap;' +
				(this._hintVisible() ? '' : 'display:none;');
		}
		if (this._shortcutsPanel) {
			const panelVisible = this._options.showShortcuts && this._shortcutsOpen;
			this._shortcutsPanel.style.cssText = base + surface +
				'left:8px;top:8px;max-width:calc(100% - 16px);padding:8px 11px;border-radius:6px;' +
				(this._highContrast ? '' : 'box-shadow:0 2px 10px rgba(0,0,0,0.45);') +
				(panelVisible ? '' : 'display:none;');
		}
	}

	private _neutraliseFocusables(root: HTMLElement): void {
		const descendants = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
		const targets = root.matches(FOCUSABLE_SELECTOR) ? [root, ...descendants] : descendants;
		for (const element of targets) {
			// Idempotent: re-sweeps (from the mutation observer) must not record
			// our own tabindex="-1" as the value to restore.
			if (this._neutralised.some(([neutralised]) => neutralised === element)) {
				continue;
			}
			this._neutralised.push([
				element,
				element.getAttribute('tabindex'),
				element.getAttribute('aria-hidden'),
			]);
			element.setAttribute('tabindex', '-1');
			element.setAttribute('aria-hidden', 'true');
		}
	}

	private _hideCanvases(root: HTMLElement): void {
		const targets = root instanceof HTMLCanvasElement
			? [root]
			: Array.from(root.querySelectorAll<HTMLElement>('canvas'));
		for (const element of targets) {
			if (this._hiddenCanvases.includes(element)) {
				continue;
			}
			retainAriaHidden(element);
			this._hiddenCanvases.push(element);
		}
	}

	/**
	 * The library re-creates parts of the pane DOM after we attach – e.g. the
	 * attribution link is rebuilt whenever the layout theme changes – which would
	 * put a fresh focusable element back into the tab order inside our
	 * presentational subtree, and fresh canvases back into the accessibility
	 * tree. Watch this pane's row and re-apply the treatment to anything that
	 * reappears.
	 */
	private _watchForRecreatedElements(paneElement: HTMLElement): void {
		this._domObserver = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of Array.from(mutation.addedNodes)) {
					if (!(node instanceof HTMLElement) || this._container?.contains(node)) {
						continue;
					}
					this._neutraliseFocusables(node);
					this._hideCanvases(node);
				}
			}
		});
		this._domObserver.observe(paneElement, { childList: true, subtree: true });
	}

	private _restoreFocusables(): void {
		for (const [element, previousTabIndex, previousAriaHidden] of this._neutralised) {
			if (previousTabIndex === null) {
				element.removeAttribute('tabindex');
			} else {
				element.setAttribute('tabindex', previousTabIndex);
			}
			if (previousAriaHidden === null) {
				element.removeAttribute('aria-hidden');
			} else {
				element.setAttribute('aria-hidden', previousAriaHidden);
			}
		}
		this._neutralised = [];
	}

	private _restorePresentationRoles(): void {
		for (const element of this._presentedElements) {
			releasePresentationRole(element);
		}
		this._presentedElements = [];
	}

	private _restoreHiddenCanvases(): void {
		for (const element of this._hiddenCanvases) {
			releaseAriaHidden(element);
		}
		this._hiddenCanvases = [];
	}

	private _buildPaneLabel(): string {
		const series = this._activeSeries();
		return this._messages.paneLabel({
			title: this._options.chartTitle,
			seriesCount: this._seriesList.length,
			seriesLabel: series ? this._seriesLabel(series, this._activeSeriesIndex) : null,
		});
	}

	private _updatePaneLabel(): void {
		this._container?.setAttribute('aria-label', this._buildPaneLabel());
	}

	private _updateDescription(): void {
		if (this._descriptionRegion) {
			this._descriptionRegion.textContent = this._messages.description({
				multiSeries: this._seriesList.length > 1,
			});
		}
	}

	// region Localisation helpers -------------------------------------------------------

	/** The chart's current locale, or `undefined` (e.g. server-side `''`) for the runtime default. */
	private _locale(): string | undefined {
		const locale = this._chart?.options().localization.locale;
		return locale ? locale : undefined;
	}

	/** Localised, leading-spaced scope note for summaries, or `''` when not scoped (or the note is blank). */
	private _scopeNote(): string {
		const inView = this._messages.inView;
		return this._options.dataScope === 'visible' && inView ? ` ${inView}` : '';
	}

	private _formatPercent(value: number): string {
		const locale = this._locale();
		if (this._percentFormatter === null || this._percentLocale !== locale) {
			this._percentLocale = locale;
			this._percentFormatter = new Intl.NumberFormat(locale, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
		}
		return this._percentFormatter.format(value);
	}

	/** Sets (or clears) the BCP-47 `lang` on the announced regions so screen readers pick the right voice. */
	private _applyLang(): void {
		const lang = this._options.lang ?? this._locale();
		const apply = (element: HTMLElement | null): void => {
			if (!element) {
				return;
			}
			if (lang) {
				element.setAttribute('lang', lang);
			} else {
				element.removeAttribute('lang');
			}
		};
		apply(this._container);
		apply(this._liveRegion);
		apply(this._statusRegion);
	}

	// region Focus handling -------------------------------------------------------------

	private _handleFocusIn = (): void => {
		this._hasFocus = true;
		// Data may have streamed in while the pane was unfocused; catch up before
		// anything reads the navigation cache.
		if (this._activePointsStale) {
			this._refreshActivePoints();
		}
		this._styleFocusOutline();
		this._positionIndicator();
		this._styleShortcutsOverlay();
		// Tell the shared announcer this pane is now the active one, so in the
		// default 'active' mode its data updates are the ones that get announced.
		this._updateAnnouncer?.setActivePlugin(this);
		// No live-region announcement on focus: the accessible name (aria-label) and
		// the aria-describedby hint are spoken when focus lands. An assertive message
		// here would interrupt the name (e.g. VoiceOver cuts off the title); the H key
		// gives the full controls.
	};

	private _handleFocusOut = (event: FocusEvent): void => {
		const next = event.relatedTarget as Node | null;
		if (next && this._container?.contains(next)) {
			return;
		}
		this._hasFocus = false;
		this._shortcutsOpen = false;
		this._styleFocusOutline();
		this._styleShortcutsOverlay();
		if (this._focusIndicator) {
			this._focusIndicator.style.display = 'none';
		}
	};

	private _handleKeyDown = (event: KeyboardEvent): void => {
		if (this._points.length === 0 && this._seriesList.length === 0) {
			return;
		}
		// Leave shortcut combinations (e.g. browser or screen-reader commands such
		// as Ctrl+Home, or VoiceOver's modifier chords) to the platform.
		if (event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}
		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				this._movePoint(1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				this._movePoint(-1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				this._moveSeries(-1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				this._moveSeries(1);
				break;
			case 'PageUp':
				event.preventDefault();
				this._movePoint(this._options.pageStep);
				break;
			case 'PageDown':
				event.preventDefault();
				this._movePoint(-this._options.pageStep);
				break;
			case 'Home':
				event.preventDefault();
				if (this._points.length > 0) {
					this._setActivePoint(0);
				}
				break;
			case 'End':
				event.preventDefault();
				if (this._points.length > 0) {
					this._setActivePoint(this._points.length - 1);
				}
				break;
			case '+':
			case '=':
				event.preventDefault();
				this._zoom(true);
				break;
			case '-':
			case '_':
				event.preventDefault();
				this._zoom(false);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				this._announce(this._describe());
				break;
			case 'h':
			case 'H':
				event.preventDefault();
				this._announce(this._helpText());
				this._setShortcutsOpen(!this._shortcutsOpen);
				break;
			case 'Escape':
				if (this._shortcutsOpen) {
					event.preventDefault();
					this._setShortcutsOpen(false);
				}
				break;
			default:
				break;
		}
	};

	private _helpText(): string {
		return this._messages.help({
			multiSeries: this._seriesList.length > 1,
			pageStep: this._options.pageStep,
		});
	}

	// region Navigation -----------------------------------------------------------------

	/**
	 * Logical index of a data point on the chart's shared time scale. A series'
	 * own data indices need not match the scale (a series can start later or
	 * skip points), so every viewport comparison goes through this mapping.
	 */
	private _logicalIndexOf(point: SeriesDataPoint): number | null {
		return this._chart?.timeScale().timeToIndex(point.time, true) ?? null;
	}

	/** Index of the first point whose logical index is >= `target` (`points.length` when none is). */
	private _lowerBoundByLogical(points: readonly SeriesDataPoint[], target: number): number {
		let low = 0;
		let high = points.length;
		while (low < high) {
			const mid = (low + high) >> 1;
			const logical = this._logicalIndexOf(points[mid]);
			if (logical !== null && logical < target) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		return low;
	}

	/** Index of the point closest (by logical index) to `target`; `points` must be non-empty. */
	private _nearestIndexByLogical(points: readonly SeriesDataPoint[], target: number): number {
		const last = points.length - 1;
		const upper = this._lowerBoundByLogical(points, target);
		if (upper <= 0) {
			return 0;
		}
		if (upper > last) {
			return last;
		}
		const before = this._logicalIndexOf(points[upper - 1]);
		const after = this._logicalIndexOf(points[upper]);
		if (before === null || after === null) {
			return upper;
		}
		return target - before <= after - target ? upper - 1 : upper;
	}

	private _visibleBounds(points: readonly SeriesDataPoint[]): { from: number; to: number } | null {
		const range = this._chart?.timeScale().getVisibleLogicalRange();
		const last = points.length - 1;
		if (!range || last < 0) {
			return null;
		}
		const from = this._lowerBoundByLogical(points, Math.ceil(range.from));
		// Last point whose logical index is <= floor(range.to).
		const to = this._lowerBoundByLogical(points, Math.floor(range.to) + 1) - 1;
		// `from > last`: every point is left of the viewport; `to < from`: every
		// point is right of it. Both mean nothing is visible – do not clamp the
		// result into a fake one-point range.
		if (from > last || to < from) {
			return null;
		}
		return { from, to };
	}

	private _movePoint(delta: number): void {
		if (this._points.length === 0) {
			return;
		}
		const last = this._points.length - 1;
		const base =
			this._activePointIndex < 0
				? this._firstVisibleIndex()
				: this._activePointIndex + delta;
		// Navigation spans the whole series; _setActivePoint pages the viewport so
		// the target stays on screen, giving keyboard users access to every point.
		this._setActivePoint(clamp(base, 0, last));
	}

	private _moveSeries(delta: number): void {
		if (this._seriesList.length <= 1) {
			return;
		}
		const next = clamp(this._activeSeriesIndex + delta, 0, this._seriesList.length - 1);
		if (next === this._activeSeriesIndex) {
			return;
		}
		// Series in a pane need not share timestamps (e.g. a moving average that
		// starts later), so carry the focused *time* across, not the raw index:
		// the nearest point in time is selected in the new series.
		const previousPoint = this._points[this._activePointIndex];
		const targetLogical = previousPoint ? this._logicalIndexOf(previousPoint) : null;
		this._activeSeriesIndex = next;
		this._refreshActivePoints();
		if (this._activePointIndex >= 0 && this._points.length > 0) {
			this._activePointIndex = targetLogical !== null
				? this._nearestIndexByLogical(this._points, targetLogical)
				: clamp(this._activePointIndex, 0, this._points.length - 1);
			this._scrollActiveIntoView();
		}
		const series = this._activeSeries();
		const label = series ? this._seriesLabel(series, next) : '';
		this._positionIndicator();
		const pointPart =
			this._activePointIndex >= 0 ? ` ${this._describePoint(this._activePointIndex)}` : '';
		this._announce(this._messages.seriesPosition({
			label,
			position: next + 1,
			total: this._seriesList.length,
			point: pointPart,
		}));
	}

	private _firstVisibleIndex(): number {
		const range = this._chart?.timeScale().getVisibleLogicalRange();
		if (!range || this._points.length === 0) {
			return 0;
		}
		return clamp(
			this._lowerBoundByLogical(this._points, Math.ceil(range.from)),
			0,
			this._points.length - 1
		);
	}

	private _setActivePoint(index: number): void {
		this._activePointIndex = index;
		this._scrollActiveIntoView();
		this._positionIndicator();
		this._announce(this._describePoint(index));
	}

	/**
	 * Pages the visible logical range so the active point stays on screen. Runs for
	 * every navigation step, so the arrow / Page / Home / End keys can traverse the
	 * whole series even when only part of it is visible. The window is nudged by the
	 * smallest amount that reveals the point (rather than recentring it) so stepping
	 * past an edge scrolls smoothly.
	 */
	private _scrollActiveIntoView(): void {
		const chart = this._chart;
		if (!chart || this._points.length === 0) {
			return;
		}
		const timeScale = chart.timeScale();
		const range = timeScale.getVisibleLogicalRange();
		if (!range) {
			return;
		}
		const point = this._points[this._activePointIndex];
		if (!point) {
			return;
		}
		// Compare in the time scale's logical indices, which need not match this
		// series' own data indices (e.g. a moving average that starts later).
		const index = this._logicalIndexOf(point);
		if (index === null) {
			return;
		}
		const span = range.to - range.from;
		// Keep a one-point margin from the edge (when the window is wide enough) so
		// the following point is already visible after a step.
		const margin = span > 4 ? 1 : 0;
		let from: number;
		if (index < range.from + margin) {
			from = index - margin;
		} else if (index > range.to - margin) {
			from = index - span + margin;
		} else {
			return; // already comfortably within view
		}
		const lastLogical = this._logicalIndexOf(this._points[this._points.length - 1]) ?? index;
		from = clamp(from, 0, Math.max(0, lastLogical));
		timeScale.setVisibleLogicalRange({ from, to: from + span });
	}

	/**
	 * Zooms the time scale in / out (the `+` / `-` keys), as the keyboard tutorial
	 * does, by shrinking / growing the visible logical span. The focused point is
	 * kept at the same position on screen so the user does not lose their place.
	 */
	private _zoom(zoomIn: boolean): void {
		const chart = this._chart;
		if (!chart) {
			return;
		}
		const timeScale = chart.timeScale();
		const range = timeScale.getVisibleLogicalRange();
		if (!range) {
			return;
		}
		const span = range.to - range.from;
		if (span <= 0) {
			return;
		}
		const newSpan = Math.max(MIN_ZOOM_SPAN, span * (zoomIn ? 1 - ZOOM_STEP : 1 + ZOOM_STEP));
		// Anchor on the focused point (else the viewport centre) and keep it at the
		// same relative position, so zooming does not scroll the point off screen.
		const point = this._points[this._activePointIndex];
		const anchor = (point ? this._logicalIndexOf(point) : null) ?? (range.from + range.to) / 2;
		const ratio = (anchor - range.from) / span;
		const from = anchor - ratio * newSpan;
		timeScale.setVisibleLogicalRange({ from, to: from + newSpan });
		this._positionIndicator();
	}

	// region Announcements --------------------------------------------------------------

	private _announce(message: string): void {
		this._liveWriter.write(message);
	}

	private _formatValue(value: number | undefined, series: AnySeries | null = this._activeSeries()): string {
		if (value === undefined) {
			return this._messages.noValue;
		}
		if (this._options.priceFormatter) {
			return this._options.priceFormatter(value);
		}
		// Honour a chart that is already localised (e.g. a currency formatter set on
		// localization.priceFormatter) before falling back to the series formatter.
		// Note: this also formats deltas and individual OHLC fields, not just prices.
		const chartPriceFormatter = this._chart?.options().localization.priceFormatter;
		if (chartPriceFormatter) {
			return chartPriceFormatter(value as BarPrice);
		}
		try {
			return series?.priceFormatter().format(value) ?? String(value);
		} catch {
			return String(value);
		}
	}

	private _formatTime(time: Time): string {
		if (this._options.timeFormatter) {
			return this._options.timeFormatter(time);
		}
		const chartTimeFormatter = this._chart?.options().localization.timeFormatter;
		if (chartTimeFormatter) {
			return chartTimeFormatter(time);
		}
		return defaultTimeFormatter(time, this._locale());
	}

	private _activeSeriesLabel(): string {
		const series = this._activeSeries();
		return series ? this._seriesLabel(series, this._activeSeriesIndex) : '';
	}

	private _describePoint(index: number): string {
		const point = this._points[index];
		if (!point) {
			return '';
		}
		// Position is reported against the whole series ("Point 247 of 500") so it
		// is unambiguous and independent of the (asynchronously updated) viewport.
		return this._messages.point({
			position: index + 1,
			total: this._points.length,
			time: this._formatTime(point.time),
			label: this._activeSeriesLabel(),
			values: this._describeValues(point),
		});
	}

	/**
	 * Spoken value(s) for a point: the full open / high / low / close for OHLC
	 * series (bar, candlestick), otherwise the single value. The OHLC assembly
	 * (order, separators) is delegated to {@link AccessibilityMessages.ohlcValues}
	 * so it is fully localisable.
	 */
	private _describeValues(point: SeriesDataPoint, series: AnySeries | null = this._activeSeries()): string {
		if ('close' in point && typeof point.close === 'number') {
			// `'close' in point` narrows to the OHLC data types (bar / candlestick).
			const field = (value: number | undefined): string | null =>
				typeof value === 'number' ? this._formatValue(value, series) : null;
			return this._messages.ohlcValues({
				labels: this._messages.ohlc,
				open: field(point.open),
				high: field(point.high),
				low: field(point.low),
				close: this._formatValue(point.close, series),
			});
		}
		return this._formatValue(extractValue(point), series);
	}

	private _scopedPoints(points: readonly SeriesDataPoint[] = this._points): readonly SeriesDataPoint[] {
		if (this._options.dataScope !== 'visible') {
			return points;
		}
		// A viewport scrolled fully past the data is an empty scope, not the
		// whole series.
		const bounds = this._visibleBounds(points);
		return bounds ? points.slice(bounds.from, bounds.to + 1) : [];
	}

	private _describe(): string {
		const label = this._activeSeriesLabel();
		const scoped = this._scopedPoints();
		if (this._options.describeChart) {
			return this._options.describeChart(scoped, label);
		}
		const valued = scoped.filter(p => extractValue(p) !== undefined);
		if (valued.length === 0) {
			return this._messages.noData({ label, scopeNote: this._scopeNote() });
		}
		const first = valued[0];
		const last = valued[valued.length - 1];
		let low = first;
		let high = first;
		for (const point of valued) {
			const value = extractValue(point) as number;
			if (value < (extractValue(low) as number)) {
				low = point;
			}
			if (value > (extractValue(high) as number)) {
				high = point;
			}
		}
		const firstValue = extractValue(first) as number;
		const lastValue = extractValue(last) as number;
		const change = lastValue - firstValue;
		// Percent is undefined when the series starts at zero (avoids a misleading
		// "up by 12, 0 percent"); the summary drops the clause in that case.
		const percent = firstValue !== 0 ? (change / firstValue) * 100 : null;
		const direction: 'up' | 'down' | 'unchanged' = change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged';

		return this._messages.summary({
			label,
			count: valued.length,
			scopeNote: this._scopeNote(),
			firstValue: this._formatValue(firstValue),
			firstTime: this._formatTime(first.time),
			lastValue: this._formatValue(lastValue),
			lastTime: this._formatTime(last.time),
			direction,
			directionLabel: this._messages.directions[direction],
			changeValue: this._formatValue(Math.abs(change)),
			percent: percent !== null ? this._formatPercent(Math.abs(percent)) : null,
			lowValue: this._formatValue(extractValue(low)),
			lowTime: this._formatTime(low.time),
			highValue: this._formatValue(extractValue(high)),
			highTime: this._formatTime(high.time),
		});
	}

	// region Data synchronisation -------------------------------------------------------

	/**
	 * Reconciles our per-series `subscribeDataChanged` subscriptions with the
	 * series currently in the pane. Cheap to call on every redraw: it only reads
	 * the already-allocated series handles and returns early unless the set of
	 * series changed, so scrolling and zooming never re-read or re-hash bar data.
	 * Actual data-content changes are delivered by the subscriptions instead.
	 */
	private _syncSeries(): void {
		const pane = this._pane();
		if (!pane) {
			return;
		}
		const current = pane.getSeries();
		if (this._sameSeriesList(current)) {
			return;
		}
		for (const [series, handler] of this._dataChangedHandlers) {
			if (!current.includes(series)) {
				series.unsubscribeDataChanged(handler);
				this._dataChangedHandlers.delete(series);
				this._dirtySeries.delete(series);
			}
		}
		for (const series of current) {
			if (!this._dataChangedHandlers.has(series)) {
				const handler = (): void => this._handleSeriesDataChanged(series);
				series.subscribeDataChanged(handler);
				this._dataChangedHandlers.set(series, handler);
			}
		}
		this._seriesList = current.slice();
		if (this._activeSeriesIndex >= this._seriesList.length) {
			this._activeSeriesIndex = Math.max(0, this._seriesList.length - 1);
		}
		this._refreshActivePoints();
		this._updatePaneLabel();
		this._updateDescription();
		this._positionIndicator();
	}

	private _sameSeriesList(current: readonly AnySeries[]): boolean {
		if (current.length !== this._seriesList.length) {
			return false;
		}
		return current.every((series, index) => series === this._seriesList[index]);
	}

	/**
	 * Fired by the library when a series' data actually changes (set/update) – not
	 * on scroll or zoom. Nothing is read or copied here: the active series'
	 * navigation cache is refreshed only while the pane is in use, and update
	 * announcements read the changed series once per debounced flush.
	 */
	private _handleSeriesDataChanged(series: AnySeries): void {
		const index = this._seriesList.indexOf(series);
		if (index < 0) {
			return;
		}
		if (index === this._activeSeriesIndex) {
			if (this._hasFocus) {
				this._refreshActivePoints();
				this._positionIndicator();
			} else {
				this._activePointsStale = true;
			}
		}
		if (this._options.announceDataUpdates) {
			this._dirtySeries.add(series);
			if (this._updateAnnouncer) {
				// Shared region: the announcer owns the single debounce timer and
				// pulls our summaries at flush time via the internal PluginLink.
				this._updateAnnouncer.notifyDirty(this);
			} else {
				this._scheduleUpdateAnnouncement();
			}
		}
	}

	private _scheduleUpdateAnnouncement(): void {
		if (this._announceUpdateHandle !== null) {
			clearTimeout(this._announceUpdateHandle);
		}
		this._announceUpdateHandle = setTimeout(() => {
			this._announceUpdateHandle = null;
			this._flushUpdateAnnouncement();
		}, UPDATE_DEBOUNCE_MS);
	}

	private _flushUpdateAnnouncement(): void {
		// _collectPendingUpdateSummaries always clears the dirty set; the writer
		// no-ops when the region is gone or the message is empty.
		const message = formatUpdateMessage(this._collectPendingUpdateSummaries(), this._messages);
		this._statusWriter.write(message);
	}

	/**
	 * Returns this pane's pending per-series update summaries and clears the dirty
	 * set. Honours {@link AccessibilityOptions.announceDataUpdates} and
	 * {@link AccessibilityOptions.dataScope}. Reached from the standalone flush and,
	 * for the shared region, the {@link UpdateAnnouncer} via the internal PluginLink.
	 */
	private _collectPendingUpdateSummaries(): string[] {
		if (!this._options.announceDataUpdates || this._dirtySeries.size === 0) {
			this._dirtySeries.clear();
			return [];
		}
		// Iterate _seriesList so the summaries keep the pane's series order.
		const changed = this._seriesList.filter(series => this._dirtySeries.has(series));
		this._dirtySeries.clear();
		return changed.map(series => this._seriesUpdateSummary(series));
	}

	private _unsubscribeAll(): void {
		for (const [series, handler] of this._dataChangedHandlers) {
			series.unsubscribeDataChanged(handler);
		}
		this._dataChangedHandlers.clear();
		this._dirtySeries.clear();
	}

	/** Re-reads the active series' data into the navigation cache. */
	private _refreshActivePoints(): void {
		const series = this._activeSeries();
		this._points = series ? series.data() : [];
		this._activePointsStale = false;
		if (this._activePointIndex >= this._points.length) {
			this._activePointIndex = this._points.length - 1;
		}
	}

	private _seriesUpdateSummary(series: AnySeries): string {
		const data = series.data();
		const scoped = this._scopedPoints(data);
		// 'Latest' reports the newest bar – the one the update actually changed –
		// which can sit outside the visible range; only the count is scoped.
		let value: number | undefined;
		for (let i = data.length - 1; i >= 0 && value === undefined; i--) {
			value = extractValue(data[i]);
		}
		return this._messages.seriesUpdate({
			label: this._seriesLabel(series, this._seriesList.indexOf(series)),
			count: scoped.length,
			scopeNote: this._scopeNote(),
			latest: this._formatValue(value, series),
		});
	}

	// region Visible focus indicator ----------------------------------------------------

	private _positionIndicator(): void {
		const indicator = this._focusIndicator;
		if (!indicator) {
			return;
		}
		const chart = this._chart;
		const series = this._activeSeries();
		const point = this._points[this._activePointIndex];
		const value = extractValue(point);
		// Hide on any missing prerequisite – including "all series were removed"
		// – so the ring never lingers at stale coordinates.
		if (
			!chart ||
			!series ||
			!point ||
			value === undefined ||
			!this._options.showFocusIndicator ||
			!this._hasFocus
		) {
			indicator.style.display = 'none';
			return;
		}
		const x = chart.timeScale().timeToCoordinate(point.time);
		const y = series.priceToCoordinate(value);
		if (x === null || y === null) {
			// Off-screen (e.g. mid-scroll) – hide until it comes back into view.
			indicator.style.display = 'none';
			return;
		}
		// The indicator lives inside the pane's canvas wrapper, so both
		// coordinates are already local to its positioning context.
		indicator.style.left = `${x}px`;
		indicator.style.top = `${y}px`;
		indicator.style.display = 'block';
	}
}

type UpdateAnnouncerMode = 'active' | 'combine';

/**
 * A single chart-level polite live region shared by all per-pane
 * {@link AccessibilityPlugin} instances created by {@link addAccessibilityPlugin}.
 *
 * Each pane plugin keeps its own assertive region for navigation, but routing
 * every background *data-update* announcement through one region avoids the case
 * where several panes mutate their own polite regions in the same tick and a
 * screen reader only voices the last one.
 *
 * - `'active'` mode announces only the last-focused pane (falling back to pane 0).
 * - `'combine'` mode merges the changed series from every reporting pane into one
 *   message, in pane order.
 */
class UpdateAnnouncer {
	private _region: HTMLElement | null;
	private _mode: UpdateAnnouncerMode;
	private readonly _plugins: AccessibilityPlugin[] = [];
	private readonly _dirty = new Set<AccessibilityPlugin>();
	private _handle: ReturnType<typeof setTimeout> | null = null;
	private readonly _writer = new LiveRegionWriter(() => this._region);
	// The plugin whose pane was focused last. Tracked by identity, not by pane
	// index – indices shift when panes are added or removed.
	private _activePlugin: AccessibilityPlugin | null = null;
	private _messages: AccessibilityMessages;

	public constructor(host: HTMLElement, mode: UpdateAnnouncerMode, messages: AccessibilityMessages, lang?: string) {
		this._mode = mode;
		this._messages = messages;
		const region = document.createElement('div');
		region.className = 'lw-chart-a11y-shared-status-region';
		region.setAttribute('aria-live', 'polite');
		region.setAttribute('aria-atomic', 'true');
		if (lang) {
			region.setAttribute('lang', lang);
		}
		region.style.cssText = VISUALLY_HIDDEN;
		host.appendChild(region);
		this._region = region;
	}

	/** Registers a pane plugin; registration order is pane order. */
	public register(plugin: AccessibilityPlugin): void {
		this._plugins.push(plugin);
	}

	public setActivePlugin(plugin: AccessibilityPlugin): void {
		this._activePlugin = plugin;
	}

	/** Reconfigures the shared region at runtime (mode / messages / lang). */
	public configure(mode: UpdateAnnouncerMode, messages: AccessibilityMessages, lang?: string): void {
		this._mode = mode;
		this._messages = messages;
		if (this._region) {
			if (lang) {
				this._region.setAttribute('lang', lang);
			} else {
				this._region.removeAttribute('lang');
			}
		}
	}

	public notifyDirty(plugin: AccessibilityPlugin): void {
		this._dirty.add(plugin);
		// Start-once (do not reset): a sub-debounce-interval stream still announces
		// periodically instead of having its timer pushed out indefinitely.
		if (this._handle === null) {
			this._handle = setTimeout(() => {
				this._handle = null;
				this._flush();
			}, UPDATE_DEBOUNCE_MS);
		}
	}

	public dispose(): void {
		if (this._handle !== null) {
			clearTimeout(this._handle);
			this._handle = null;
		}
		this._writer.dispose();
		this._region?.remove();
		this._region = null;
		this._plugins.length = 0;
		this._dirty.clear();
		this._activePlugin = null;
	}

	private _flush(): void {
		const summaries: string[] = [];
		// Nothing focused yet falls back to the first registered pane (pane 0).
		const active = this._activePlugin ?? this._plugins[0];
		// Iterate in registration (pane) order so the combined message is stable.
		for (const plugin of this._plugins) {
			if (!this._dirty.has(plugin)) {
				continue;
			}
			// Always collect (and clear) the plugin's pending summaries; keep them
			// only when combining or when this is the active pane.
			const pending = pluginLinks.get(plugin)?.collectPendingUpdateSummaries() ?? [];
			if (this._mode === 'combine' || plugin === active) {
				summaries.push(...pending);
			}
		}
		this._dirty.clear();
		this._writer.write(formatUpdateMessage(summaries, this._messages));
	}
}

export interface AccessibilityPluginController {
	readonly plugins: readonly AccessibilityPlugin[];
	detach(): void;
	focus(paneIndex?: number): void;
	refresh(): void;
	/**
	 * Updates chart-level options at runtime, keeping the per-pane layers and the
	 * shared update region in sync — including `announceDataUpdates` (active /
	 * combine), `messages` and `lang`, which the per-pane `applyOptions` alone
	 * cannot change on the shared region.
	 */
	applyOptions(options: AccessibilityChartOptions): void;
}

export type AccessibilityChartOptions = Omit<
	Partial<AccessibilityOptions>,
	'chartTitle' | 'paneIndex' | 'announceDataUpdates'
> & {
	chartTitle?: string | ((paneIndex: number) => string);
	/**
	 * Which panes announce background data updates.
	 *
	 * - `'active'` (default): only the last-focused pane (pane 0 until something is
	 *   focused). Avoids several panes talking over each other.
	 * - `true`: every pane; simultaneous updates merge into one announcement.
	 * - `false`: none.
	 * - `(paneIndex) => boolean`: choose per pane; the enabled panes are combined.
	 */
	announceDataUpdates?: boolean | 'active' | ((paneIndex: number) => boolean);
};

export function addAccessibilityPlugin(
	chart: IChartApiBase<Time>,
	options: AccessibilityChartOptions = {}
): AccessibilityPluginController {
	const entries: { pane: IPaneApi<Time>; plugin: AccessibilityPlugin }[] = [];
	let announcer: UpdateAnnouncer | null = null;
	// Mutable so the controller's applyOptions can reconfigure at runtime.
	let current: AccessibilityChartOptions = { ...options };

	// 'active' (default) announces only the focused pane; a boolean / predicate
	// announces those panes and the announcer combines them into one message.
	const announcerMode = (): UpdateAnnouncerMode =>
		current.announceDataUpdates === undefined || current.announceDataUpdates === 'active' ? 'active' : 'combine';
	const resolveAnnounce = (paneIndex: number): boolean => {
		const announce = current.announceDataUpdates;
		if (announce === undefined || announce === 'active') {
			// All panes report; the announcer filters down to the active pane.
			return true;
		}
		return typeof announce === 'function' ? announce(paneIndex) : announce;
	};
	const resolveLang = (): string | undefined =>
		current.lang ?? (chart.options().localization.locale || undefined);

	const resolveOptions = (paneIndex: number): Partial<AccessibilityOptions> => {
		const { chartTitle, ...rest } = current;
		const resolved: Partial<AccessibilityOptions> = {
			...rest,
			paneIndex,
			announceDataUpdates: resolveAnnounce(paneIndex),
		};
		if (chartTitle !== undefined) {
			resolved.chartTitle = typeof chartTitle === 'function'
				? chartTitle(paneIndex)
				: chartTitle;
		}
		return resolved;
	};

	const detach = (): void => {
		const disposing = announcer;
		announcer = null;
		while (entries.length > 0) {
			const entry = entries.pop();
			if (entry) {
				pluginLinks.get(entry.plugin)?.attachAnnouncer(null);
				entry.pane.detachPrimitive(entry.plugin);
			}
		}
		// Remove the shared region only after the per-pane plugins are torn down.
		disposing?.dispose();
	};

	const attach = (): void => {
		detach();
		const sharedAnnouncer = new UpdateAnnouncer(
			chart.chartElement(),
			announcerMode(),
			mergeMessages(defaultMessages, current.messages),
			resolveLang()
		);
		announcer = sharedAnnouncer;
		chart.panes().forEach((pane, paneIndex) => {
			const plugin = new AccessibilityPlugin(resolveOptions(paneIndex));
			pane.attachPrimitive(plugin);
			pluginLinks.get(plugin)?.attachAnnouncer(sharedAnnouncer);
			sharedAnnouncer.register(plugin);
			entries.push({ pane, plugin });
		});
	};

	const applyOptions = (next: AccessibilityChartOptions): void => {
		current = { ...current, ...next };
		// Keep the shared region (mode / messages / lang) and every pane in sync.
		announcer?.configure(announcerMode(), mergeMessages(defaultMessages, current.messages), resolveLang());
		entries.forEach(({ plugin }, paneIndex) => plugin.applyOptions(resolveOptions(paneIndex)));
	};

	attach();

	return {
		get plugins(): readonly AccessibilityPlugin[] {
			return entries.map(entry => entry.plugin);
		},
		detach,
		focus(paneIndex = 0): void {
			entries[paneIndex]?.plugin.focus();
		},
		refresh: attach,
		applyOptions,
	};
}
