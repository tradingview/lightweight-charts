import { Mutable } from '../helpers/mutable';
import { Nominal } from '../helpers/nominal';

import { ChartOptionsImpl } from './chart-model';
import { SeriesDataItemTypeMap } from './data-consumer';
import { LocalizationOptions } from './localization-options';
import { SeriesType } from './series-options';
import { TickMark } from './tick-marks';
import { TickMarkWeightValue, TimePointIndex, TimeScalePoint } from './time-data';
import { TimeMark } from './time-scale';

/**
 * Internal Horizontal Scale Item
 */
export type InternalHorzScaleItem = Nominal<unknown, 'InternalHorzScaleItem'>;

/**
 * Function for converting a horizontal scale item to an internal item.
 */
export type HorzScaleItemConverterToInternalObj<HorzScaleItem> = (time: HorzScaleItem) => InternalHorzScaleItem;

/**
 * Represents the type of data that a series contains.
 */
export type DataItem<HorzScaleItem> = SeriesDataItemTypeMap<HorzScaleItem>[SeriesType];

/**
 * Index key for a horizontal scale item.
 *
 * It is a `number` for scales whose item identity fits in a double (time in seconds,
 * price, yield curve length) and a `bigint` for identity which does not (time in
 * nanoseconds). Use relational comparison (`<`, `>`) to compare keys - never subtraction.
 */
export type InternalHorzScaleItemKey = Nominal<number | bigint, 'InternalHorzScaleItemKey'>;

/**
 * Class interface for Horizontal scale behavior
 */
export interface IHorzScaleBehavior<HorzScaleItem> {
	/**
	 * Structure describing options of the chart.
	 *
	 * @returns ChartOptionsBase
	 */
	options(): ChartOptionsImpl<HorzScaleItem>;
	/**
	 * Set the chart options. Note that this is different to `applyOptions` since the provided options will overwrite the current options
	 * instead of merging with the current options.
	 *
	 * @param options - Chart options to be set
	 * @returns void
	 */
	setOptions(options: ChartOptionsImpl<HorzScaleItem>): void;
	/**
	 * Method to preprocess the data.
	 *
	 * @param data - Data items for the series
	 * @returns void
	 */
	preprocessData(data: DataItem<HorzScaleItem> | DataItem<HorzScaleItem>[]): void;
	/**
	 * Convert horizontal scale item into an internal horizontal scale item.
	 *
	 * @param item - item to be converted
	 * @returns InternalHorzScaleItem
	 */
	convertHorzItemToInternal(item: HorzScaleItem): InternalHorzScaleItem;
	/**
	 * Creates and returns a converter for changing series data into internal horizontal scale items.
	 *
	 * @param data - series data
	 * @returns HorzScaleItemConverterToInternalObj
	 */
	createConverterToInternalObj(data: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType][]): HorzScaleItemConverterToInternalObj<HorzScaleItem>;
	/**
	 * Returns the key for the specified horizontal scale item.
	 *
	 * @param internalItem - horizontal scale item for which the key should be returned
	 * @returns InternalHorzScaleItemKey
	 */
	key(internalItem: InternalHorzScaleItem | HorzScaleItem): InternalHorzScaleItemKey;
	/**
	 * Returns the cache key for the specified horizontal scale item.
	 *
	 * @param internalItem - horizontal scale item for which the cache key should be returned
	 * @returns number or bigint
	 */
	cacheKey(internalItem: InternalHorzScaleItem): number | bigint;
	/**
	 * Update the formatter with the localization options.
	 *
	 * @param options - Localization options
	 * @returns void
	 */
	updateFormatter(options: LocalizationOptions<HorzScaleItem>): void;
	/**
	 * Format the horizontal scale item into a display string.
	 *
	 * @param item - horizontal scale item to be formatted as a string
	 * @returns string
	 */
	formatHorzItem(item: InternalHorzScaleItem): string;
	/**
	 * Format the horizontal scale tickmark into a display string.
	 *
	 * @param item - tickmark item
	 * @param localizationOptions - Localization options
	 * @returns string
	 */
	formatTickmark(item: TickMark, localizationOptions: LocalizationOptions<HorzScaleItem>): string;
	/**
	 * Returns the maximum tickmark weight value for the specified tickmarks on the time scale.
	 *
	 * @param marks - Timescale tick marks
	 * @returns TickMarkWeightValue
	 */
	maxTickMarkWeight(marks: TimeMark[]): TickMarkWeightValue;
	/**
	 * Fill the weights for the sorted time scale points.
	 *
	 * @param sortedTimePoints - sorted time scale points
	 * @param startIndex - starting index
	 * @returns void
	 */
	fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number): void;

	/**
	 * If returns true, then the tick mark formatter will be called for all the visible
	 * tick marks even if the formatter has previously been called for a specific tick mark.
	 * This allows you to change the formatting on all the tick marks.
	 *
	 * @param tickMarks - array of tick marks
	 * @returns boolean
	 */
	shouldResetTickmarkLabels?(tickMarks: readonly TickMark[]): boolean;

	/**
	 * Maximum number of characters a tick mark label can occupy for the given time scale points.
	 *
	 * When it returns a number larger than `timeScale.tickMarkMaxCharacterLength`, the time scale
	 * uses it to space the labels further apart instead of letting them overlap. Return `undefined`
	 * to use the chart option as is.
	 *
	 * @param points - time scale points
	 * @param from - first visible point index (inclusive)
	 * @param to - last visible point index (inclusive)
	 * @returns number | undefined
	 */
	maxTickMarkCharacterLength?(points: readonly TimeScalePoint[], from: TimePointIndex, to: TimePointIndex): number | undefined;
}
