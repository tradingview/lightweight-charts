import { UTCTimestamp } from 'lightweight-charts';
import { GroupedBarsData } from '../data';

const DAY = 24 * 60 * 60;
const START = Date.UTC(2024, 0, 1) / 1000;

/**
 * Daily points with `groups` positive values each, every value following its
 * own slow wave so that the columns of a group trade places over time. The
 * data is the same on every load.
 */
export function groupedBarsData(groups: number, count: number): GroupedBarsData[] {
	const data: GroupedBarsData[] = [];
	for (let i = 0; i < count; i++) {
		const values: number[] = [];
		for (let g = 0; g < groups; g++) {
			const wave = Math.sin(i / (6 + g * 2) + g * 1.7) * 0.6 + Math.sin(i / 2.1 + g) * 0.25;
			values.push(Math.round((20 + g * 3 + wave * 10) * 10) / 10);
		}
		data.push({ time: (START + i * DAY) as UTCTimestamp, values });
	}
	return data;
}
