import { expect } from 'chai';
import { Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import {
	clamp,
	firstVisibleIndex,
	lowerBoundByLogical,
	nearestIndexByLogical,
	scrollIntoViewRange,
	visibleBounds,
	zoomRange,
} from '../../src/navigation';
import { SeriesDataPoint } from '../../src/types';

/** Points whose `time` doubles as their logical index, so the mapping is trivial. */
function points(logicals: readonly number[]): SeriesDataPoint[] {
	return logicals.map(logical => ({ time: logical as unknown as Time, value: logical }));
}

const logicalIndexOf = (point: SeriesDataPoint): number | null => point.time as unknown as number;

void describe('clamp', () => {
	void it('keeps a value inside the range', () => {
		expect(clamp(5, 0, 10)).to.equal(5);
		expect(clamp(-1, 0, 10)).to.equal(0);
		expect(clamp(11, 0, 10)).to.equal(10);
	});
});

void describe('lowerBoundByLogical', () => {
	const data = points([0, 5, 10, 15]);

	void it('finds an exact match', () => {
		expect(lowerBoundByLogical(data, 10, logicalIndexOf)).to.equal(2);
	});

	void it('returns the first point after a gap', () => {
		expect(lowerBoundByLogical(data, 7, logicalIndexOf)).to.equal(2);
	});

	void it('returns the length when every point is before the target', () => {
		expect(lowerBoundByLogical(data, 100, logicalIndexOf)).to.equal(4);
	});

	void it('returns 0 for an empty series', () => {
		expect(lowerBoundByLogical([], 3, logicalIndexOf)).to.equal(0);
	});
});

void describe('nearestIndexByLogical', () => {
	const data = points([0, 10, 20]);

	void it('clamps to the ends', () => {
		expect(nearestIndexByLogical(data, -5, logicalIndexOf)).to.equal(0);
		expect(nearestIndexByLogical(data, 99, logicalIndexOf)).to.equal(2);
	});

	void it('picks the closer neighbour', () => {
		expect(nearestIndexByLogical(data, 12, logicalIndexOf)).to.equal(1);
		expect(nearestIndexByLogical(data, 18, logicalIndexOf)).to.equal(2);
	});

	void it('prefers the earlier point on a tie', () => {
		expect(nearestIndexByLogical(data, 15, logicalIndexOf)).to.equal(1);
	});
});

void describe('visibleBounds', () => {
	const data = points([0, 1, 2, 3, 4]);

	void it('returns the inclusive slice bounds', () => {
		expect(visibleBounds(data, { from: 1, to: 3 }, logicalIndexOf)).to.deep.equal({ from: 1, to: 3 });
	});

	void it('rounds the range inwards', () => {
		expect(visibleBounds(data, { from: 0.4, to: 2.6 }, logicalIndexOf)).to.deep.equal({ from: 1, to: 2 });
	});

	void it('is null when the viewport is past the data', () => {
		expect(visibleBounds(data, { from: 10, to: 20 }, logicalIndexOf)).to.equal(null);
		expect(visibleBounds(data, { from: -20, to: -10 }, logicalIndexOf)).to.equal(null);
	});

	void it('is null without a range or without points', () => {
		expect(visibleBounds(data, null, logicalIndexOf)).to.equal(null);
		expect(visibleBounds([], { from: 0, to: 1 }, logicalIndexOf)).to.equal(null);
	});
});

void describe('firstVisibleIndex', () => {
	const data = points([0, 1, 2, 3, 4]);

	void it('is the first point at or after the range start', () => {
		expect(firstVisibleIndex(data, { from: 1.2, to: 4 }, logicalIndexOf)).to.equal(2);
	});

	void it('falls back to 0 without a range', () => {
		expect(firstVisibleIndex(data, null, logicalIndexOf)).to.equal(0);
	});

	void it('stays inside the series when the range is past the data', () => {
		expect(firstVisibleIndex(data, { from: 99, to: 100 }, logicalIndexOf)).to.equal(4);
	});
});

void describe('scrollIntoViewRange', () => {
	const data = points([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

	void it('is null when the point is comfortably in view', () => {
		expect(scrollIntoViewRange(data, 5, { from: 2, to: 8 }, logicalIndexOf)).to.equal(null);
	});

	void it('nudges the window forward by the smallest amount', () => {
		// Span 6 keeps a one-point margin, so point 9 needs the window to end at 10.
		expect(scrollIntoViewRange(data, 9, { from: 2, to: 8 }, logicalIndexOf)).to.deep.equal({ from: 4, to: 10 });
	});

	void it('nudges the window back and clamps at the first point', () => {
		expect(scrollIntoViewRange(data, 0, { from: 3, to: 9 }, logicalIndexOf)).to.deep.equal({ from: 0, to: 6 });
	});

	void it('drops the margin on a narrow window', () => {
		expect(scrollIntoViewRange(data, 5, { from: 2, to: 5 }, logicalIndexOf)).to.equal(null);
	});

	void it('is null without a range or for a missing point', () => {
		expect(scrollIntoViewRange(data, 0, null, logicalIndexOf)).to.equal(null);
		expect(scrollIntoViewRange(data, 99, { from: 0, to: 5 }, logicalIndexOf)).to.equal(null);
	});
});

void describe('zoomRange', () => {
	void it('shrinks the span around the anchor when zooming in', () => {
		// Span 10 at 20% -> 8, anchor 10 sits at ratio 0 so the window starts there.
		expect(zoomRange({ from: 10, to: 20 }, 10, true, 0.2, 2)).to.deep.equal({ from: 10, to: 18 });
	});

	void it('grows the span when zooming out', () => {
		expect(zoomRange({ from: 10, to: 20 }, 10, false, 0.2, 2)).to.deep.equal({ from: 10, to: 22 });
	});

	void it('keeps the anchor at the same relative position', () => {
		const range = zoomRange({ from: 0, to: 10 }, 5, true, 0.2, 2);
		expect(range).to.not.equal(null);
		const { from, to } = range as { from: number; to: number };
		expect((5 - from) / (to - from)).to.be.closeTo(0.5, 1e-9);
	});

	void it('never zooms in past minZoomSpan', () => {
		expect(zoomRange({ from: 0, to: 2 }, 0, true, 0.5, 2)).to.deep.equal({ from: 0, to: 2 });
	});

	void it('centres on the viewport without an anchor', () => {
		expect(zoomRange({ from: 0, to: 10 }, null, true, 0.2, 2)).to.deep.equal({ from: 1, to: 9 });
	});

	void it('is null without a range or with an empty span', () => {
		expect(zoomRange(null, 0, true, 0.2, 2)).to.equal(null);
		expect(zoomRange({ from: 4, to: 4 }, 4, true, 0.2, 2)).to.equal(null);
	});
});
