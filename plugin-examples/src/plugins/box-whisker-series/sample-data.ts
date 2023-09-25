import { CustomData, UTCTimestamp } from 'lightweight-charts';

/**
 * Construction of a box plot is based around a dataset’s quartiles,
 * or the values that divide the dataset into equal fourths.
 * The first quartile (Q1) is greater than 25% of the data and less
 * than the other 75%. The second quartile (Q2) sits in the middle,
 * dividing the data in half. Q2 is also known as the median. The third
 * quartile (Q3) is larger than 75% of the data, and smaller than the remaining 25%.
 */

/**
 * Whisker Series Data
 */
export interface WhiskerData extends CustomData {
	quartiles: [
		number, // q0 (0%)
		number, // q1 (25%)
		number, // q2 (50%)
		number, // q3 (75%)
		number // q4 (100%)
	];
	outliers?: number[];
}

const dayLength = 24 * 60 * 60;

function quartileDataPoint(
	q0: number,
	q1: number,
	q2: number,
	q3: number,
	q4: number,
	basePoint: number
): WhiskerData['quartiles'] {
	return [
		basePoint + q0,
		basePoint + q1,
		basePoint + q2,
		basePoint + q3,
		basePoint + q4,
	];
}

function whiskerDataSection(
	startDate: number,
	basePoint: number
): WhiskerData[] {
	return [
		{ quartiles: quartileDataPoint(55, 70, 80, 85, 95, basePoint) },
		{ quartiles: quartileDataPoint(50, 70, 78, 83, 90, basePoint) },
		{
			quartiles: quartileDataPoint(58, 68, 75, 85, 90, basePoint),
			outliers: [45 + basePoint, 50 + basePoint],
		},
		{ quartiles: quartileDataPoint(55, 65, 70, 80, 88, basePoint) },
		{ quartiles: quartileDataPoint(52, 63, 68, 77, 85, basePoint) },
		{
			quartiles: quartileDataPoint(50, 65, 72, 76, 88, basePoint),
			outliers: [45 + basePoint, 95 + basePoint, 100 + basePoint],
		},
		{ quartiles: quartileDataPoint(40, 60, 78, 85, 90, basePoint) },
		{ quartiles: quartileDataPoint(45, 72, 80, 88, 95, basePoint) },
		{ quartiles: quartileDataPoint(47, 70, 82, 86, 97, basePoint) },
		{
			quartiles: quartileDataPoint(53, 68, 83, 87, 92, basePoint),
			outliers: [45 + basePoint, 100 + basePoint],
		},
	].map((d, index) => {
		return {
			...d,
			time: (startDate + index * dayLength) as UTCTimestamp,
		};
	});
}

export function sampleWhiskerData(): (WhiskerData)[] {
	return [
		...whiskerDataSection(1677628800, 0),
		...whiskerDataSection(1677628800 + 1 * 10 * dayLength, 20),
		...whiskerDataSection(1677628800 + 2 * 10 * dayLength, 40),
		// whitespace
		// { time: 1677628800 + 3 * 10 * dayLength as Time},
		...whiskerDataSection(1677628800 + (3 * 10 + 1) * dayLength, 30),
	];
}
