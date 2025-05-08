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
 * Options for correlation calculation between two sets of series data.
 *
 * @template TPrimaryData - The type of the primary data series (e.g., LineData, CandlestickData).
 * @template TSecondaryData - The type of the secondary data series.
 */
export interface CorrelationCalculationOptions<
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
	 * If true, allows spread calculation even when dates do not match exactly.
	 */
	allowMismatchedDates?: boolean;
	/**
	 * The length (amount of) previous data points to be used in the correlation calculation.
	 */
	length: number;
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
 * Calculates rolling correlation coefficient indicator values between two data series.
 *
 * For each item in the primary data, finds the closest corresponding item in the secondary data (by time),
 * and computes the Pearson correlation coefficient between the selected value properties over the last `length` points.
 * If values are missing, or dates are mismatched (and mismatches are not allowed), a whitespace data point is returned for that time.
 *
 * @template TPrimaryData - The type of the primary data series (e.g., LineData, CandlestickData).
 * @template TSecondaryData - The type of the secondary data series.
 * @param {TPrimaryData[]} primaryData - The primary data series (sorted in ascending order by time).
 * @param {TSecondaryData[]} secondaryData - The secondary data series (sorted in ascending order by time).
 * @param {CorrelationCalculationOptions<TPrimaryData, TSecondaryData>} options - Options for calculation, such as which property to use and mismatch handling.
 * @returns {(LineData | WhitespaceData)[]} An array of correlation values (or whitespace data) for each time in the primary series.
 *
 * @throws {Error} If a source property is not provided and cannot be inferred from the data.
 */
export function calculateCorrelationIndicatorValues<
	TPrimaryData extends SupportedData,
	TSecondaryData extends SupportedData
>(
	primaryData: TPrimaryData[],
	secondaryData: TSecondaryData[],
	options: CorrelationCalculationOptions<TPrimaryData, TSecondaryData>
): (LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>)[] {
	const primaryDataSource =
		options.primarySource ?? determineSource(primaryData);
	if (!primaryDataSource) {
		throw new Error(
			'Please provide a `primarySource` for the primary data of the correlation indicator.'
		);
	}
	const secondaryDataSource =
		options.secondarySource ?? determineSource(secondaryData);
	if (!secondaryDataSource) {
		throw new Error(
			'Please provide a `secondarySource` for the secondary data of the correlation indicator.'
		);
	}
	ensureTimestampData(primaryData);
	const closestIndexFinder = new ClosestTimeIndexFinder(
		ensureTimestampData(secondaryData)
	);

	const length = options.length;

	// Arrays to hold the rolling window of values
	const primaryWindow: number[] = [];
	const secondaryWindow: number[] = [];

	return primaryData.map((primaryDataPoint): LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp> => {
		const whitespaceData: WhitespaceData<UTCTimestamp> = {
			time: primaryDataPoint.time,
		};
		const primaryValue = primaryDataPoint[primaryDataSource as never] as
			| number
			| undefined;
		if (primaryValue === undefined) {
			primaryWindow.push(NaN);
			secondaryWindow.push(NaN);
			if (primaryWindow.length > length) {
				primaryWindow.shift();
				secondaryWindow.shift();
			}
			return whitespaceData;
		}

		const comparisonDataIndex = closestIndexFinder.findClosestIndex(
			primaryDataPoint.time as UTCTimestamp,
			'left'
		);

		const secondaryDataPoint = secondaryData[comparisonDataIndex];
		const secondaryValue = secondaryDataPoint?.[
			secondaryDataSource as never
		] as number | undefined;
		const timesMatch = secondaryDataPoint?.time === primaryDataPoint.time;

		if (
			secondaryValue === undefined ||
			(!options.allowMismatchedDates && !timesMatch)
		) {
			primaryWindow.push(NaN);
			secondaryWindow.push(NaN);
			if (primaryWindow.length > length) {
				primaryWindow.shift();
				secondaryWindow.shift();
			}
			return whitespaceData;
		}

		primaryWindow.push(primaryValue);
		secondaryWindow.push(secondaryValue);

		if (primaryWindow.length > length) {
			primaryWindow.shift();
			secondaryWindow.shift();
		}

		// Not enough data for correlation yet
		if (
			primaryWindow.length < length ||
			primaryWindow.some(isNaN) ||
			secondaryWindow.some(isNaN)
		) {
			return whitespaceData;
		}

		// Pearson correlation calculation
		const n = length;
		const sumX = primaryWindow.reduce((a, b) => a + b, 0);
		const sumY = secondaryWindow.reduce((a, b) => a + b, 0);
		const sumXY = primaryWindow.reduce(
			(a, b, idx) => a + b * secondaryWindow[idx],
			0
		);
		const sumX2 = primaryWindow.reduce((a, b) => a + b * b, 0);
		const sumY2 = secondaryWindow.reduce((a, b) => a + b * b, 0);

		const numerator = n * sumXY - sumX * sumY;
		const denominator = Math.sqrt(
			(n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
		);

		let correlation: number;
		if (denominator === 0) {
			correlation = 0;
		} else {
			correlation = numerator / denominator;
			// Clamp correlation to [-1, 1] due to floating point arithmetic
			correlation = Math.max(-1, Math.min(1, correlation));
		}

		return {
			time: primaryDataPoint.time,
			value: correlation,
		};
	});
}
