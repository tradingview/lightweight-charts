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
	extractRange,
	extractValue,
} from '../../src/describe';
import { defaultMessages } from '../../src/messages';
import { AnySeries, SeriesDataPoint } from '../../src/types';

const env: DescribeEnv = {
	messages: defaultMessages,
	scopeNote: ' in view',
	formatValue: (value: number | undefined): string => (value === undefined ? 'no value' : value.toFixed(1)),
	formatChange: (value: number): string => value.toFixed(1),
	formatTime: (time: Time): string => `t${String(time)}`,
	formatPercent: (value: number): string => value.toFixed(2),
	value: (point: SeriesDataPoint | undefined): number | undefined => extractValue(point),
	range: (point: SeriesDataPoint | undefined) => extractRange(point),
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

	void it('prefers a valueAccessor, ignoring a non-finite result', () => {
		const custom = { time: 1 as unknown as Time, values: [4, 7] } as unknown as SeriesDataPoint;
		expect(extractValue(custom, null, point => (point as unknown as { values: number[] }).values[1])).to.equal(7);
		expect(extractValue(valuePoint(1, 3), null, () => NaN)).to.equal(3);
	});
});

void describe('extractRange', () => {
	void it('reads the high / low band of an OHLC point', () => {
		const bar = { time: 1 as unknown as Time, open: 1, high: 4, low: 0, close: 3 } as SeriesDataPoint;
		expect(extractRange(bar)).to.deep.equal({ high: 4, low: 0, open: 1, close: 3 });
	});

	void it('is undefined for a value point, unless a rangeAccessor supplies one', () => {
		expect(extractRange(valuePoint(1, 5))).to.equal(undefined);
		expect(extractRange(valuePoint(1, 5), null, () => ({ high: 9, low: 2 })))
			.to.deep.equal({ high: 9, low: 2 });
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

	void it('adds the time of day for the intraday formats', () => {
		// 2019-05-15T13:45:30Z
		const time = 1557927930 as unknown as Time;
		expect(defaultTimeFormatter(time, 'en-GB', 'dateTime')).to.equal('15 May 2019, 13:45');
		expect(defaultTimeFormatter(time, 'en-GB', 'seconds')).to.equal('15 May 2019, 13:45:30');
		expect(defaultTimeFormatter(time, 'en-GB', 'time')).to.equal('13:45');
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

	void it('takes the extremes from the high / low of OHLC points, not the close', () => {
		const bar = (time: number, low: number, high: number, close: number): SeriesDataPoint =>
			({ time: time as unknown as Time, open: close, high, low, close } as SeriesDataPoint);
		const summary = describeSummary(env, [bar(1, 2, 12, 10), bar(2, 5, 9, 8)], 'Price', null);
		expect(summary).to.contain('Lowest 2.0 on t1, highest 12.0 on t1.');
	});

	void it('appends the pre-formatted notes', () => {
		expect(describeSummary(env, [valuePoint(1, 1), valuePoint(2, 2)], 'Price', null, ' Price line: Stop at 3.0.'))
			.to.contain(' Price line: Stop at 3.0.');
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
		const summary = describeSeriesUpdate(env, {
			label: 'Price',
			series: null as unknown as AnySeries,
			latest: valuePoint(3, 99),
			scopedCount: 2,
		});
		expect(summary).to.equal('Price, 2 data points in view. Latest 99.0');
	});

	void it('says "no value" when the newest point is whitespace', () => {
		const summary = describeSeriesUpdate(env, {
			label: 'Price',
			series: null as unknown as AnySeries,
			latest: { time: 2 as unknown as Time } as SeriesDataPoint,
			scopedCount: 2,
		});
		expect(summary).to.contain('Latest no value');
	});
});
