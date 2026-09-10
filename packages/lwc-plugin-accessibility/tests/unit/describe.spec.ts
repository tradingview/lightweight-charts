import { expect } from 'chai';
import type { Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import {
	DescribeEnv,
	defaultTimeFormatter,
	describePoint,
	describeSeriesUpdate,
	describeSummary,
	describeValues,
	extractValue,
} from '../../src/describe';
import { defaultMessages } from '../../src/messages';
import { AnySeries, SeriesDataPoint } from '../../src/types';

const env: DescribeEnv = {
	messages: defaultMessages,
	scopeNote: ' in view',
	formatValue: (value: number | undefined): string => (value === undefined ? 'no value' : value.toFixed(1)),
	formatTime: (time: Time): string => `t${String(time)}`,
	formatPercent: (value: number): string => value.toFixed(2),
};

function valuePoint(time: number, value: number): SeriesDataPoint {
	return { time: time as unknown as Time, value };
}

void describe('extractValue', () => {
	void it('reads `value` from value-based points', () => {
		expect(extractValue(valuePoint(1, 12.5))).to.equal(12.5);
	});

	void it('reads `close` from OHLC points', () => {
		const bar = { time: 1 as unknown as Time, open: 1, high: 4, low: 0, close: 3 } as SeriesDataPoint;
		expect(extractValue(bar)).to.equal(3);
	});

	void it('is undefined for whitespace and for no point at all', () => {
		expect(extractValue({ time: 1 as unknown as Time } as SeriesDataPoint)).to.equal(undefined);
		expect(extractValue(undefined)).to.equal(undefined);
	});
});

void describe('defaultTimeFormatter', () => {
	void it('formats a UTC timestamp in UTC', () => {
		// 2019-05-15T00:00:00Z – must not shift a day west of UTC.
		expect(defaultTimeFormatter(1557878400 as unknown as Time, 'en-GB')).to.equal('15 May 2019');
	});

	void it('formats a business-day object (1-based months)', () => {
		expect(defaultTimeFormatter({ year: 2019, month: 5, day: 15 } as unknown as Time, 'en-GB'))
			.to.equal('15 May 2019');
	});

	void it('formats a business-day string', () => {
		expect(defaultTimeFormatter('2019-05-15' as unknown as Time, 'en-GB')).to.equal('15 May 2019');
	});

	void it('passes an unparseable string through verbatim', () => {
		expect(defaultTimeFormatter('not-a-date' as unknown as Time)).to.equal('not-a-date');
	});
});

void describe('describeValues', () => {
	void it('announces a single value', () => {
		expect(describeValues(env, valuePoint(1, 7), null)).to.equal('7.0');
	});

	void it('announces every OHLC field in order', () => {
		const bar = { time: 1 as unknown as Time, open: 1, high: 4, low: 0, close: 3 } as SeriesDataPoint;
		expect(describeValues(env, bar, null)).to.equal('open 1.0, high 4.0, low 0.0, close 3.0');
	});
});

void describe('describePoint', () => {
	void it('reports the 1-based position in the whole series', () => {
		const points = [valuePoint(1, 10), valuePoint(2, 11)];
		expect(describePoint(env, points, 1, 'Price', null)).to.equal('Price 11.0, t2. Point 2 of 2.');
	});

	void it('is empty for an index outside the series', () => {
		expect(describePoint(env, [], 0, 'Price', null)).to.equal('');
	});
});

void describe('describeSummary', () => {
	void it('describes direction, change and extremes', () => {
		const points = [valuePoint(1, 10), valuePoint(2, 5), valuePoint(3, 20)];
		expect(describeSummary(env, points, 'Price', null)).to.equal(
			'Price with 3 data points in view. From 10.0 on t1 to 20.0 on t3. Overall up by 10.0, 100.00 percent. Lowest 5.0 on t2, highest 20.0 on t3.'
		);
	});

	void it('drops the percentage when the series starts at zero', () => {
		const summary = describeSummary(env, [valuePoint(1, 0), valuePoint(2, 4)], 'Price', null);
		expect(summary).to.contain('Overall up by 4.0.');
		expect(summary).to.not.contain('percent');
	});

	void it('reports "unchanged" for a flat series', () => {
		expect(describeSummary(env, [valuePoint(1, 3), valuePoint(2, 3)], 'Price', null))
			.to.contain('Overall unchanged by 0.0');
	});

	void it('ignores whitespace points and falls back to noData', () => {
		const whitespace = { time: 1 as unknown as Time } as SeriesDataPoint;
		expect(describeSummary(env, [whitespace], 'Price', null))
			.to.equal('Price: no data available in view.');
		expect(describeSummary(env, [], 'Price', null)).to.equal('Price: no data available in view.');
	});
});

void describe('describeSeriesUpdate', () => {
	void it('reports the scoped count but the newest value', () => {
		const data = [valuePoint(1, 1), valuePoint(2, 2), valuePoint(3, 99)];
		const summary = describeSeriesUpdate(env, {
			label: 'Price',
			series: null as unknown as AnySeries,
			data,
			scopedCount: 2,
		});
		expect(summary).to.equal('Price, 2 data points in view. Latest 99.0');
	});

	void it('skips trailing whitespace when looking for the latest value', () => {
		const data = [valuePoint(1, 5), { time: 2 as unknown as Time } as SeriesDataPoint];
		const summary = describeSeriesUpdate(env, {
			label: 'Price',
			series: null as unknown as AnySeries,
			data,
			scopedCount: 2,
		});
		expect(summary).to.contain('Latest 5.0');
	});
});
