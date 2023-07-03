import { Time } from './horz-scale-behavior-time/types';
import { CustomData, CustomSeriesWhitespaceData } from './icustom-series';
import { Series } from './series';
import { SeriesType } from './series-options';

/**
 * Represents a whitespace data item, which is a data point without a value.
 *
 * @example
 * ```js
 * const data = [
 *     { time: '2018-12-03', value: 27.02 },
 *     { time: '2018-12-04' }, // whitespace
 *     { time: '2018-12-05' }, // whitespace
 *     { time: '2018-12-06' }, // whitespace
 *     { time: '2018-12-07' }, // whitespace
 *     { time: '2018-12-08', value: 23.92 },
 *     { time: '2018-12-13', value: 30.74 },
 * ];
 * ```
 */
export interface WhitespaceData<HorzScaleItem = Time> {
	/**
	 * The time of the data.
	 */
	time: HorzScaleItem;

	/**
	 * Additional custom values which will be ignored by the library, but
	 * could be used by plugins.
	 */
	customValues?: Record<string, unknown>;
}

/**
 * A base interface for a data point of single-value series.
 */
export interface SingleValueData<HorzScaleItem = Time> extends WhitespaceData<HorzScaleItem> {
	/**
	 * The time of the data.
	 */
	time: HorzScaleItem;

	/**
	 * Price value of the data.
	 */
	value: number;
}

/**
 * Structure describing a single item of data for line series
 */
export interface LineData<HorzScaleItem = Time> extends SingleValueData<HorzScaleItem> {
	/**
	 * Optional color value for certain data item. If missed, color from options is used
	 */
	color?: string;
}

/**
 * Structure describing a single item of data for histogram series
 */
export interface HistogramData<HorzScaleItem = Time> extends SingleValueData<HorzScaleItem> {
	/**
	 * Optional color value for certain data item. If missed, color from options is used
	 */
	color?: string;
}

/**
 * Structure describing a single item of data for area series
 */
export interface AreaData<HorzScaleItem = Time> extends SingleValueData<HorzScaleItem> {
	/**
	 * Optional line color value for certain data item. If missed, color from options is used
	 */
	lineColor?: string;

	/**
	 * Optional top color value for certain data item. If missed, color from options is used
	 */
	topColor?: string;

	/**
	 * Optional bottom color value for certain data item. If missed, color from options is used
	 */
	bottomColor?: string;
}

/**
 * Structure describing a single item of data for baseline series
 */
export interface BaselineData<HorzScaleItem = Time> extends SingleValueData<HorzScaleItem> {
	/**
	 * Optional top area top fill color value for certain data item. If missed, color from options is used
	 */
	topFillColor1?: string;

	/**
	 * Optional top area bottom fill color value for certain data item. If missed, color from options is used
	 */
	topFillColor2?: string;

	/**
	 * Optional top area line color value for certain data item. If missed, color from options is used
	 */
	topLineColor?: string;

	/**
	 * Optional bottom area top fill color value for certain data item. If missed, color from options is used
	 */
	bottomFillColor1?: string;

	/**
	 * Optional bottom area bottom fill color value for certain data item. If missed, color from options is used
	 */
	bottomFillColor2?: string;

	/**
	 * Optional bottom area line color value for certain data item. If missed, color from options is used
	 */
	bottomLineColor?: string;
}

/**
 * Represents a bar with a {@link Time} and open, high, low, and close prices.
 */
export interface OhlcData<HorzScaleItem = Time> extends WhitespaceData<HorzScaleItem> {
	/**
	 * The bar time.
	 */
	time: HorzScaleItem;

	/**
	 * The open price.
	 */
	open: number;
	/**
	 * The high price.
	 */
	high: number;
	/**
	 * The low price.
	 */
	low: number;
	/**
	 * The close price.
	 */
	close: number;
}

/**
 * Structure describing a single item of data for bar series
 */
export interface BarData<HorzScaleItem = Time> extends OhlcData<HorzScaleItem> {
	/**
	 * Optional color value for certain data item. If missed, color from options is used
	 */
	color?: string;
}

/**
 * Structure describing a single item of data for candlestick series
 */
export interface CandlestickData<HorzScaleItem = Time> extends OhlcData<HorzScaleItem> {
	/**
	 * Optional color value for certain data item. If missed, color from options is used
	 */
	color?: string;
	/**
	 * Optional border color value for certain data item. If missed, color from options is used
	 */
	borderColor?: string;
	/**
	 * Optional wick color value for certain data item. If missed, color from options is used
	 */
	wickColor?: string;
}

export function isWhitespaceData<HorzScaleItem = Time>(data: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]): data is WhitespaceData<HorzScaleItem> {
	return (data as Partial<BarData<HorzScaleItem>>).open === undefined && (data as Partial<LineData<HorzScaleItem>>).value === undefined;
}

export function isFulfilledData<HorzScaleItem, T extends SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]>(
	data: T
): data is Extract<T, BarData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem>> {
	return (
		(data as Partial<BarData<HorzScaleItem>>).open !== undefined ||
		(data as Partial<LineData<HorzScaleItem>>).value !== undefined
	);
}

/**
 * Represents the type of data that a series contains.
 *
 * For example a bar series contains {@link BarData} or {@link WhitespaceData}.
 */
export interface SeriesDataItemTypeMap<HorzScaleItem = Time> {
	/**
	 * The types of bar series data.
	 */
	Bar: BarData<HorzScaleItem> | WhitespaceData<HorzScaleItem>;
	/**
	 * The types of candlestick series data.
	 */
	Candlestick: CandlestickData<HorzScaleItem> | WhitespaceData<HorzScaleItem>;
	/**
	 * The types of area series data.
	 */
	Area: AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem>;
	/**
	 * The types of baseline series data.
	 */
	Baseline: BaselineData<HorzScaleItem> | WhitespaceData<HorzScaleItem>;
	/**
	 * The types of line series data.
	 */
	Line: LineData<HorzScaleItem> | WhitespaceData<HorzScaleItem>;
	/**
	 * The types of histogram series data.
	 */
	Histogram: HistogramData<HorzScaleItem> | WhitespaceData<HorzScaleItem>;
	/**
	 * The base types of an custom series data.
	 */
	Custom: CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>;
}

export interface DataUpdatesConsumer<TSeriesType extends SeriesType, HorzScaleItem = Time> {
	applyNewData(series: Series<TSeriesType>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType][]): void;
	updateData(series: Series<TSeriesType>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]): void;
}
