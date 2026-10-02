import { expect } from 'chai';
import { describe, it } from 'node:test';

import { isUpCandle, resolveCandleColors } from '../../src/colors.js';
import { RoundedCandleSeriesOptions, defaultOptions } from '../../src/options.js';

function options(
	overrides: Partial<RoundedCandleSeriesOptions> = {}
): RoundedCandleSeriesOptions {
	return { ...defaultOptions, ...overrides };
}

void describe('isUpCandle', () => {
	void it('compares open with close by default, like the built-in series', () => {
		expect(isUpCandle({ open: 10, close: 12 }, 100, 'openClose')).to.equal(true);
		expect(isUpCandle({ open: 12, close: 10 }, 0, 'openClose')).to.equal(false);
	});

	void it('treats a doji as rising, as `open <= close` does', () => {
		expect(isUpCandle({ open: 10, close: 10 }, 100, 'openClose')).to.equal(true);
	});

	void it('compares with the previous close in previousClose mode', () => {
		expect(isUpCandle({ open: 12, close: 10 }, 9, 'previousClose')).to.equal(true);
		expect(isUpCandle({ open: 10, close: 12 }, 13, 'previousClose')).to.equal(false);
	});

	void it('treats the first candle as rising in previousClose mode', () => {
		expect(isUpCandle({ open: 12, close: 10 }, -Infinity, 'previousClose')).to.equal(true);
	});
});

void describe('resolveCandleColors', () => {
	const candle = { open: 1, close: 2 };

	void it('uses the rising colors for a rising candle', () => {
		expect(resolveCandleColors(candle, true, options())).to.deep.equal({
			bodyColor: '#26a69a',
			borderColor: '#26a69a',
			wickColor: '#26a69a',
		});
	});

	void it('uses the falling colors for a falling candle', () => {
		expect(resolveCandleColors(candle, false, options())).to.deep.equal({
			bodyColor: '#ef5350',
			borderColor: '#ef5350',
			wickColor: '#ef5350',
		});
	});

	void it('lets the borderColor and wickColor shorthands win over the pair', () => {
		const resolved = resolveCandleColors(
			candle,
			false,
			options({ borderColor: '#111111', wickColor: '#222222' })
		);
		expect(resolved.borderColor).to.equal('#111111');
		expect(resolved.wickColor).to.equal('#222222');
	});

	void it('treats an empty shorthand as unset', () => {
		const resolved = resolveCandleColors(
			candle,
			true,
			options({ borderColor: '', wickColor: '' })
		);
		expect(resolved.borderColor).to.equal('#26a69a');
		expect(resolved.wickColor).to.equal('#26a69a');
	});

	void it('lets per-item overrides win over every option', () => {
		const resolved = resolveCandleColors(
			{ ...candle, color: '#a', borderColor: '#b', wickColor: '#c' },
			true,
			options({ borderColor: '#111111', wickColor: '#222222' })
		);
		expect(resolved).to.deep.equal({
			bodyColor: '#a',
			borderColor: '#b',
			wickColor: '#c',
		});
	});
});
