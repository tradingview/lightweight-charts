import { Time, isBusinessDay, isUTCTimestamp } from 'lightweight-charts';

import { AccessibilityMessages } from './messages';
import { AnySeries, SeriesDataPoint } from './types';

/**
 * Everything the description helpers need from the plugin. Values and times
 * arrive through the callbacks, so this module stays free of chart state.
 */
export interface DescribeEnv {
	messages: AccessibilityMessages;
	/** Localised, leading-spaced scope note for summaries, or `''` when not scoped. */
	scopeNote: string;
	formatValue: (value: number | undefined, series: AnySeries | null) => string;
	formatTime: (time: Time) => string;
	formatPercent: (value: number) => string;
}

/**
 * Extracts the representative numeric value from a data point, if it has one.
 * Value-based series (line, area, …) carry `value`; OHLC series (bar,
 * candlestick) carry `close`; whitespace points carry neither.
 */
export function extractValue(point: SeriesDataPoint | undefined): number | undefined {
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

/** The plugin's fallback time formatter: a locale-aware, UTC-based short date. */
export function defaultTimeFormatter(time: Time, locale?: string): string {
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

/**
 * Spoken value(s) for a point: the full open / high / low / close for OHLC
 * series (bar, candlestick), otherwise the single value. The OHLC assembly
 * (order, separators) is delegated to {@link AccessibilityMessages.ohlcValues}
 * so it is fully localisable.
 */
export function describeValues(env: DescribeEnv, point: SeriesDataPoint, series: AnySeries | null): string {
	if ('close' in point && typeof point.close === 'number') {
		// `'close' in point` narrows to the OHLC data types (bar / candlestick).
		const field = (value: number | undefined): string | null =>
			typeof value === 'number' ? env.formatValue(value, series) : null;
		return env.messages.ohlcValues({
			labels: env.messages.ohlc,
			open: field(point.open),
			high: field(point.high),
			low: field(point.low),
			close: env.formatValue(point.close, series),
		});
	}
	return env.formatValue(extractValue(point), series);
}

/** The announcement for the point at `index`, or `''` when there is no such point. */
export function describePoint(
	env: DescribeEnv,
	points: readonly SeriesDataPoint[],
	index: number,
	label: string,
	series: AnySeries | null
): string {
	const point = points[index];
	if (!point) {
		return '';
	}
	// Position is reported against the whole series ("Point 247 of 500") so it
	// is unambiguous and independent of the (asynchronously updated) viewport.
	return env.messages.point({
		position: index + 1,
		total: points.length,
		time: env.formatTime(point.time),
		label,
		values: describeValues(env, point, series),
	});
}

/** The built-in `Enter` / `Space` summary of `points` (already narrowed to the data scope). */
export function describeSummary(
	env: DescribeEnv,
	points: readonly SeriesDataPoint[],
	label: string,
	series: AnySeries | null
): string {
	const valued = points.filter(point => extractValue(point) !== undefined);
	if (valued.length === 0) {
		return env.messages.noData({ label, scopeNote: env.scopeNote });
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

	return env.messages.summary({
		label,
		count: valued.length,
		scopeNote: env.scopeNote,
		firstValue: env.formatValue(firstValue, series),
		firstTime: env.formatTime(first.time),
		lastValue: env.formatValue(lastValue, series),
		lastTime: env.formatTime(last.time),
		direction,
		directionLabel: env.messages.directions[direction],
		changeValue: env.formatValue(Math.abs(change), series),
		percent: percent !== null ? env.formatPercent(Math.abs(percent)) : null,
		lowValue: env.formatValue(extractValue(low), series),
		lowTime: env.formatTime(low.time),
		highValue: env.formatValue(extractValue(high), series),
		highTime: env.formatTime(high.time),
	});
}

/** One changed series' contribution to a data-update announcement. */
export function describeSeriesUpdate(
	env: DescribeEnv,
	args: { label: string; series: AnySeries; data: readonly SeriesDataPoint[]; scopedCount: number }
): string {
	// 'Latest' reports the newest bar – the one the update actually changed –
	// which can sit outside the visible range; only the count is scoped.
	let value: number | undefined;
	for (let i = args.data.length - 1; i >= 0 && value === undefined; i--) {
		value = extractValue(args.data[i]);
	}
	return env.messages.seriesUpdate({
		label: args.label,
		count: args.scopedCount,
		scopeNote: env.scopeNote,
		latest: env.formatValue(value, args.series),
	});
}
