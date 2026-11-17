import { CustomSeriesWhitespaceData, Time, UTCTimestamp } from 'lightweight-charts';
import { LollipopData } from '../data';

const DAY = 24 * 60 * 60;
const START = Date.UTC(2024, 0, 1) / 1000;

/**
 * A daily series swinging around zero, from two overlaid waves so that it
 * looks irregular but is the same on every load.
 */
export function lollipopData(count: number): LollipopData[] {
	const data: LollipopData[] = [];
	for (let i = 0; i < count; i++) {
		const wave = Math.sin(i / 7) * 0.7 + Math.sin(i / 2.3 + 1) * 0.3;
		data.push({
			time: (START + i * DAY) as UTCTimestamp,
			value: Math.round(wave * 1000) / 100,
		});
	}
	return data;
}

/** Replaces the points in `[from, to)` with whitespace, leaving a gap. */
export function withGap(
	data: LollipopData[],
	from: number,
	to: number
): (LollipopData | CustomSeriesWhitespaceData<Time>)[] {
	return data.map((point, index) => (index >= from && index < to ? { time: point.time } : point));
}
