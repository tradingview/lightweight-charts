import { BarPrice, IChartApiBase, Time } from 'lightweight-charts';

import { defaultTimeFormatter } from './describe';
import { AccessibilityMessages } from './messages';
import { AccessibilityPaneOptions } from './options';
import { AnySeries } from './types';

/** What the formatters read on every call, so they always see the current chart and options. */
export interface FormatterState {
	chart: IChartApiBase<Time> | null;
	options: AccessibilityPaneOptions;
	messages: AccessibilityMessages;
}

/**
 * Turns numbers and times into the strings the announcements speak.
 *
 * The precedence is the plugin's own option, then the chart's `localization`
 * formatter, then a sensible default – so a chart that is already localised gets
 * localised announcements for free.
 */
export class Formatters {
	private readonly _state: () => FormatterState;
	// Memoised percent formatter, rebuilt only when the chart's locale changes.
	private _percentFormatter: Intl.NumberFormat | null = null;
	private _percentLocale: string | undefined;

	public constructor(state: () => FormatterState) {
		this._state = state;
	}

	/** The chart's current locale, or `undefined` (e.g. server-side `''`) for the runtime default. */
	public locale(): string | undefined {
		const locale = this._state().chart?.options().localization.locale;
		return locale ? locale : undefined;
	}

	public value(value: number | undefined, series: AnySeries | null): string {
		const { chart, options, messages } = this._state();
		if (value === undefined) {
			return messages.noValue;
		}
		if (options.priceFormatter) {
			return options.priceFormatter(value);
		}
		// Honour a chart that is already localised (e.g. a currency formatter set on
		// localization.priceFormatter) before falling back to the series formatter.
		// Note: this also formats deltas and individual OHLC fields, not just prices.
		const chartPriceFormatter = chart?.options().localization.priceFormatter;
		if (chartPriceFormatter) {
			return chartPriceFormatter(value as BarPrice);
		}
		try {
			return series?.priceFormatter().format(value) ?? String(value);
		} catch {
			return String(value);
		}
	}

	public time(time: Time): string {
		const { chart, options } = this._state();
		if (options.timeFormatter) {
			return options.timeFormatter(time);
		}
		const chartTimeFormatter = chart?.options().localization.timeFormatter;
		if (chartTimeFormatter) {
			return chartTimeFormatter(time);
		}
		return defaultTimeFormatter(time, this.locale());
	}

	public percent(value: number): string {
		const locale = this.locale();
		if (this._percentFormatter === null || this._percentLocale !== locale) {
			this._percentLocale = locale;
			this._percentFormatter = new Intl.NumberFormat(locale, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
		}
		return this._percentFormatter.format(value);
	}
}
