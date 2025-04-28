import { UTCTimestamp, WhitespaceData } from '../../../../dist/typings';

/**
 * Returns a new array of data points, where each point's year is set to the specified year.
 *
 * Note: Currently only UTCTimestamp is supported as the time value.
 *
 * @template T - The type of the data point, extending WhitespaceData with a UTCTimestamp.
 * @param {T[]} data - The array of data points to align.
 * @param {number} year - The year to set for each data point.
 * @returns {T[]} A new array of data points with the year set to the specified value.
 *
 * @example
 * alignDataToYear([{ time: 1672531200 }], 2020); // Returns [{ time: ... }] with year 2020
 */
export function alignDataToYear<T extends WhitespaceData<UTCTimestamp>>(
	data: T[],
	year: number
): T[] {
	return data.map(
		(d: WhitespaceData<UTCTimestamp>): WhitespaceData<UTCTimestamp> => {
			const time = new Date(d.time * 1000);
			time.setFullYear(year);
			return {
				...d,
				time: (time.valueOf() / 1000) as UTCTimestamp,
			};
		}
	) as T[];
}

/**
 * Splits an array of data points into groups based on their year.
 *
 * Note: Currently only UTCTimestamp is supported as the time value.
 *
 * @template T - The type of the data point, extending WhitespaceData with a UTCTimestamp.
 * @param {T[]} data - The sorted array of data points to split (ascending by time).
 * @returns {Record<number, T[]>} An object mapping each year to an array of data points from that year.
 *
 * @example
 * splitDataByYears([{ time: 1577836800 }, { time: 1609459200 }]);
 * // Returns: { 2020: [...], 2021: [...] }
 */
export function splitDataByYears<T extends WhitespaceData<UTCTimestamp>>(
	data: T[]
): Record<number, T[]> {
	const result: Record<number, T[]> = {};
	for (const item of data) {
		const date = new Date(item.time * 1000);
		const year = date.getUTCFullYear();
		if (!result[year]) {
			result[year] = [];
		}
		result[year].push(item);
	}
	return result;
}
