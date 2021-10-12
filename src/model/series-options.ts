import { DeepPartial } from '../helpers/strict-type-checks';

import { LineStyle, LineType, LineWidth } from '../renderers/draw-line';

import { AutoScaleMargins } from './autoscale-info-impl';
import { PriceFormatterFn } from './price-formatter-fn';
import { PriceScaleMargins } from './price-scale';

/** Candlestick style options. */
export interface CandlestickStyleOptions {
	/**
	 * Color of rising candles.
	 *
	 * @default '#26a69a'
	 */
	upColor: string;
	/**
	 * Color of falling candles.
	 *
	 * @default '#ef5350'
	 */
	downColor: string;
	/**
	 * Enable high and low prices candle wicks.
	 *
	 * @default true
	 */
	wickVisible: boolean;
	/**
	 * Enable candle borders.
	 *
	 * @default true
	 */
	borderVisible: boolean;
	/**
	 * Border color.
	 *
	 * @default '#378658'
	 */
	borderColor: string;
	/**
	 * Border color of rising candles.
	 *
	 * @default '#26a69a'
	 */
	borderUpColor: string;
	/**
	 * Border color of falling candles.
	 *
	 * @default '#ef5350'
	 */
	borderDownColor: string;
	/**
	 * Wick color.
	 *
	 * @default '#737375'
	 */
	wickColor: string;
	/**
	 * Wick color of rising candles.
	 *
	 * @default '#26a69a'
	 */
	wickUpColor: string;
	/**
	 * Wick color of falling candles.
	 *
	 * @default '#ef5350'
	 */
	wickDownColor: string;
}

export function fillUpDownCandlesticksColors(options: Partial<CandlestickStyleOptions>): void {
	if (options.borderColor !== undefined) {
		options.borderUpColor = options.borderColor;
		options.borderDownColor = options.borderColor;
	}
	if (options.wickColor !== undefined) {
		options.wickUpColor = options.wickColor;
		options.wickDownColor = options.wickColor;
	}
}

/**
 * The `LastPriceAnimationMode` enum is used to specify the type of the last price animation for series such as area or line.
 */
export const enum LastPriceAnimationMode {
	/**
	 * Animation is always disabled
	 */
	Disabled,
	/**
	 * Animation is always enabled.
	 */
	Continuous,
	/**
	 * Animation is active after new data.
	 */
	OnDataUpdate,
}

// we cannot create re-export of const enum because of TypeScript bug https://github.com/microsoft/TypeScript/issues/45850
/** @deprecated it doesn't really matter what we write here, because it doesn't work properly, but just to mark the thing we have to delete in the next major update */
export { LastPriceAnimationMode as LasPriceAnimationMode };

export interface BarStyleOptions {
	/**
	 * Color of rising bars.
	 *
	 * @default '#26a69a'
	 */
	upColor: string;
	/**
	 * Color of falling bars.
	 *
	 * @default '#ef5350'
	 */
	downColor: string;
	/**
	 * Show open lines on bars.
	 *
	 * @default true
	 */
	openVisible: boolean;
	/**
	 * Show bars as sticks.
	 *
	 * @default true
	 */
	thinBars: boolean;
}

export interface LineStyleOptions {
	/**
	 * Line color.
	 *
	 * @default '#2196f3'
	 */
	color: string;
	/**
	 * Line style.
	 *
	 * @default LineStyle.Solid
	 */
	lineStyle: LineStyle;
	/**
	 * Line width in pixels.
	 *
	 * @default 3
	 */
	lineWidth: LineWidth;
	/**
	 * Line type.
	 *
	 * @default LineType.Simple
	 */
	lineType: LineType;
	/**
	 * Show the crosshair marker.
	 *
	 * @default
	 */
	crosshairMarkerVisible: boolean;
	/**
	 * Crosshair marker radius in pixels.
	 *
	 * @default
	 */
	crosshairMarkerRadius: number;
	/**
	 * Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.
	 *
	 * @default ''
	 */
	crosshairMarkerBorderColor: string;
	/**
	 * The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.
	 *
	 * @default ''
	 */
	crosshairMarkerBackgroundColor: string;
	/**
	 * Last price animation mode.
	 *
	 * @default LastPriceAnimationMode.Disabled
	 */
	lastPriceAnimation: LastPriceAnimationMode;
}

export interface AreaStyleOptions {
	topColor: string;
	bottomColor: string;
	lineColor: string;
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	lineType: LineType;
	crosshairMarkerVisible: boolean;
	crosshairMarkerRadius: number;
	crosshairMarkerBorderColor: string;
	crosshairMarkerBackgroundColor: string;
	lastPriceAnimation: LastPriceAnimationMode;
}

export interface HistogramStyleOptions {
	/**
	 * Column color.
	 *
	 * @default '#26a69a'
	 */
	color: string;
	/**
	 * Initial level of histogram columns.
	 *
	 * @default 0
	 */
	base: number;
}

/**
 * Structure describing series values formatting
 * Fields precision and minMove allow wide customization of formatting
 *
 * @example
 * minMove = 0.01 , precision is not specified. Prices will change like 1.13, 1.14, 1.15 etc.
 * minMove = 0.01 , precision = 3. Prices will change like 1.130, 1.140, 1.150 etc.
 * minMove = 0.05 , precision is not specified. Prices will change like 1.10, 1.15, 1.20
 */

export interface PriceFormatBuiltIn {
	/**
	 * Built-in price formats.
	 * 'price' is the most common choice; it allows customization of precision and rounding of prices.
	 * 'volume' uses abbreviation for formatting prices like '1.2K' or '12.67M'.
	 * 'percent' uses '%' sign at the end of prices.
	 *
	 * @default 'price'
	 */
	type: 'price' | 'volume' | 'percent';
	/**
	 * Number of digits after the decimal point.
	 * If it is not set, then its value is calculated automatically based on minMove.
	 *
	 * @default 2
	 */
	precision: number;
	/**
	 * Minimal step of the price. This value shouldn't have more decimal digits than the precision.
	 *
	 * @default 0.01
	 */
	minMove: number;
}

export interface PriceFormatCustom {
	type: 'custom';
	/**
	 * Override price fomatting behaviour. Can be used for cases that can't be covered with built-in price formats.
	 */
	formatter: PriceFormatterFn;
	/**
	 * Minimal step of the price.
	 *
	 * @default 0.01
	 */
	minMove: number;
}

export type PriceFormat = PriceFormatBuiltIn | PriceFormatCustom;

export function precisionByMinMove(minMove: number): number {
	if (minMove >= 1) {
		return 0;
	}
	let i = 0;
	for (; i < 8; i++) {
		const intPart = Math.round(minMove);
		const fractPart = Math.abs(intPart - minMove);
		if (fractPart < 1e-8) {
			return i;
		}
		minMove = minMove * 10;
	}
	return i;
}

export const enum PriceAxisLastValueMode {
	LastPriceAndPercentageValue,
	LastValueAccordingToScale,
}

/**
 * The `PriceLineSource` enum is used to specify the source of data to be
 * used for the horizontal price line.
 */
export const enum PriceLineSource {
	/**
	 * Use the last bar data.
	 */
	LastBar,
	/**
	 * Use the last visible data of the chart viewport.
	 */
	LastVisible,
}

export interface PriceRange {
	minValue: number;
	maxValue: number;
}

export interface AutoscaleInfo {
	priceRange: PriceRange;
	margins?: AutoScaleMargins;
}

type AutoscaleInfoProvider = (baseImplementation: () => AutoscaleInfo | null) => AutoscaleInfo | null;

/**
 * Structure describing options common for all types of series
 */
export interface SeriesOptionsCommon {
	/**
	 * Visibility of the label with the latest visible price on the price scale.
	 *
	 * @default true
	 */
	lastValueVisible: boolean;
	/** Title of the series. This label is placed with price axis label */
	title: string;

	/** Target price scale to bind new series to */
	priceScaleId?: string;

	/**
	 * @internal
	 */
	seriesLastValueMode?: PriceAxisLastValueMode;
	/** Show the series. */
	visible: boolean;
	/**
	 * Show the price line. Price line is a horizontal line indicating the last price of the series.
	 *
	 * @default true
	 * */
	priceLineVisible: boolean;
	/** The source to use for the value of the price line.
	 *
	 * @default PriceLineSource.LastBar
	*/
	priceLineSource: PriceLineSource;
	/**
	 * Width of the price line.
	 *
	 * @default 1
	 */
	priceLineWidth: LineWidth;
	/**
	 * Color of the price line.
	 *
	 * @default ''
	 */
	priceLineColor: string;
	/**
	 * Price line style.
	 *
	 * @default LineStyle.Dotted
	 */
	priceLineStyle: LineStyle;
	/** Price format. */
	priceFormat: PriceFormat;
	/**
	 * Visibility of base line. Suitable for percentage and `IndexedTo100` scales.
	 *
	 * @default true
	 */
	baseLineVisible: boolean;
	/**
	 * Color of the base line in `IndexedTo100` mode.
	 *
	 * @default '#B2B5BE'
	 */
	baseLineColor: string;
	/**
	 * Base line width. Suitable for percentage and `IndexedTo10` scales.
	 *
	 * @default 1
	 */
	baseLineWidth: LineWidth;
	/**
	 * Base line style. Suitable for percentage and indexedTo100 scales.
	 *
	 * @default LineStyle.Solid
	 */
	baseLineStyle: LineStyle;
	/** Override the default {@link AutoscaleInfo} provider. */
	autoscaleInfoProvider?: AutoscaleInfoProvider;
	/**
	 * @deprecated Use priceScaleId instead.
	 * @internal
	 */
	overlay?: boolean;
	/** @deprecated Use priceScale method of the series to apply options instead. */
	scaleMargins?: PriceScaleMargins;
}

export type SeriesOptions<T> = T & SeriesOptionsCommon;
export type SeriesPartialOptions<T> = DeepPartial<T & SeriesOptionsCommon>;

/**
 * Structure describing area series options.
 */
export type AreaSeriesOptions = SeriesOptions<AreaStyleOptions>;
export type AreaSeriesPartialOptions = SeriesPartialOptions<AreaStyleOptions>;

/**
 * Structure describing bar series options.
 */
export type BarSeriesOptions = SeriesOptions<BarStyleOptions>;
export type BarSeriesPartialOptions = SeriesPartialOptions<BarStyleOptions>;

/**
 * Structure describing candlesticks series options.
 */
export type CandlestickSeriesOptions = SeriesOptions<CandlestickStyleOptions>;
export type CandlestickSeriesPartialOptions = SeriesPartialOptions<CandlestickStyleOptions>;

/**
 * Structure describing histogram series options.
 */
export type HistogramSeriesOptions = SeriesOptions<HistogramStyleOptions>;
export type HistogramSeriesPartialOptions = SeriesPartialOptions<HistogramStyleOptions>;

/**
 * Structure describing line series options.
 */
export type LineSeriesOptions = SeriesOptions<LineStyleOptions>;
export type LineSeriesPartialOptions = SeriesPartialOptions<LineStyleOptions>;

export interface SeriesOptionsMap {
	Bar: BarSeriesOptions;
	Candlestick: CandlestickSeriesOptions;
	Area: AreaSeriesOptions;
	Line: LineSeriesOptions;
	Histogram: HistogramSeriesOptions;
}

export interface SeriesPartialOptionsMap {
	Bar: BarSeriesPartialOptions;
	Candlestick: CandlestickSeriesPartialOptions;
	Area: AreaSeriesPartialOptions;
	Line: LineSeriesPartialOptions;
	Histogram: HistogramSeriesPartialOptions;
}

export type SeriesType = keyof SeriesOptionsMap;
