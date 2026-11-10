import { UTCTimestamp } from 'lightweight-charts';
import { BoxWhiskerData } from '../data';
import { FiveNumbers } from '../geometry';

const DAY = 24 * 60 * 60;
const START = Date.UTC(2023, 2, 1) / 1000;

/** Ten box plots as `[min, q1, median, q3, max]`, some with outliers. */
const SECTION: { numbers: FiveNumbers; outliers?: number[] }[] = [
	{ numbers: [55, 70, 80, 85, 95] },
	{ numbers: [50, 70, 78, 83, 90] },
	{ numbers: [58, 68, 75, 85, 90], outliers: [45, 50] },
	{ numbers: [55, 65, 70, 80, 88] },
	{ numbers: [52, 63, 68, 77, 85] },
	{ numbers: [50, 65, 72, 76, 88], outliers: [45, 95, 100] },
	{ numbers: [40, 60, 78, 85, 90] },
	{ numbers: [45, 72, 80, 88, 95] },
	{ numbers: [47, 70, 82, 86, 97] },
	{ numbers: [53, 68, 83, 87, 92], outliers: [45, 100] },
];

/**
 * Box plots in sections of ten, each section shifted by the next offset, so
 * the series wanders the way a distribution over time would.
 */
export function boxWhiskerData(offsets: readonly number[] = [0, 20, 40, 30]): BoxWhiskerData[] {
	const data: BoxWhiskerData[] = [];
	offsets.forEach((offset: number, section: number) => {
		SECTION.forEach((point, index: number) => {
			const [min, q1, median, q3, max] = point.numbers.map((value: number) => value + offset);
			data.push({
				time: (START + (section * SECTION.length + index) * DAY) as UTCTimestamp,
				min,
				q1,
				median,
				q3,
				max,
				outliers: point.outliers?.map((value: number) => value + offset),
			});
		});
	});
	return data;
}
