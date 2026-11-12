import { expect } from 'chai';
import { describe, it } from 'node:test';

import { BackgroundShadeSeriesRenderer } from '../../src/renderer';
import { defaultOptions } from '../../src/options';

/**
 * A 2D context that keeps a `fillStyle` the way a canvas does, ignoring a
 * value it cannot parse, and records the rectangles drawn.
 */
class RecordingContext {
	public rects: { left: number; width: number; fill: string }[] = [];
	public globalAlpha = 1;
	private _fillStyle = '#000000';

	public get fillStyle(): string {
		return this._fillStyle;
	}

	public set fillStyle(value: string) {
		if (/^(#[0-9a-f]{6}|rgba?\()/i.test(value)) {
			this._fillStyle = value;
		}
	}

	public fillRect(left: number, _top: number, width: number): void {
		this.rects.push({ left, width, fill: this._fillStyle });
	}

	public save(): void {}

	public restore(): void {}
}

// The renderer parses colors on a scratch canvas of its own; in Node that
// canvas is a RecordingContext too.
(globalThis as { document?: unknown }).document = {
	createElement: () => ({ getContext: () => new RecordingContext() }),
};

function drawColumns(xs: number[], barSpacing: number, barColors: string[] = []): { left: number; width: number; fill: string }[] {
	const renderer = new BackgroundShadeSeriesRenderer();
	// The chart hands each bar the point's color, or the series color, which
	// is empty by default.
	const bars = xs.map((x, index) => ({ x, time: index, barColor: barColors[index] ?? '', originalData: { time: index, value: 150 } }));
	renderer.update(
		{ bars, barSpacing, visibleRange: { from: 0, to: bars.length }, conflationFactor: 1 } as never,
		defaultOptions
	);
	const context = new RecordingContext();
	const target = {
		useBitmapCoordinateSpace: (draw: (scope: unknown) => void) => draw({
			context,
			horizontalPixelRatio: 1,
			verticalPixelRatio: 1,
			bitmapSize: { width: 200, height: 100 },
			mediaSize: { width: 200, height: 100 },
		}),
	};
	renderer.draw(target as never, () => null);
	return context.rects;
}

void describe('BackgroundShadeSeriesRenderer', () => {
	void it('starts each column where the one before it ends, even when their edges round apart', () => {
		// Coordinates a hair off exact, as the chart's arithmetic produces: the
		// first column's right edge falls just below 10.5 and the second's left
		// edge just above it, so rounding each on its own left a 1 px seam.
		const rects = drawColumns([9.8499999, 11.1500001], 1.3);
		expect(rects).to.have.length(2);
		expect(rects[1].left).to.equal(rects[0].left + rects[0].width);
	});

	void it('shades a bar with its point color, and one with an invalid point color from its value', () => {
		// All values are past highValue, so every bar shaded from its value gets
		// the high color. The invalid color is checked on another context, so
		// the chart's fillStyle still holds the previous fill when it is drawn.
		const rects = drawColumns([10, 20, 30, 40], 10, ['', '#00ff00', 'not-a-color', '']);
		expect(rects.map(rect => rect.fill)).to.deep.equal([
			rects[0].fill,
			'#00ff00',
			rects[0].fill,
			rects[0].fill,
		]);
		expect(rects[0].fill).to.match(/^rgba\(255, 50, 50/);
	});
});
