import { IPriceLine, SeriesMarker, Time } from 'lightweight-charts';

import { AccessibilityMessages } from './messages';
import { timeKey } from './series-data';
import { AnySeries } from './types';

/**
 * The spoken note listing the markers that sit on `time`, or `''` when there
 * are none. Appended to the point announcement, so a keyboard user hears the
 * annotations a sighted user sees on the chart.
 */
export function markerNote(
	messages: AccessibilityMessages,
	markers: readonly SeriesMarker<Time>[],
	time: Time
): string {
	const key = timeKey(time);
	const texts: string[] = [];
	for (const marker of markers) {
		if (timeKey(marker.time) === key && marker.text !== undefined && marker.text.length > 0) {
			texts.push(marker.text);
		}
	}
	return messages.markerNote({ texts });
}

/**
 * The spoken note listing a series' price lines, or `''` when it has none.
 * Appended to the `Enter` / `Space` summary: price lines are a visual
 * annotation with no other accessible representation.
 */
export function priceLineNote(
	messages: AccessibilityMessages,
	series: AnySeries | null,
	formatValue: (value: number) => string
): string {
	if (!series) {
		return '';
	}
	const lines = series.priceLines().map((line: IPriceLine) => {
		const options = line.options();
		return { title: options.title, value: formatValue(options.price) };
	});
	return messages.priceLinesNote({ lines });
}
