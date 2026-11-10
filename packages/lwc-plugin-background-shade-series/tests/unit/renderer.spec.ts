import { expect } from 'chai';
import { describe, it } from 'node:test';

import { BackgroundShadeSeriesRenderer } from '../../src/renderer';
import { defaultOptions } from '../../src/options';

/**
 * A 2D context that keeps a `fillStyle` the way a canvas does, ignoring a
 * value it cannot parse, and records the rectangles drawn.
 */
class RecordingContext {
	public rects: { left: number; width: number }[] = [];
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
		this.rects.push({ left, width });
	}

	public save(): void {}

	public restore(): void {}
}

// The renderer parses colors on a scratch canvas of its own; in Node that
// canvas is a RecordingContext too.
(globalThis as { document?: unknown }).document = {
	createElement: () => ({ getContext: () => new RecordingContext() }),
};

function drawColumns(xs: number[], barSpacing: number): { left: number; width: number }[] {
	const renderer = new BackgroundShadeSeriesRenderer();
	const bars = xs.map((x, index) => ({ x, time: index, barColor: '#000000', originalData: { time: index, value: 50 } }));
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
});
