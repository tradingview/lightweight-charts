import { expect } from 'chai';
import { describe, it } from 'node:test';
import { IRange, Logical } from 'lightweight-charts';

import { BrushableAreaSeriesOptions, defaultOptions } from '../../src/options.js';
import { createStyleResolver } from '../../src/style.js';

function range(from: number, to: number): IRange<Logical> {
	return { from: from as Logical, to: to as Logical };
}

function options(
	overrides: Partial<BrushableAreaSeriesOptions>
): BrushableAreaSeriesOptions {
	return { ...defaultOptions, ...overrides };
}

const green = {
	lineColor: 'rgb(4,153,129)',
	topColor: 'rgba(4,153,129, 0.4)',
	bottomColor: 'rgba(4,153,129, 0)',
	lineWidth: 3,
} as const;

void describe('createStyleResolver', () => {
	void it('returns the base style when there are no brush ranges', () => {
		const resolve = createStyleResolver(defaultOptions);
		expect(resolve(0)).to.deep.equal({
			lineColor: defaultOptions.lineColor,
			topColor: defaultOptions.topColor,
			bottomColor: defaultOptions.bottomColor,
			lineWidth: defaultOptions.lineWidth,
		});
	});

	void it('uses a fully specified range style as is', () => {
		const resolve = createStyleResolver(
			options({ brushRanges: [{ range: range(2, 4), style: green }] })
		);
		expect(resolve(2)).to.deep.equal(green);
	});

	void it('fills a partial range style from the base style', () => {
		const resolve = createStyleResolver(
			options({
				lineWidth: 4,
				brushRanges: [
					{ range: range(2, 4), style: { lineColor: '#089981' } },
				],
			})
		);
		expect(resolve(3)).to.deep.equal({
			lineColor: '#089981',
			topColor: defaultOptions.topColor,
			bottomColor: defaultOptions.bottomColor,
			lineWidth: 4,
		});
	});

	void it('treats `from` as inclusive and `to` as exclusive', () => {
		const resolve = createStyleResolver(
			options({ brushRanges: [{ range: range(2, 4), style: green }] })
		);
		expect(resolve(1).lineColor).to.equal(defaultOptions.lineColor);
		expect(resolve(2).lineColor).to.equal(green.lineColor);
		expect(resolve(3).lineColor).to.equal(green.lineColor);
		expect(resolve(4).lineColor).to.equal(defaultOptions.lineColor);
	});

	void it('lets the first matching range win when ranges overlap', () => {
		const resolve = createStyleResolver(
			options({
				brushRanges: [
					{ range: range(0, 10), style: green },
					{ range: range(5, 15), style: { lineColor: '#F23645' } },
				],
			})
		);
		expect(resolve(6).lineColor).to.equal(green.lineColor);
		expect(resolve(12).lineColor).to.equal('#F23645');
	});

	void it('applies `outsideStyle` only while a range is set', () => {
		const outsideStyle = { lineColor: 'rgba(40,98,255, 0.2)' };
		expect(createStyleResolver(options({ outsideStyle }))(0).lineColor).to.equal(
			defaultOptions.lineColor
		);
		const resolve = createStyleResolver(
			options({
				outsideStyle,
				brushRanges: [{ range: range(2, 4), style: green }],
			})
		);
		expect(resolve(0)).to.deep.equal({
			lineColor: outsideStyle.lineColor,
			topColor: defaultOptions.topColor,
			bottomColor: defaultOptions.bottomColor,
			lineWidth: defaultOptions.lineWidth,
		});
		expect(resolve(2).lineColor).to.equal(green.lineColor);
	});

	void it('shares one style object between points of the same run', () => {
		const resolve = createStyleResolver(
			options({ brushRanges: [{ range: range(2, 6), style: green }] })
		);
		expect(resolve(2)).to.equal(resolve(5));
		expect(resolve(0)).to.equal(resolve(9));
		expect(resolve(0)).not.to.equal(resolve(2));
	});
});
