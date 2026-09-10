import { RoundedCandleSeriesOptions, RoundedCandleUpDownMode } from './options';

/** The open/close pair and the per-item color overrides of one candle. */
export interface CandleColorSource {
	open: number;
	close: number;
	color?: string;
	borderColor?: string;
	wickColor?: string;
}

/** The three colors one candle is painted with. */
export interface ResolvedCandleColors {
	/** Fill color of the body. */
	bodyColor: string;
	/** Color of the body border. */
	borderColor: string;
	/** Color of the wick. */
	wickColor: string;
}

/**
 * Whether a candle counts as rising. `previousClose` is the close of the
 * preceding data point, or `-Infinity` for the first one.
 */
export function isUpCandle(
	candle: Pick<CandleColorSource, 'open' | 'close'>,
	previousClose: number,
	mode: RoundedCandleUpDownMode
): boolean {
	if (mode === 'previousClose') {
		return candle.close >= previousClose;
	}
	return candle.open <= candle.close;
}

/**
 * Resolves the colors of one candle the way the library does: a per-item
 * `color`, `borderColor` or `wickColor` wins, then the `borderColor` and
 * `wickColor` shorthands, then the rising/falling option pair.
 */
export function resolveCandleColors(
	candle: CandleColorSource,
	isUp: boolean,
	options: RoundedCandleSeriesOptions
): ResolvedCandleColors {
	return {
		bodyColor: candle.color ?? (isUp ? options.upColor : options.downColor),
		borderColor:
			candle.borderColor ??
			(options.borderColor ||
				(isUp ? options.borderUpColor : options.borderDownColor)),
		wickColor:
			candle.wickColor ??
			(options.wickColor ||
				(isUp ? options.wickUpColor : options.wickDownColor)),
	};
}
