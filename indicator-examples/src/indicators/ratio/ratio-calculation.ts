import {
	CandlestickData,
	LineData,
	UTCTimestamp,
	WhitespaceData,
} from 'lightweight-charts';
import { ClosestTimeIndexFinder } from '../../helpers/closest-index';
import { ensureTimestampData } from '../../helpers/timestamp-data';

export type SupportedData = LineData<UTCTimestamp> | CandlestickData<UTCTimestamp> | WhitespaceData<UTCTimestamp>;

/**
 * Options for ratio calculation between two sets of series data.
 *
 * @template TPrimaryData - The type of the primary data series (e.g., LineData, CandlestickData).
 * @template TSecondaryData - The type of the secondary data series.
 */
export interface RatioCalculationOptions<
	TPrimaryData extends SupportedData,
	TSecondaryData extends SupportedData
> {
	/**
	 * The property name to use as the value from primary data.
	 * The calculation will automatically determine this value if
	 * your data has either 'close' or 'value' keys
	 */
	primarySource?: keyof TPrimaryData | (string & {});
	/**
	 * The property name to use as the value from secondary data.
	 */
	secondarySource?: keyof TSecondaryData | (string & {});
	/**
	 * If true, allows ratio calculation even when dates do not match exactly.
	 */
	allowMismatchedDates?: boolean;
}

function determineSource(data: WhitespaceData[]): string | null {
	for (const point of data) {
		if (typeof point['close' as never] === 'number') {
			return 'close';
		}
		if (typeof point['value' as never] === 'number') {
			return 'value';
		}
	}
	return null;
}

/**
 * Calculates ratio indicator values between two data series.
 *
 * For each item in the primary data, finds the closest corresponding item in the secondary data (by time),
 * and computes the difference between the selected value properties. If values are missing or dates are mismatched
 * (and mismatches are not allowed), a whitespace data point is returned for that time.
 *
 * @template TPrimaryData - The type of the primary data series (e.g., LineData, CandlestickData).
 * @template TSecondaryData - The type of the secondary data series.
 * @param {TPrimaryData[]} primaryData - The primary data series (sorted in ascending order by time).
 * @param {TSecondaryData[]} secondaryData - The secondary data series (sorted in ascending order by time).
 * @param {RatioCalculationOptions<TPrimaryData, TSecondaryData>} options - Options for calculation, such as which property to use and mismatch handling.
 * @returns {(LineData | WhitespaceData)[]} An array of ratio values (or whitespace data) for each time in the primary series.
 *
 * @throws {Error} If a source property is not provided and cannot be inferred from the data.
 *
 * @example
 * const result = calculateRatioIndicatorValues(
 *   [{ time: 1, value: 10 }, { time: 2, value: 20 }],
 *   [{ time: 1, value: 8 }, { time: 2, value: 15 }],
 *   { primarySource: 'value', secondarySource: 'value' }
 * );
 */
export function calculateRatioIndicatorValues<
	TPrimaryData extends SupportedData,
	TSecondaryData extends SupportedData
>(
	primaryData: TPrimaryData[],
	secondaryData: TSecondaryData[],
	options: RatioCalculationOptions<TPrimaryData, TSecondaryData>
): (LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>)[] {
	const primaryDataSource =
		options.primarySource ?? determineSource(primaryData);
	if (!primaryDataSource) {
		throw new Error(
			'Please provide a `primarySource` for the primary data of the ratio indicator.'
		);
	}
	const secondaryDataSource =
		options.secondarySource ?? determineSource(secondaryData);
	if (!secondaryDataSource) {
		throw new Error(
			'Please provide a `secondarySource` for the secondary data of the ratio indicator.'
		);
	}
	ensureTimestampData(primaryData);
	const closestIndexFinder = new ClosestTimeIndexFinder(
		ensureTimestampData(secondaryData)
	);
	return primaryData.map((primaryDataPoint): LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp> => {
		const whitespaceData: WhitespaceData<UTCTimestamp> = {
			time: primaryDataPoint.time,
		};
		const primaryValue = primaryDataPoint[primaryDataSource as never] as
			| number
			| undefined;
		if (primaryValue === undefined) {
			return whitespaceData;
		}
		const comparisonDataIndex = closestIndexFinder.findClosestIndex(
			primaryDataPoint.time as UTCTimestamp,
			'left'
		);
		const secondaryValue = secondaryData[comparisonDataIndex][
			secondaryDataSource as never
		] as number | undefined;
		if (
			secondaryValue === undefined ||
			(!options.allowMismatchedDates &&
				secondaryData[comparisonDataIndex].time !== primaryDataPoint.time)
		) {
			return whitespaceData;
		}
		return {
			time: primaryDataPoint.time,
			value: primaryValue / secondaryValue,
		};
	});
}
