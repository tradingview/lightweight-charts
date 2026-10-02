import { expect } from 'chai';
import type { Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { buildTableModel } from '../../src/data-table';
import { DescribeEnv, extractRange, extractValue } from '../../src/describe';
import { defaultMessages } from '../../src/messages';
import { SeriesDataPoint } from '../../src/types';

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

function bar(time: number): SeriesDataPoint {
	return { time: time as unknown as Time, open: 1, high: 4, low: 0, close: 3 } as SeriesDataPoint;
}

void describe('buildTableModel', () => {
	void it('uses a single value column for a value series', () => {
		const model = buildTableModel(env, {
			points: [valuePoint(1, 10), valuePoint(2, 11)],
			series: null,
			label: 'Price',
			maxRows: 10,
		});
		expect(model.columns).to.deep.equal(['Time', 'Value']);
		expect(model.rows).to.deep.equal([
			{ time: 't1', values: ['10.0'] },
			{ time: 't2', values: ['11.0'] },
		]);
		expect(model.caption).to.equal('Price: 2 data points in view.');
		expect(model.truncated).to.equal('');
	});

	void it('uses OHLC columns as soon as a point carries them', () => {
		const model = buildTableModel(env, {
			points: [bar(1), { time: 2 as unknown as Time } as SeriesDataPoint],
			series: null,
			label: 'Price',
			maxRows: 10,
		});
		expect(model.columns).to.deep.equal(['Time', 'Open', 'High', 'Low', 'Close']);
		expect(model.rows[0].values).to.deep.equal(['1.0', '4.0', '0.0', '3.0']);
		// A whitespace row keeps the shape of the table.
		expect(model.rows[1].values).to.deep.equal(['no value', 'no value', 'no value', 'no value']);
	});

	void it('caps the rows and says so', () => {
		const points = [valuePoint(1, 1), valuePoint(2, 2), valuePoint(3, 3)];
		const model = buildTableModel(env, { points, series: null, label: 'Price', maxRows: 2 });
		expect(model.rows).to.have.length(2);
		expect(model.truncated).to.equal('Showing the first 2 of 3 rows.');
	});
});
