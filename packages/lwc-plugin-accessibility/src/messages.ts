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

/** Column headers of the "view as table" panel. */
export interface TableColumnLabels {
	time: string;
	value: string;
	open: string;
	high: string;
	low: string;
	close: string;
}

/** Fields passed to {@link AccessibilityMessages.paneLabel}. */
export interface PaneLabelArgs {
	/** The resolved `chartTitle`, or {@link AccessibilityMessages.defaultChartTitle} when it is unset. */
	title: string;
	/** 0-based index of this pane on the chart. */
	paneIndex: number;
	/** Total number of panes on the chart, so multi-pane labels can be made distinct. */
	paneCount: number;
	seriesCount: number;
	seriesLabel: string | null;
}

/**
 * Every screen-reader string produced by the plugin. Atomic strings are localised
 * directly; sentences are formatter functions so a translation controls word order
 * and pluralisation. All numeric / date values arrive **pre-formatted**, and
 * position counters are **1-based**, so a message function only assembles words.
 *
 * Override some or all entries via {@link AccessibilityPaneOptions.messages};
 * anything left out falls back to the built-in English {@link defaultMessages}.
 */
export interface AccessibilityMessages {
	/** Spoken role of the pane region (`aria-roledescription`). */
	roleDescription: string;
	/** Pane title used when {@link AccessibilityPaneOptions.chartTitle} is not set. */
	defaultChartTitle: string;
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
	paneLabel: (args: PaneLabelArgs) => string;
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
	/** The `Enter` / `Space` summary. Bypassed entirely when {@link AccessibilityPaneOptions.describeChart} is set. */
	summary: (args: SummaryArgs) => string;
	/** Summary when the active series has no valued points in scope (`scopeNote` as in {@link summary}). */
	noData: (args: { label: string; scopeNote: string }) => string;
	/** One series' contribution to a data-update announcement. */
	seriesUpdate: (args: { label: string; count: number; scopeNote: string; latest: string }) => string;
	/** Wraps the per-series update summaries into one announcement (`total` >= 1). */
	dataUpdated: (args: { summaries: readonly string[]; total: number; shownMax: number }) => string;
	/** Announced on `+` / `-`, and on focus when `announceOnFocus` is set. */
	visibleRange: (args: { from: string; to: string; count: number }) => string;
	/** Appended to a point announcement when markers sit on that point. */
	markerNote: (args: { texts: readonly string[] }) => string;
	/** Appended to the summary when the active series has price lines. */
	priceLinesNote: (args: { lines: readonly { title: string; value: string }[] }) => string;
	/** Column headers of the "view as table" panel. */
	tableColumns: TableColumnLabels;
	/** Caption of the table panel, and the announcement made when it opens. */
	tableCaption: (args: { label: string; count: number; scopeNote: string }) => string;
	/** Note appended to the caption when the rows were capped by `tableMaxRows`. */
	tableTruncated: (args: { shown: number; total: number }) => string;
	/** Hint shown at the foot of the table panel. */
	tableClose: string;
}

/** A partial {@link AccessibilityMessages} override: top-level entries and the string groups are each optional. */
export type PartialAccessibilityMessages =
	Partial<Omit<AccessibilityMessages, 'ohlc' | 'directions' | 'tableColumns'>> & {
		ohlc?: Partial<OhlcLabels>;
		directions?: Partial<DirectionLabels>;
		tableColumns?: Partial<TableColumnLabels>;
	};

/**
 * Built-in English strings. Reproduces the plugin's original wording exactly; use
 * as a template for a translation.
 *
 * The bundle (and its nested `ohlc` / `directions` groups) is frozen and therefore
 * **read-only**: translate by passing your own entries through
 * {@link AccessibilityPaneOptions.messages}, never by mutating this object.
 */
export const defaultMessages: AccessibilityMessages = {
	roleDescription: 'Interactive chart pane',
	defaultChartTitle: 'Interactive financial chart',
	noValue: 'no value',
	inView: 'in view',
	ohlc: { open: 'open', high: 'high', low: 'low', close: 'close' },
	directions: { up: 'up', down: 'down', unchanged: 'unchanged' },
	defaultSeriesLabel: (position: number): string => `Series ${position}`,
	paneLabel: ({ title, paneIndex, paneCount, seriesCount, seriesLabel }): string => {
		// Several panes sharing one title would otherwise be indistinguishable.
		const panePart = paneCount > 1 ? `Pane ${paneIndex + 1} of ${paneCount}. ` : '';
		const seriesPart =
			seriesCount > 1
				? `${seriesCount} series. `
				: seriesLabel
					? `${seriesLabel}. `
					: '';
		return `${title}. ${panePart}${seriesPart}Press H for keyboard help.`;
	},
	description: ({ multiSeries }): string =>
		multiSeries
			? 'Use the left and right arrow keys to move between data points, and the up and down arrows to switch series.'
			: 'Use the left and right arrow keys to move between data points.',
	help: ({ multiSeries, pageStep }): string =>
		`Keyboard controls. Left and right arrows move between data points. ${multiSeries ? 'Up and down arrows switch between series. ' : ''}Page Up jumps ${pageStep} points forward, Page Down ${pageStep} points back. Home and End jump to the first and last points. Plus and minus zoom the chart in and out. Enter or Space reads a summary of the series. T shows the data as a table, and Escape closes it.`,
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
		{ keys: 'T', action: 'View the data as a table' },
		{ keys: 'H', action: 'Show or hide this panel' },
		{ keys: 'Esc', action: 'Close the open panel' },
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
	visibleRange: ({ from, to, count }): string =>
		`Showing ${count} data points, from ${from} to ${to}.`,
	markerNote: ({ texts }): string =>
		texts.length === 0 ? '' : ` ${texts.length === 1 ? 'Marker' : 'Markers'}: ${texts.join('; ')}.`,
	priceLinesNote: ({ lines }): string =>
		lines.length === 0
			? ''
			: ` ${lines.length === 1 ? 'Price line' : 'Price lines'}: ${lines.map(line => `${line.title} at ${line.value}`).join(', ')}.`,
	tableColumns: { time: 'Time', value: 'Value', open: 'Open', high: 'High', low: 'Low', close: 'Close' },
	tableCaption: ({ label, count, scopeNote }): string =>
		`${label}: ${count} data points${scopeNote}.`,
	tableTruncated: ({ shown, total }): string => `Showing the first ${shown} of ${total} rows.`,
	tableClose: 'Press Escape or T to close.',
};

Object.freeze(defaultMessages.ohlc);
Object.freeze(defaultMessages.directions);
Object.freeze(defaultMessages.tableColumns);
Object.freeze(defaultMessages);

/**
 * Overlays a partial override onto {@link defaultMessages}. Top-level entries
 * replace wholesale; the known string groups (`ohlc`, `directions`) shallow-merge.
 * Keep the group list in sync if a new nested group is added to the interface.
 */
export function mergeMessages(base: AccessibilityMessages, override?: PartialAccessibilityMessages): AccessibilityMessages {
	if (!override) {
		return base;
	}
	const merged: AccessibilityMessages = {
		...base,
		...override,
		ohlc: { ...base.ohlc, ...override.ohlc },
		directions: { ...base.directions, ...override.directions },
		tableColumns: { ...base.tableColumns, ...override.tableColumns },
	};
	// An explicit `undefined` in the override must not erase a default entry.
	(Object.keys(merged) as (keyof AccessibilityMessages)[]).forEach(key => {
		if (merged[key] === undefined) {
			(merged as unknown as Record<string, unknown>)[key] = base[key];
		}
	});
	return merged;
}

/**
 * Builds the spoken text for a batch of changed-series summaries. Shared by the
 * standalone per-pane path and the chart-level shared update region. Returns an
 * empty string when there is nothing to announce.
 */
export function formatUpdateMessage(
	summaries: readonly string[],
	messages: AccessibilityMessages,
	maxSeries: number
): string {
	if (summaries.length === 0) {
		return '';
	}
	return messages.dataUpdated({ summaries, total: summaries.length, shownMax: maxSeries });
}
