import { UTCTimestamp } from 'lightweight-charts';

type WithTime<V> = V & { time: unknown };

export function ensureTimestampData<T, N extends UTCTimestamp>(
	data: WithTime<T>[]
): (Omit<T, 'time'> & { time: N })[] {
	for (const item of data) {
		if (typeof item.time !== 'number') {
			throw new Error('All items must have a numeric "time" property.');
		}
	}
	return data as (Omit<T, 'time'> & { time: N })[];
}
