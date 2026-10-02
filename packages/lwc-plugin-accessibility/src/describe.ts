import { convertTimeUTC } from '@tradingview/lwc-toolkit/time';
import { Time } from 'lightweight-charts';

import { AccessibilityMessages } from './messages';
import { AccessibilityTimeFormat, PointRange, RangeAccessor, ValueAccessor } from './options';
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
	/** Formats a difference between two values (see {@link Formatters.change}). */
	formatChange: (value: number, series: AnySeries | null) => string;
	formatTime: (time: Time) => string;
	formatPercent: (value: number) => string;
	/** Reads the announced value of a point, honouring the `valueAccessor` option. */
	value: (point: SeriesDataPoint | undefined, series: AnySeries | null) => number | undefined;
	/** Reads a point's high / low (and open / close), honouring `rangeAccessor`. */
	range: (point: SeriesDataPoint | undefined, series: AnySeries | null) => PointRange | undefined;
}

/**
 * Extracts the representative numeric value from a data point, if it has one.
 * Value-based series (line, area, …) carry `value`; OHLC series (bar,
 * candlestick) carry `close`; whitespace points carry neither. Custom series
 * carry whatever their author chose, hence the {@link ValueAccessor} option.
 */
export function extractValue(
	point: SeriesDataPoint | undefined,
	series: AnySeries | null = null,
	accessor?: ValueAccessor
): number | undefined {
	if (!point) {
		return undefined;
	}
	if (accessor) {
		const custom = accessor(point, series);
		if (typeof custom === 'number' && Number.isFinite(custom)) {
			return custom;
		}
	}
	if ('value' in point && typeof point.value === 'number') {
		return point.value;
	}
	if ('close' in point && typeof point.close === 'number') {
		return point.close;
	}
	return undefined;
}

/**
 * The point's high / low band (with open / close when it has them), used both
 * for the spoken OHLC values and for the summary's extremes – a candle's high
 * is a real high, not its close.
 */
export function extractRange(
	point: SeriesDataPoint | undefined,
	series: AnySeries | null = null,
	accessor?: RangeAccessor
): PointRange | undefined {
	if (!point) {
		return undefined;
	}
	if (accessor) {
		const custom = accessor(point, series);
		if (custom && Number.isFinite(custom.high) && Number.isFinite(custom.low)) {
			return custom;
		}
	}
	if ('high' in point && typeof point.high === 'number' && 'low' in point && typeof point.low === 'number') {
		const open = 'open' in point && typeof point.open === 'number' ? point.open : undefined;
		const close = 'close' in point && typeof point.close === 'number' ? point.close : undefined;
		return { high: point.high, low: point.low, open, close };
	}
	return undefined;
}

/** The plugin's fallback time formatter: a locale-aware, UTC-based date (and time). */
export function defaultTimeFormatter(
	time: Time,
	locale?: string,
	format: AccessibilityTimeFormat = 'date'
): string {
	const timestamp = convertTimeUTC(time);
	if (!Number.isFinite(timestamp)) {
		// A business-day string that does not match `YYYY-MM-DD`: speak it verbatim.
		return typeof time === 'string' ? time : String(time);
	}
	const date = new Date(timestamp);
	const dateParts: Intl.DateTimeFormatOptions =
		format === 'time' ? {} : { year: 'numeric', month: 'short', day: 'numeric' };
	const timeParts: Intl.DateTimeFormatOptions =
		format === 'date'
			? {}
			: format === 'seconds'
				? { hour: '2-digit', minute: '2-digit', second: '2-digit' }
				: { hour: '2-digit', minute: '2-digit' };
	// `locale || undefined` guards against the empty-string locale used server-side,
	// which is not a valid Intl locale. Formatting must be in UTC: the library
	// renders the time axis in UTC, and business days convert to UTC-midnight
	// instants that would otherwise shift a day in timezones west of UTC.
	return date.toLocaleString(locale || undefined, { ...dateParts, ...timeParts, timeZone: 'UTC' });
}

/**
 * Spoken value(s) for a point: the full open / high / low / close for OHLC
 * series (bar, candlestick, or a custom series with a `rangeAccessor`),
 * otherwise the single value. The OHLC assembly (order, separators) is
 * delegated to {@link AccessibilityMessages.ohlcValues} so it is fully
 * localisable.
 */
export function describeValues(env: DescribeEnv, point: SeriesDataPoint, series: AnySeries | null): string {
	const range = env.range(point, series);
	const value = env.value(point, series);
	if (range && (range.close !== undefined || value !== undefined)) {
		const field = (field: number | undefined): string | null =>
			typeof field === 'number' ? env.formatValue(field, series) : null;
		return env.messages.ohlcValues({
			labels: env.messages.ohlc,
			open: field(range.open),
			high: field(range.high),
			low: field(range.low),
			close: env.formatValue(range.close ?? value, series),
		});
	}
	return env.formatValue(value, series);
}

/** The announcement for the point at `index`, or `''` when there is no such point. */
export function describePoint(
	env: DescribeEnv,
	points: readonly SeriesDataPoint[],
	index: number,
	label: string,
	series: AnySeries | null,
	/** Pre-formatted extras (markers) appended to the announcement, or `''`. */
	notes: string = ''
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
	}) + notes;
}

/** The built-in `Enter` / `Space` summary of `points` (already narrowed to the data scope). */
export function describeSummary(
	env: DescribeEnv,
	points: readonly SeriesDataPoint[],
	label: string,
	series: AnySeries | null,
	/** Pre-formatted extras (price lines) appended to the summary, or `''`. */
	notes: string = ''
): string {
	const valued = points.filter((point: SeriesDataPoint) => env.value(point, series) !== undefined);
	if (valued.length === 0) {
		return env.messages.noData({ label, scopeNote: env.scopeNote });
	}
	const first = valued[0];
	const last = valued[valued.length - 1];
	// The extremes come from each point's high / low where it has them, so a
	// candlestick summary reports the real high of the range, not the highest
	// close.
	const highOf = (point: SeriesDataPoint): number =>
		env.range(point, series)?.high ?? (env.value(point, series) as number);
	const lowOf = (point: SeriesDataPoint): number =>
		env.range(point, series)?.low ?? (env.value(point, series) as number);
	let low = first;
	let high = first;
	for (const point of valued) {
		if (lowOf(point) < lowOf(low)) {
			low = point;
		}
		if (highOf(point) > highOf(high)) {
			high = point;
		}
	}
	const firstValue = env.value(first, series) as number;
	const lastValue = env.value(last, series) as number;
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
		changeValue: env.formatChange(Math.abs(change), series),
		percent: percent !== null ? env.formatPercent(Math.abs(percent)) : null,
		lowValue: env.formatValue(lowOf(low), series),
		lowTime: env.formatTime(low.time),
		highValue: env.formatValue(highOf(high), series),
		highTime: env.formatTime(high.time),
	}) + notes;
}

/** One changed series' contribution to a data-update announcement. */
export function describeSeriesUpdate(
	env: DescribeEnv,
	args: { label: string; series: AnySeries; latest: SeriesDataPoint | null; scopedCount: number }
): string {
	// 'Latest' reports the newest bar – the one the update actually changed –
	// which can sit outside the visible range; only the count is scoped.
	return env.messages.seriesUpdate({
		label: args.label,
		count: args.scopedCount,
		scopeNote: env.scopeNote,
		latest: env.formatValue(env.value(args.latest ?? undefined, args.series), args.series),
	});
}
