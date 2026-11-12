import { LineData, UTCTimestamp } from 'lightweight-charts';

const DAY = 24 * 60 * 60;
const START = Date.UTC(2024, 0, 1) / 1000;

/** A wandering price, the same on every load. */
export function lineData(count: number): LineData<UTCTimestamp>[] {
	const data: LineData<UTCTimestamp>[] = [];
	for (let i = 0; i < count; i++) {
		const value = 100 + Math.sin(i / 11) * 14 + Math.sin(i / 3.1) * 4 + i * 0.05;
		data.push({ time: (START + i * DAY) as UTCTimestamp, value: Math.round(value * 100) / 100 });
	}
	return data;
}
