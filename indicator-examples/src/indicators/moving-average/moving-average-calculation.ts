import {
	CandlestickData,
	LineData,
	WhitespaceData,
	UTCTimestamp,
} from 'lightweight-charts';
import { ensureTimestampData } from '../../helpers/timestamp-data';

export type SupportedData = LineData<UTCTimestamp> | CandlestickData<UTCTimestamp> | WhitespaceData<UTCTimestamp>;

export type MovingAverageSmoothing = 'SMA' | 'EMA' | 'WMA';

/**
 * Options for moving average calculation.
 */
export interface MovingAverageCalculationOptions<TData extends SupportedData> {
	/**
	 * The property name to use as the value from the data.
	 * If not provided, will try 'close' or 'value'.
	 */
	source?: keyof TData | (string & {});
	/**
	 * The number of points to use in the moving average window.
	 */
	length: number;
	/**
	 * Offset to shift the MA result forward (positive) or backward (negative).
	 * E.g. offset=2 will display the MA 2 bars ahead.
	 */
	offset?: number;
	/**
	 * Smoothing method for the output MA line.
	 */
	smoothingLine?: MovingAverageSmoothing;
	/**
	 * Length to use for the smoothing line (if smoothing is enabled).
	 */
	smoothingLength?: number;
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
 * Calculates a moving average (with optional smoothing and offset).
 *
 * For each item, computes the average of the previous `length` values.
 * If `smoothingLine` is set, applies an additional smoothing (SMA/EMA/WMA)
 * to the resulting moving average values, using `smoothingLength`.
 *
 * @template TData - The type of the input data.
 * @param {TData[]} data - The input data array (sorted by time).
 * @param {MovingAverageCalculationOptions<TData>} options - Calculation options.
 * @returns {(LineData | WhitespaceData)[]} An array of MA values (or whitespace data).
 *
 * @example
 * const result = calculateMovingAverageIndicatorValues(
 *   [{ time: 1, value: 10 }, { time: 2, value: 20 }],
 *   { length: 2 }
 * );
 */
export function calculateMovingAverageIndicatorValues<
	TData extends SupportedData
>(
	data: TData[],
	options: MovingAverageCalculationOptions<TData>
): (LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>)[] {
	const source = options.source ?? determineSource(data);

	if (!source) {
		throw new Error(
			'Please provide a `source` property for the moving average indicator.'
		);
	}

	ensureTimestampData(data);

	const values: (number | undefined)[] = data.map(
		d => (d as any)[source] as number | undefined
	);
	const times: UTCTimestamp[] = data.map(d => d.time as UTCTimestamp);

	// Compute main moving average
	const ma: (number | undefined)[] = simpleMovingAverage(
		values,
		options.length
	);

	// Optionally apply smoothing to the MA line
	let final: (number | undefined)[] = ma;
	if (
		options.smoothingLine &&
		options.smoothingLength &&
		options.smoothingLength > 1
	) {
		final = smoothLine(ma, options.smoothingLine, options.smoothingLength);
	}

	// Optionally apply offset
	let offset = options.offset ?? 0;
	if (offset !== 0) {
		if (offset > 0) {
			// Shift forwards: pad at the start
			final = Array(offset)
				.fill(undefined)
				.concat(final.slice(0, final.length - offset));
		} else if (offset < 0) {
			// Shift backwards: pad at the end
			final = final.slice(-offset).concat(Array(-offset).fill(undefined));
		}
	}

	// Map to output
	return times.map((time, i) =>
		typeof final[i] === 'number'
			? { time, value: final[i] as number }
			: { time }
	);
}

/**
 * Smooths a line of values with the given method and length.
 * @param values - Input values (undefined/NaN values will be skipped)
 * @param method - Smoothing method
 * @param length - Smoothing window length
 * @returns Smoothed values (undefined where not enough data)
 */
function smoothLine(
	values: (number | undefined)[],
	method: MovingAverageSmoothing,
	length: number
): (number | undefined)[] {
	switch (method) {
		case 'SMA':
			return simpleMovingAverage(values, length);
		case 'EMA':
			return exponentialMovingAverage(values, length);
		case 'WMA':
			return weightedMovingAverage(values, length);
		default:
			throw new Error('Unknown smoothing method: ' + method);
	}
}

function simpleMovingAverage(
	values: (number | undefined)[],
	length: number
): (number | undefined)[] {
	const result: (number | undefined)[] = [];
	let sum = 0;
	let count = 0;
	const window: number[] = [];
	for (let i = 0; i < values.length; ++i) {
		const v = values[i];
		if (typeof v !== 'number') {
			result.push(undefined);
			continue;
		}
		window.push(v);
		sum += v;
		count += 1;
		if (window.length > length) {
			const removed = window.shift()!;
			sum -= removed;
			count -= 1;
		}
		if (window.length === length && window.every(x => !isNaN(x))) {
			result.push(sum / length);
		} else {
			result.push(undefined);
		}
	}
	return result;
}

function exponentialMovingAverage(
	values: (number | undefined)[],
	length: number
): (number | undefined)[] {
	const result: (number | undefined)[] = [];
	let ema: number | undefined = undefined;
	const k = 2 / (length + 1);
	for (let i = 0; i < values.length; ++i) {
		const v = values[i];
		if (typeof v !== 'number') {
			result.push(undefined);
			continue;
		}
		if (ema === undefined) {
			// Seed with the first valid value
			ema = v;
		} else {
			ema = v * k + ema * (1 - k);
		}
		result.push(ema);
	}
	// Set undefined for first (length-1) values
	for (let i = 0; i < length - 1 && i < result.length; ++i) {
		result[i] = undefined;
	}
	return result;
}

function weightedMovingAverage(
	values: (number | undefined)[],
	length: number
): (number | undefined)[] {
	const result: (number | undefined)[] = [];
	const weights = Array.from({ length }, (_, i) => i + 1);
	const weightSum = weights.reduce((a, b) => a + b, 0);
	for (let i = 0; i < values.length; ++i) {
		if (i < length - 1) {
			result.push(undefined);
			continue;
		}
		let sum = 0;
		let valid = true;
		for (let j = 0; j < length; ++j) {
			const v = values[i - length + 1 + j];
			if (typeof v !== 'number') {
				valid = false;
				break;
			}
			sum += v * weights[j];
		}
		result.push(valid ? sum / weightSum : undefined);
	}
	return result;
}
