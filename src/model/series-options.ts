import { DeepPartial } from '../helpers/strict-type-checks';

import { LineStyle, LineType, LineWidth } from '../renderers/draw-line';

import { AutoScaleMargins } from './autoscale-info-impl';
import { PriceFormatterFn } from './price-formatter-fn';
import { PriceScaleMargins } from './price-scale';

/**
 * Represents style options for a candlestick series.
 */
export interface CandlestickStyleOptions {
	/**
	 * Color of rising candles.
	 */
	upColor: string;
	/**
	 * Color of falling candles.
	 */
	downColor: string;
	/**
	 * Enable high and low prices candle wicks.
	 */
	wickVisible: boolean;
	/**
	 * Enable candle borders.
	 */
	borderVisible: boolean;
	/**
	 * Border color.
	 */
	borderColor: string;
	/**
	 * Border color of rising candles.
	 */
	borderUpColor: string;
	/**
	 * Border color of falling candles.
	 */
	borderDownColor: string;
	/**
	 * Wick color.
	 */
	wickColor: string;
	/**
	 * Wick color of rising candles.
	 */
	wickUpColor: string;
	/**
	 * Wick color of falling candles.
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
 * Represents the type of the last price animation for series such as area or line.
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

/**
 * Represents style options for a bar series.
 */
export interface BarStyleOptions {
	/**
	 * Color of rising bars.
	 */
	upColor: string;
	/**
	 * Color of falling bars.
	 */
	downColor: string;
	/**
	 * Show open lines on bars.
	 */
	openVisible: boolean;
	/**
	 * Show bars as sticks.
	 */
	thinBars: boolean;
}

/**
 * Represents style options for a line series.
 */
export interface LineStyleOptions {
	/**
	 * Line color.
	 */
	color: string;
	/**
	 * Line style.
	 */
	lineStyle: LineStyle;
	/**
	 * Line width in pixels.
	 */
	lineWidth: LineWidth;
	/**
	 * Line type.
	 */
	lineType: LineType;
	/**
	 * Show the crosshair marker.
	 */
	crosshairMarkerVisible: boolean;
	/**
	 * Crosshair marker radius in pixels.
	 */
	crosshairMarkerRadius: number;
	/**
	 * Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.
	 */
	crosshairMarkerBorderColor: string;
	/**
	 * The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.
	 */
	crosshairMarkerBackgroundColor: string;
	/**
	 * Last price animation mode.
	 */
	lastPriceAnimation: LastPriceAnimationMode;
}

/**
 * Represents style options for an area series.
 */
export interface AreaStyleOptions {
	/**
	 * Color of the top part of the area.
	 */
	topColor: string;
	/**
	 * Color of the bottom part of the area.
	 */
	bottomColor: string;
	/**
	 * Line color.
	 */
	lineColor: string;
	/**
	 * Line style.
	 */
	lineStyle: LineStyle;
	/**
	 * Line width in pixels.
	 */
	lineWidth: LineWidth;
	/**
	 * Line type.
	 */
	lineType: LineType;
	/**
	 * Show the crosshair marker.
	 */
	crosshairMarkerVisible: boolean;
	/**
	 * Crosshair marker radius in pixels.
	 */
	crosshairMarkerRadius: number;
	/**
	 * Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.
	 */
	crosshairMarkerBorderColor: string;
	/**
	 * The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.
	 */
	crosshairMarkerBackgroundColor: string;
	/**
	 * Last price animation mode.
	 */
	lastPriceAnimation: LastPriceAnimationMode;
}

/**
 * Represents a type of priced base value of baseline series type.
 */
export interface BaseValuePrice {
	/**
	 * Distinguished type value.
	 */
	type: 'price';

	/**
	 * Price value.
	 */
	price: number;
}

/**
 * Represents a type of a base value of baseline series type.
 */
export type BaseValueType = BaseValuePrice;

/**
 * Represents style options for a baseline series.
 */
export interface BaselineStyleOptions {
	/**
	 * Base value of the series.
	 */
	baseValue: BaseValueType;

	/**
	 * The first color of the top area.
	 */
	topFillColor1: string;
	/**
	 * The second color of the top area.
	 */
	topFillColor2: string;
	/**
	 * The line color of the top area.
	 */
	topLineColor: string;

	/**
	 * The first color of the bottom area.
	 */
	bottomFillColor1: string;
	/**
	 * The second color of the bottom area.
	 */
	bottomFillColor2: string;
	/**
	 * The line color of the bottom area.
	 */
	bottomLineColor: string;

	/**
	 * Line width.
	 */
	lineWidth: LineWidth;
	/**
	 * Line style.
	 */
	lineStyle: LineStyle;

	/**
	 * Show the crosshair marker.
	 */
	crosshairMarkerVisible: boolean;
	/**
	 * Crosshair marker radius in pixels.
	 */
	crosshairMarkerRadius: number;
	/**
	 * Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.
	 */
	crosshairMarkerBorderColor: string;
	/**
	 * The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.
	 */
	crosshairMarkerBackgroundColor: string;

	/**
	 * Last price animation mode.
	 */
	lastPriceAnimation: LastPriceAnimationMode;
}

/**
 * Represents style options for a histogram series.
 */
export interface HistogramStyleOptions {
	/**
	 * Column color.
	 */
	color: string;
	/**
	 * Initial level of histogram columns.
	 */
	base: number;
}

/**
 * Represents series value formatting options.
 * The precision and minMove properties allow wide customization of formatting.
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
	 */
	type: 'price' | 'volume' | 'percent';
	/**
	 * Number of digits after the decimal point.
	 * If it is not set, then its value is calculated automatically based on minMove.
	 */
	precision: number;
	/**
	 * Minimal step of the price. This value shouldn't have more decimal digits than the precision.
	 */
	minMove: number;
}

/**
 * Represents series value formatting options.
 */
export interface PriceFormatCustom {
	/**
	 * The custom price format.
	 */
	type: 'custom';
	/**
	 * Override price formatting behaviour. Can be used for cases that can't be covered with built-in price formats.
	 */
	formatter: PriceFormatterFn;
	/**
	 * Minimal step of the price.
	 */
	minMove: number;
}

/**
 * Represents information used to format prices.
 */
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
 * Represents the source of data to be used for the horizontal price line.
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

/**
 * Represents a price range.
 */
export interface PriceRange {
	/**
	 * Maximum value in the range.
	 */
	minValue: number;
	/**
	 * Minimum value in the range.
	 */
	maxValue: number;
}

/**
 * Represents information used to update a price scale.
 */
export interface AutoscaleInfo {
	/**
	 * Price range.
	 */
	priceRange: PriceRange;
	/**
	 * Scale margins.
	 */
	margins?: AutoScaleMargins;
}

/**
 * A custom function used to get autoscale information.
 */
type AutoscaleInfoProvider = (baseImplementation: () => AutoscaleInfo | null) => AutoscaleInfo | null;

/**
 * Represents options common for all types of series
 */
export interface SeriesOptionsCommon {
	/**
	 * Visibility of the label with the latest visible price on the price scale.
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
	 */
	priceLineVisible: boolean;
	/**
	 * The source to use for the value of the price line.
	 */
	priceLineSource: PriceLineSource;
	/**
	 * Width of the price line.
	 */
	priceLineWidth: LineWidth;
	/**
	 * Color of the price line.
	 */
	priceLineColor: string;
	/**
	 * Price line style.
	 */
	priceLineStyle: LineStyle;
	/** Price format. */
	priceFormat: PriceFormat;
	/**
	 * Visibility of base line. Suitable for percentage and `IndexedTo100` scales.
	 */
	baseLineVisible: boolean;
	/**
	 * Color of the base line in `IndexedTo100` mode.
	 */
	baseLineColor: string;
	/**
	 * Base line width. Suitable for percentage and `IndexedTo10` scales.
	 */
	baseLineWidth: LineWidth;
	/**
	 * Base line style. Suitable for percentage and indexedTo100 scales.
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

/**
 * Represents the intersection of a series type `T`'s options and common series options.
 *
 * @see {@link SeriesOptionsCommon} for common options.
 */
export type SeriesOptions<T> = T & SeriesOptionsCommon;
/**
 * Represents a {@link SeriesOptions} where every property is optional.
 */
export type SeriesPartialOptions<T> = DeepPartial<T & SeriesOptionsCommon>;

/**
 * Represents area series options.
 */
export type AreaSeriesOptions = SeriesOptions<AreaStyleOptions>;
/**
 * Represents area series options where all properties are optional.
 */
export type AreaSeriesPartialOptions = SeriesPartialOptions<AreaStyleOptions>;

/**
 * Structure describing baseline series options.
 */
export type BaselineSeriesOptions = SeriesOptions<BaselineStyleOptions>;
/**
 * Represents baseline series options where all properties are options.
 */
export type BaselineSeriesPartialOptions = SeriesPartialOptions<BaselineStyleOptions>;

/**
 * Represents bar series options.
 */
export type BarSeriesOptions = SeriesOptions<BarStyleOptions>;
/**
 * Represents bar series options where all properties are options.
 */
export type BarSeriesPartialOptions = SeriesPartialOptions<BarStyleOptions>;

/**
 * Represents candlestick series options.
 */
export type CandlestickSeriesOptions = SeriesOptions<CandlestickStyleOptions>;
/**
 * Represents candlestick series options where all properties are optional.
 */
export type CandlestickSeriesPartialOptions = SeriesPartialOptions<CandlestickStyleOptions>;

/**
 * Represents histogram series options.
 */
export type HistogramSeriesOptions = SeriesOptions<HistogramStyleOptions>;
/**
 * Represents histogram series options where all properties are optional.
 */
export type HistogramSeriesPartialOptions = SeriesPartialOptions<HistogramStyleOptions>;

/**
 * Represents line series options.
 */
export type LineSeriesOptions = SeriesOptions<LineStyleOptions>;
/**
 * Represents line series options where all properties are optional.
 */
export type LineSeriesPartialOptions = SeriesPartialOptions<LineStyleOptions>;

/**
 * Represents the type of options for each series type.
 *
 * For example a bar series has options represented by {@link BarSeriesOptions}.
 */
export interface SeriesOptionsMap {
	/**
	 * The type of bar series options.
	 */
	Bar: BarSeriesOptions;
	/**
	 * The type of candlestick series options.
	 */
	Candlestick: CandlestickSeriesOptions;
	/**
	 * The type of area series options.
	 */
	Area: AreaSeriesOptions;
	/**
	 * The type of baseline series options.
	 */
	Baseline: BaselineSeriesOptions;
	/**
	 * The type of line series options.
	 */
	Line: LineSeriesOptions;
	/**
	 * The type of histogram series options.
	 */
	Histogram: HistogramSeriesOptions;
}

/**
 * Represents the type of partial options for each series type.
 *
 * For example a bar series has options represented by {@link BarSeriesPartialOptions}.
 */
export interface SeriesPartialOptionsMap {
	/**
	 * The type of bar series partial options.
	 */
	Bar: BarSeriesPartialOptions;
	/**
	 * The type of candlestick series partial options.
	 */
	Candlestick: CandlestickSeriesPartialOptions;
	/**
	 * The type of area series partial options.
	 */
	Area: AreaSeriesPartialOptions;
	/**
	 * The type of baseline series partial options.
	 */
	Baseline: BaselineSeriesPartialOptions;
	/**
	 * The type of line series partial options.
	 */
	Line: LineSeriesPartialOptions;
	/**
	 * The type of histogram series partial options.
	 */
	Histogram: HistogramSeriesPartialOptions;
}

/**
 * Represents a type of series.
 *
 * @see {@link SeriesOptionsMap}
 */
export type SeriesType = keyof SeriesOptionsMap;
