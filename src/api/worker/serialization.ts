/* eslint-disable @typescript-eslint/naming-convention */
import { SeriesDataItemTypeMap } from '../../model/data-consumer';
import { Time } from '../../model/horz-scale-behavior-time/types';
import { SeriesType } from '../../model/series-options';

export const DATA_LAYOUT = {
	TYPE_OFFSET: 0,
	TIME_OFFSET: 1,
	VALUE_OFFSET: 2,
	OPEN_OFFSET: 2,
	HIGH_OFFSET: 3,
	LOW_OFFSET: 4,
	CLOSE_OFFSET: 5,
	TYPE_CANDLESTICK: 1.0,
	TYPE_LINE: 2.0,
	TYPE_WHITESPACE: 3.0,
	NUM_PROPERTIES: 6,
	BYTES_PER_PROPERTY: 8,
	BYTES_PER_STRIDE: 6 * 8,
} as const;

export function serializeData<T extends SeriesType>(
	data: SeriesDataItemTypeMap<Time>[T][]
): SharedArrayBuffer {
	const start = performance.now();
	const buffer = new SharedArrayBuffer(data.length * DATA_LAYOUT.BYTES_PER_STRIDE);
	_writeSeriesDataToArray(buffer, data);
	const end = performance.now();
	// eslint-disable-next-line no-console
	console.log('[Timing]serializeData(SAB)', end - start);
	return buffer;
}

export function serializeDataToArrayBuffer<T extends SeriesType>(
	data: SeriesDataItemTypeMap<Time>[T][]
): ArrayBuffer {
	const start = performance.now();
	const buffer = new ArrayBuffer(data.length * DATA_LAYOUT.BYTES_PER_STRIDE);
	_writeSeriesDataToArray(buffer, data);
	const end = performance.now();
	// eslint-disable-next-line no-console
	console.log('[Timing]serializeData(AB)', end - start);
	return buffer;
}

function _writeSeriesDataToArray<T extends SeriesType>(
	buffer: ArrayBufferLike,
	data: SeriesDataItemTypeMap<Time>[T][]
): void {
	const array = new Float64Array(buffer);
	for (let i = 0; i < data.length; i++) {
		const point = data[i] as unknown as SeriesDataItemTypeMap<Time>[SeriesType];
		const base = i * DATA_LAYOUT.NUM_PROPERTIES;
		const timeValue = (point as unknown as { time: number }).time;
		array[base + DATA_LAYOUT.TIME_OFFSET] = timeValue as unknown as number;
		const hasOpen = Object.prototype.hasOwnProperty.call(point as object, 'open') && (point as { open?: number }).open !== undefined;
		if (hasOpen) {
			const p = point as unknown as { open: number; high: number; low: number; close: number };
			array[base + DATA_LAYOUT.TYPE_OFFSET] = DATA_LAYOUT.TYPE_CANDLESTICK;
			array[base + DATA_LAYOUT.OPEN_OFFSET] = p.open;
			array[base + DATA_LAYOUT.HIGH_OFFSET] = p.high;
			array[base + DATA_LAYOUT.LOW_OFFSET] = p.low;
			array[base + DATA_LAYOUT.CLOSE_OFFSET] = p.close;
			continue;
		}
		const hasValue = Object.prototype.hasOwnProperty.call(point as object, 'value') && (point as { value?: number }).value !== undefined;
		if (hasValue) {
			const p = point as unknown as { value: number };
			array[base + DATA_LAYOUT.TYPE_OFFSET] = DATA_LAYOUT.TYPE_LINE;
			array[base + DATA_LAYOUT.VALUE_OFFSET] = p.value;
			continue;
		}
		array[base + DATA_LAYOUT.TYPE_OFFSET] = DATA_LAYOUT.TYPE_WHITESPACE;
	}
}

export function deserializeSABToSeriesItems(
	buffer: ArrayBufferLike
): SeriesDataItemTypeMap<Time>[SeriesType][] {
	const start = performance.now();
	const array = new Float64Array(buffer);
	const stride = DATA_LAYOUT.NUM_PROPERTIES;
	const out: SeriesDataItemTypeMap<Time>[SeriesType][] = [];
	for (let i = 0; i < array.length; i += stride) {
		const type = array[i + DATA_LAYOUT.TYPE_OFFSET];
		const time = array[i + DATA_LAYOUT.TIME_OFFSET];
		if (type === DATA_LAYOUT.TYPE_CANDLESTICK) {
			out.push({ time, open: array[i + DATA_LAYOUT.OPEN_OFFSET], high: array[i + DATA_LAYOUT.HIGH_OFFSET], low: array[i + DATA_LAYOUT.LOW_OFFSET], close: array[i + DATA_LAYOUT.CLOSE_OFFSET] } as unknown as SeriesDataItemTypeMap<Time>[SeriesType]);
		} else if (type === DATA_LAYOUT.TYPE_LINE) {
			out.push({ time, value: array[i + DATA_LAYOUT.VALUE_OFFSET] } as unknown as SeriesDataItemTypeMap<Time>[SeriesType]);
		} else {
			out.push({ time } as unknown as SeriesDataItemTypeMap<Time>[SeriesType]);
		}
	}
	const end = performance.now();
	// eslint-disable-next-line no-console
	console.log('[Timing]deserializeToSeriesItems', end - start);
	return out;
}

