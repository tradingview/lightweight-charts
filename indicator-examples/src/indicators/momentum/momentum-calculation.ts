import {
	CandlestickData,
	LineData,
	WhitespaceData,
	UTCTimestamp,
} from 'lightweight-charts';
import { ensureTimestampData } from '../../helpers/timestamp-data';

export type SupportedData = LineData<UTCTimestamp> | CandlestickData<UTCTimestamp> | WhitespaceData<UTCTimestamp>;

/**
 * Options for moving average calculation.
 */
export interface MomentumCalculationOptions {
	/**
	 * The property name to use as the value from the data.
	 * If not provided, will try 'close' or 'value'.
	 */
	source?: keyof SupportedData | (string & {});
	/**
	 * The number of points to use for calculating momentum.
	 */
	length: number;
}

function determineSource<T>(data: WhitespaceData<T>[]): string | null {
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
 * Calculates a momentum (with optional length and source).
 *
 * The Momentum indicator measures the difference between
 * the current price and a previous price over a specified period. 
 *
 * @template T - The type of the time data.
 * @param {SupportedData<T>[]} data - The input data array (sorted by time).
 * @param {MomentumCalculationOptions<T>} options - Calculation options.
 * @returns {(LineData | WhitespaceData)[]} An array of values (or whitespace data).
 *
 * @example
 * const result = calculateMomentumIndicatorValues(
 *   [{ time: 1, value: 10 }, { time: 2, value: 20 }],
 *   { length: 2 }
 * );
 */
export function calculateMomentumIndicatorValues<
	TData extends SupportedData
>(
	data: TData[],
	options: MomentumCalculationOptions
): (LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>)[] {
	const source = options.source ?? determineSource(data);

	if (!source) {
		throw new Error(
			'Please provide a `source` property for the momentum indicator.'
		);
	}

	ensureTimestampData(data);

	const values: (number | undefined)[] = data.map(
		d => (d as any)[source] as number | undefined
	);
	const times: UTCTimestamp[] = data.map(d => d.time as UTCTimestamp);

	// Compute momentum
	const momentum: (number | undefined)[] = calculateMomentum(
		values,
		options.length
	);

	// Map to output
	return times.map((time, i): LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp> =>
		typeof momentum[i] === 'number'
			? { time, value: momentum[i] as number }
			: { time }
	);
}

function calculateMomentum(
	values: (number | undefined)[],
	length: number
): (number | undefined)[] {
	const result: (number | undefined)[] = [];

	for (let i = 0; i < values.length; ++i) {
		const v = values[i];
		if (typeof v !== 'number') {
			result.push(undefined);
			continue;
		}
		if (i < length) {
			result.push(undefined);
		} else {
			const previousValue = values[i - length];
			if (typeof previousValue !== 'number') {
				result.push(undefined);
				continue;
			}
			// Calculate momentum as the difference between current and previous value
			const momentumValue = v - previousValue;
			result.push(momentumValue);
		}
	}

	return result;
}
