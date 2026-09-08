import { Time } from 'lightweight-charts';

import { PartialAccessibilityMessages } from './messages';
import { AnySeries, SeriesDataPoint } from './types';

/** What the summary describes: the whole data set or only the visible range. */
export type AccessibilityDataScope = 'all' | 'visible';

/** The context passed to {@link AccessibilityPaneOptions.describeChart}. */
export interface DescribeChartContext {
	/** The points the summary should describe, already narrowed to {@link AccessibilityPaneOptions.dataScope}. */
	points: readonly SeriesDataPoint[];
	/** The series the points belong to, or `null` when the pane has none. */
	series: AnySeries | null;
	/** Accessible label of that series (see {@link AccessibilityPaneOptions.seriesLabel}). */
	label: string;
	/** The scope `points` was narrowed with, so a custom summary can word itself accordingly. */
	scope: AccessibilityDataScope;
}

/**
 * Options for a single {@link AccessibilityPlugin} pane primitive.
 *
 * Every option has a sensible default. For normal chart-level integration use
 * {@link addAccessibilityPlugin} with {@link AccessibilityOptions}; it creates one
 * primitive per pane:
 *
 * ```js
 * addAccessibilityPlugin(chart, { chartTitle: 'Apple daily close' });
 * ```
 */
export interface AccessibilityPaneOptions {
	/**
	 * Human readable title for the pane. Announced by screen readers when the
	 * pane receives focus and used as the accessible name of the pane region.
	 * Defaults to {@link AccessibilityMessages.defaultChartTitle}.
	 */
	chartTitle?: string;
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
	 * `aria-live` region. The chart-level helper sets this per pane from
	 * {@link AccessibilityOptions.dataUpdates}.
	 */
	announceDataUpdates: boolean;
	/**
	 * How long (in milliseconds) data changes are coalesced before they are
	 * announced. A live feed can tick far faster than a screen reader can speak,
	 * so this window keeps the announcements readable.
	 */
	updateDebounceMs: number;
	/** Maximum number of changed series listed in a single update announcement. */
	updateMaxSeries: number;
	/** Fraction the visible range grows / shrinks per `+` / `-` keypress. */
	zoomStep: number;
	/** Smallest visible logical span (in bars) that zooming in will produce. */
	minZoomSpan: number;
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
	dataScope: AccessibilityDataScope;
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
	 * `Space`. Takes precedence over {@link AccessibilityMessages.summary}.
	 */
	describeChart?: (context: DescribeChartContext) => string;
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
	 * the controls. Screen-reader users always get the spoken `H` help regardless
	 * of this option. Defaults to `false`.
	 */
	showShortcuts: boolean;
	/**
	 * High-contrast styling for the plugin's own visuals (focus ring, focus outline
	 * and the shortcuts overlay). `'auto'` (default) follows the OS
	 * `prefers-contrast` / `forced-colors`; pass a boolean to drive it from your
	 * own setting with `applyOptions({ highContrast })`. This does not restyle the
	 * chart's series / grid / font — use {@link onHighContrastChange} for that.
	 */
	highContrast: boolean | 'auto';
	/**
	 * Called when the resolved high-contrast state changes (and once on attach),
	 * so the host can restyle the chart's own series / grid / font to match.
	 */
	onHighContrastChange?: (enabled: boolean) => void;
}

export const defaultPaneOptions: AccessibilityPaneOptions = {
	showFocusIndicator: true,
	focusIndicatorColor: '#2962FF',
	focusIndicatorSize: 14,
	announceDataUpdates: true,
	updateDebounceMs: 1000,
	updateMaxSeries: 3,
	zoomStep: 0.2,
	minZoomSpan: 2,
	pageStep: 10,
	dataScope: 'visible',
	showShortcuts: false,
	highContrast: 'auto',
};

/** Which panes announce background data updates, and how they are coalesced. */
export interface DataUpdatesOptions {
	/**
	 * - `'active'` (default): only the last-focused pane announces (pane 0 until
	 *   something is focused). Avoids several panes talking over each other.
	 * - `'all'`: every pane announces; simultaneous updates merge into one message.
	 * - `'none'`: no update announcements.
	 */
	mode: 'active' | 'all' | 'none';
	/**
	 * Restricts announcements to the panes this predicate accepts. Applied on top
	 * of `mode`, so `'active'` still speaks for one pane at a time.
	 */
	panes?: (paneIndex: number) => boolean;
	/**
	 * Window (in milliseconds) over which data changes are coalesced before being
	 * announced. Defaults to {@link AccessibilityPaneOptions.updateDebounceMs}.
	 */
	debounceMs?: number;
}

/**
 * Options for {@link addAccessibilityPlugin}. Everything a single pane accepts,
 * plus a per-pane `chartTitle` resolver and the chart-level `dataUpdates`
 * settings that drive the shared announcement region.
 */
export type AccessibilityOptions = Omit<
	Partial<AccessibilityPaneOptions>,
	'chartTitle' | 'announceDataUpdates' | 'updateDebounceMs'
> & {
	/** A single title for every pane, or a resolver called with each pane's index. */
	chartTitle?: string | ((paneIndex: number) => string);
	/** Which panes announce background data updates. Defaults to `{ mode: 'active' }`. */
	dataUpdates?: DataUpdatesOptions;
};

/** @deprecated Use {@link AccessibilityOptions}. */
export type AccessibilityChartOptions = AccessibilityOptions;
