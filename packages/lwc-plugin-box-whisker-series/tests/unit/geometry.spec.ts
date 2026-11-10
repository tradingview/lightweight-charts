import { expect } from 'chai';
import { describe, it } from 'node:test';
import { candlestickWidth } from '@tradingview/lwc-toolkit/dimensions/candles';

import {
	BoxWhiskerShape,
	boxWhiskerHit,
	boxWhiskerPlotValues,
	boxWhiskerWidths,
	fiveNumbers,
	isBoxPlot,
} from '../../src/geometry';

void describe('boxWhiskerPlotValues', () => {
	const item = { min: 10, q1: 20, median: 30, q3: 40, max: 50, outliers: [0, 90, NaN] };

	void it('reports both whisker ends, the extremes of the finite outliers, and the median last', () => {
		expect(boxWhiskerPlotValues(item)).to.deep.equal([50, 10, 90, 0, 30]);
	});

	void it('takes the extremes of all five numbers, in case they are not sorted', () => {
		expect(boxWhiskerPlotValues({ min: 10, q1: 20, median: 30, q3: 60, max: 50 })).to.deep.equal([60, 10, 30]);
	});

	void it('reads null outliers as none', () => {
		expect(boxWhiskerPlotValues({ ...item, outliers: null })).to.deep.equal([50, 10, 30]);
	});
});

void describe('isBoxPlot', () => {
	const point = { min: 1, q1: 2, median: 3, q3: 4, max: 5 };

	void it('needs five finite numbers', () => {
		expect(isBoxPlot(point)).to.equal(true);
		expect(isBoxPlot({ ...point, median: NaN })).to.equal(false);
		expect(isBoxPlot({ ...point, q3: null })).to.equal(false);
		expect(isBoxPlot({ ...point, max: '5' })).to.equal(false);
		expect(isBoxPlot({ min: 1, q1: 2, median: 3, q3: 4 })).to.equal(false);
	});

	void it('reads the numbers in drawing order', () => {
		expect(fiveNumbers(point)).to.deep.equal([1, 2, 3, 4, 5]);
	});
});

void describe('boxWhiskerWidths', () => {
	void it('makes the box as wide as a candlestick body, in bitmap pixels', () => {
		for (const ratio of [1, 1.5, 2]) {
			expect(boxWhiskerWidths(12, ratio, ratio).body).to.equal(candlestickWidth(12, ratio));
		}
	});

	void it('never makes the median line narrower than the box', () => {
		for (const spacing of [1, 3, 6, 12, 40]) {
			const widths = boxWhiskerWidths(spacing, 2, 2);
			expect(widths.median).to.be.at.least(widths.body);
		}
	});

	void it('centers the median line on the whisker, overhanging it equally on both sides', () => {
		for (const ratio of [1, 1.25, 1.5, 2]) {
			for (const spacing of [3, 6.4, 13, 40]) {
				const widths = boxWhiskerWidths(spacing, ratio, ratio);
				expect((widths.median - widths.whisker) % 2, `${spacing} px at ${ratio}x`).to.equal(0);
			}
		}
	});

	void it('keeps outlier dots between 1.5 and 4 CSS pixels in radius', () => {
		expect(boxWhiskerWidths(1, 2, 2).outlierRadius).to.equal(3);
		expect(boxWhiskerWidths(100, 2, 2).outlierRadius).to.equal(8);
	});
});

void describe('boxWhiskerHit', () => {
	// A box from y = 60 (q3) to y = 80 (q1), whiskers to y = 40 and y = 100,
	// centered on x = 50, with an outlier at y = 20.
	const shape: BoxWhiskerShape = {
		x: 50,
		ys: [100, 80, 70, 60, 40],
		outlierYs: [20],
		bodyWidth: 10,
		capWidth: 6,
		medianWidth: 16,
		whiskerWidth: 1,
		lineWidth: 1,
		outlierRadius: 3,
	};

	void it('reports the box anywhere inside it but the median line, the whisker line included', () => {
		expect(boxWhiskerHit(shape, 50, 66)).to.deep.equal({ part: 'box', distance: 0 });
		expect(boxWhiskerHit(shape, 54, 61)).to.deep.equal({ part: 'box', distance: 0 });
	});

	void it('reports the median line across the box, where it is drawn over the box', () => {
		// The median wins on its row even where it is no wider than the box,
		// as it is at the default bar spacing.
		expect(boxWhiskerHit(shape, 50, 70)).to.deep.equal({ part: 'median', distance: 0 });
		expect(boxWhiskerHit({ ...shape, medianWidth: shape.bodyWidth }, 52, 70.4)).to.deep.equal({ part: 'median', distance: 0 });
	});

	void it('reports the whisker beyond the box, and its caps', () => {
		expect(boxWhiskerHit(shape, 50, 50)).to.deep.equal({ part: 'whisker', distance: 0 });
		expect(boxWhiskerHit(shape, 53, 40)).to.deep.equal({ part: 'whisker', distance: 0 });
	});

	void it('reports the median line where it overhangs the box', () => {
		expect(boxWhiskerHit(shape, 57, 70)).to.deep.equal({ part: 'median', distance: 0 });
	});

	void it('reports an outlier by its index', () => {
		expect(boxWhiskerHit(shape, 51, 21)).to.deep.equal({ part: 'outlier-0', distance: 0 });
	});

	void it('measures the distance to the nearest part', () => {
		// 5 px right of the box, and 6 px above the median line's row.
		const hit = boxWhiskerHit(shape, 60, 64);
		expect(hit.part).to.equal('box');
		expect(hit.distance).to.equal(5);
	});
});
