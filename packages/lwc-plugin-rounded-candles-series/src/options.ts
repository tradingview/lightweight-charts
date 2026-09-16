import {
	CandlestickSeriesOptions,
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';
import { RoundedCandleRadius } from './radius';

/**
 * How a candle is decided to be rising or falling.
 *
 * - `openClose` — `open <= close`, exactly what the built-in candlestick
 *   series does.
 * - `previousClose` — the close is compared with the previous candle's close.
 *   The first candle is always rising.
 */
export type RoundedCandleUpDownMode = 'openClose' | 'previousClose';

/** Shape of the two wick ends. */
export type RoundedCandleWickLineCap = 'butt' | 'round';

export interface RoundedCandleSeriesOptions
	extends CustomSeriesOptions,
		Omit<CandlestickSeriesOptions, 'borderColor' | 'wickColor'> {
	/**
	 * Border color of both rising and falling candles. Overrides
	 * `borderUpColor` and `borderDownColor` while it is set; leave it out (or
	 * set it to an empty string) to use those two instead.
	 */
	borderColor?: string;
	/**
	 * Wick color of both rising and falling candles. Overrides `wickUpColor`
	 * and `wickDownColor` while it is set; leave it out (or set it to an empty
	 * string) to use those two instead.
	 */
	wickColor?: string;
	/** Corner radius of the candle body, in CSS pixels. */
	radius: RoundedCandleRadius;
	/** How a candle is decided to be rising or falling. */
	upDownMode: RoundedCandleUpDownMode;
	/** Shape of the two wick ends. */
	wickLineCap: RoundedCandleWickLineCap;
	/**
	 * Opacity of the candles other than the hovered one while the series is
	 * hovered. `1` (the default) leaves the series unchanged on hover.
	 */
	hoverDimOpacity: number;
}

export const defaultOptions: RoundedCandleSeriesOptions = {
	...customSeriesDefaultOptions,
	upColor: '#26a69a',
	downColor: '#ef5350',
	wickVisible: true,
	borderVisible: true,
	borderUpColor: '#26a69a',
	borderDownColor: '#ef5350',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
	radius: function (bs: number): number {
		if (bs < 4) {
			return 0;
		}
		return bs / 3;
	},
	upDownMode: 'openClose',
	wickLineCap: 'butt',
	hoverDimOpacity: 1,
} as const;
