import { DeepPartial } from '../helpers/strict-type-checks';

import { LineStyle, LineWidth } from '../renderers/draw-line';

import { PriceScaleMargins } from './price-scale';

/** Structure describing a drawing style of the candlestick chart  */
export interface CandleStyleOptions {
	/** Color of rising candlesticks */
	upColor: string;
	/** Color of falling candlesticks */
	downColor: string;
	/** Flag to draw/hide candlestick wicks */
	wickVisible: boolean;
	/** Flag to draw/hide candlestick borders around bodies */
	borderVisible: boolean;
	/**
	 * Color of borders around candles' bodies. Ignored if borderVisible == false
	 * If specified, it overrides both borderUpColor and borderDownColor options
	 */
	borderColor: string;
	/** Color of the border of rising candlesticks. Ignored if borderVisible == false or borderColor is specified */
	borderUpColor: string;
	/** Color of the border of rising candlesticks. Ignored if borderVisible == false or borderColor is specified */
	borderDownColor: string;

	/**
	 * Color of candlestick wicks. Ignored if wickVisible == false
	 * If specified, it overrides both wickUpColor and wickDownColor options
	 */
	wickColor: string;
	/** Color of rising candlestick wicks. Ignored if wickVisible == false or wickColor is specified */
	wickUpColor: string;
	/** Color of falling candlestick wicks. Ignored if wickVisible == false or wickColor is specified */
	wickDownColor: string;
}

export function fillUpDownCandlesColors(options: DeepPartial<CandleStyleOptions>): void {
	if (options.borderColor !== undefined) {
		options.borderUpColor = options.borderColor;
		options.borderDownColor = options.borderColor;
	}
	if (options.wickColor !== undefined) {
		options.wickUpColor = options.wickColor;
		options.wickDownColor = options.wickColor;
	}
}

export interface BarStyleOptions {
	upColor: string;
	downColor: string;
	openVisible: boolean;
	thinBars: boolean;
}

export interface LineStyleOptions {
	color: string;
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	crosshairMarkerVisible: boolean;
	crosshairMarkerRadius: number;
}

export interface AreaStyleOptions {
	topColor: string;
	bottomColor: string;
	lineColor: string;
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	crosshairMarkerVisible: boolean;
	crosshairMarkerRadius: number;
}

export interface HistogramStyleOptions {
	color: string;
	base: number;
	lineWidth: number;
}

/**
 * Structure describing series values formatting
 * Fields precision and minMove allow wide customization of formatting
 * @example
 * minMove = 0.01 , precision is not specified. Prices will change like 1.13, 1.14, 1.15 etc.
 * minMove = 0.01 , precision = 3. Prices will change like 1.130, 1.140, 1.150 etc.
 * minMove = 0.05 , precision is not specified. Prices will change like 1.10, 1.15, 1.20
 */
export interface PriceFormat {
	/**
	 *  Enum of possible modes of price formatting
	 * 'price' is the most common choice; it allows customization of precision and rounding of prices
	 * 'volume' uses abbreviation for formatting prices like '1.2K' or '12.67M'
	 * 'percent' uses '%' sign at the end of prices.
	 */
	type: 'price' | 'volume' | 'percent';
	/**
	 * Number of digits after the decimal point.
	 * If it is not set, then its value is calculated automatically based on minMove
	 */
	precision: number;
	/**
	 * Minimal step of the price. This value shouldn't have more decimal digits than the precision
	 */
	minMove: number;
}

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

export interface OverlaySeriesSpecificOptions {
	overlay: true;
	scaleMargins?: PriceScaleMargins;
}

export interface NonOverlaySeriesSpecificOptions {
	overlay: false;
	scaleMargins?: never;
}

/**
 * Structure describing options common for all types of series
 */
export interface SeriesOptionsCommon {
	/** Visibility of the price line. Price line is a horizontal line indicating the last price of the series */
	priceLineVisible: boolean;
	/** Visibility of the label with the latest visible price on the price scale */
	lastValueVisible: boolean;

	/**
	 * @internal
	 */
	seriesLastValueMode?: PriceAxisLastValueMode;

	/** Width of the price line. Ignored if priceLineVisible is false */
	priceLineWidth: LineWidth;
	/** Color of the price line. Ignored if priceLineVisible is false */
	priceLineColor: string;
	/** Formatting settings associated with the series */
	priceFormat: PriceFormat;
	/** Color of the base line in IndexedTo100 mode */
	baseLineColor: string;
	title?: string;
}

export type SeriesOptionsBase =
	| (SeriesOptionsCommon & OverlaySeriesSpecificOptions)
	| (SeriesOptionsCommon & NonOverlaySeriesSpecificOptions);

/**
 * Structure describing area series options. It inherits all options of the base interface
 */
export type AreaSeriesOptions = SeriesOptionsBase & AreaStyleOptions;

/**
 * Structure describing bar series options. It inherits all options of the base interface
 */
export type BarSeriesOptions = SeriesOptionsBase & BarStyleOptions;

/**
 * Structure describing candlesticks series options. It inherits all options of the base interface
 */
export type CandleSeriesOptions = SeriesOptionsBase & CandleStyleOptions;

/**
 * Structure describing histogram series options. It inherits all options of the base interface
 */
export type HistogramSeriesOptions = SeriesOptionsBase & HistogramStyleOptions;

/**
 * Structure describing line series options. It inherits all options of the base interface
 */
export type LineSeriesOptions = SeriesOptionsBase & LineStyleOptions;

export interface SeriesOptionsMap {
	Bar: BarSeriesOptions;
	Candle: CandleSeriesOptions;
	Area: AreaSeriesOptions;
	Line: LineSeriesOptions;
	Histogram: HistogramSeriesOptions;
}

export type SeriesType = keyof SeriesOptionsMap;
