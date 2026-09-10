import { expect } from 'chai';
import type { IPriceLine, SeriesMarker, Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { markerNote, priceLineNote } from '../../src/annotations';
import { defaultMessages } from '../../src/messages';
import { AnySeries } from '../../src/types';

function marker(time: Time, text?: string): SeriesMarker<Time> {
	return { time, position: 'aboveBar', shape: 'circle', color: '#000', text } as SeriesMarker<Time>;
}

function seriesWithLines(lines: { title: string; price: number }[]): AnySeries {
	return {
		priceLines: () => lines.map(line => ({ options: () => line } as unknown as IPriceLine)),
	} as unknown as AnySeries;
}

void describe('markerNote', () => {
	void it('lists the markers on that time only', () => {
		const markers = [
			marker(1 as unknown as Time, 'Buy'),
			marker(2 as unknown as Time, 'Sell'),
			marker(1 as unknown as Time, 'Dividend'),
		];
		expect(markerNote(defaultMessages, markers, 1 as unknown as Time))
			.to.equal(' Markers: Buy; Dividend.');
		expect(markerNote(defaultMessages, markers, 2 as unknown as Time)).to.equal(' Marker: Sell.');
	});

	void it('matches business days by value, and skips markers without text', () => {
		const day = { year: 2019, month: 5, day: 15 } as unknown as Time;
		const markers = [marker({ year: 2019, month: 5, day: 15 } as unknown as Time, 'Split'), marker(day)];
		expect(markerNote(defaultMessages, markers, day)).to.equal(' Marker: Split.');
	});

	void it('is empty when nothing sits on the point', () => {
		expect(markerNote(defaultMessages, [], 1 as unknown as Time)).to.equal('');
	});
});

void describe('priceLineNote', () => {
	void it('lists the series price lines', () => {
		const series = seriesWithLines([{ title: 'Stop', price: 12 }, { title: 'Target', price: 20 }]);
		expect(priceLineNote(defaultMessages, series, (value: number) => value.toFixed(1)))
			.to.equal(' Price lines: Stop at 12.0, Target at 20.0.');
	});

	void it('is empty without a series or without lines', () => {
		expect(priceLineNote(defaultMessages, null, String)).to.equal('');
		expect(priceLineNote(defaultMessages, seriesWithLines([]), String)).to.equal('');
	});
});
