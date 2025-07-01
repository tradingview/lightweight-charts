import {
	CandlestickData,
	LineData,
	UTCTimestamp,
	WhitespaceData,
} from 'lightweight-charts';

export type SupportedData = CandlestickData<UTCTimestamp> | WhitespaceData<UTCTimestamp>;

/**
 * Options for percent change calculation.
 */
export interface PercentChangeCalculationOptions {

	/**
	 * Offset to shift the result forward (positive) or backward (negative).
	 * E.g. offset=2 will display the average price bars ahead.
	 */
	offset?: number;
}

/**
 * Calculates a percent change (with optional offset).
 *
 * The formula is:
 * percentChange = (current price - previous price) * 100 / previous price
 *
 * @template TData - The type of the input data.
 * @param {TData[]} data - The input data array (sorted by time).
 * @param {MedianPriceCalculationOptions} options - Calculation options.
 * @returns {(LineData | WhitespaceData)[]} An array of values (or whitespace data).
 *
 * @example
 * const result = calculateMedianPriceIndicatorValues(
 *   [{ time: 1, open: 10, high: 11, low: 4, close: 9 }, { time: 2, open: 9, high: 12, low: 8, close: 10 }],
 * );
 */
export function calculatePercentChangeIndicatorValues<
	TData extends SupportedData
>(
	data: TData[],
	options: PercentChangeCalculationOptions
): (LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>)[] {
	if (data.length === 0) {
		return [];
	}

	const offset = options.offset ?? 0;
	const result = new Array(data.length);
	const startIndex = offset > 0 ? offset : 0;
	const endIndex = offset < 0 ? (data.length - 1) + offset : data.length - 1;
	let resultIndex = 0;

	for (let i = 0; i < startIndex; i++) {
		result[resultIndex] = { time: data[i].time };
		resultIndex += 1;
	}

	for (let i = startIndex; i < endIndex; i++) {
		const currentValue = data[i];

		if (i === 0) {
			result[resultIndex] = { time: currentValue.time, value: undefined };
			resultIndex += 1;
			continue;
		}

		const previousValue = data[i - 1];

		if ('close' in currentValue && 'close' in previousValue) {
			const percentChange = ((currentValue.close - previousValue.close) * 100) / previousValue.close;
			result[resultIndex] = { time: currentValue.time, value: percentChange };
		} else {
			result[resultIndex] = { time: currentValue.time };
		}

		resultIndex += 1;
	}

	for (let i = endIndex; i < data.length; i++) {
		result[resultIndex] = { time: data[i].time };
		resultIndex += 1;
	}

	return result;
}
