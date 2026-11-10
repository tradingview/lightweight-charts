import { expect } from 'chai';
import { describe, it } from 'node:test';

import { HeatmapCell } from '../../src/data';
import { HeatmapSeriesRenderer } from '../../src/renderer';
import { HeatmapSeriesOptions, defaultOptions } from '../../src/options';

/** A rectangle the renderer added to a path, with the fill it was filled in. */
interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
	fill: string;
}

/**
 * A 2D context that keeps a `fillStyle` the way a canvas does, ignoring a
 * value it cannot parse, and records the rectangles of every path it fills.
 */
class RecordingContext {
	public rects: Rect[] = [];
	public fills = 0;
	private _fillStyle = '#000000';
	private _path: Omit<Rect, 'fill'>[] = [];

	public get fillStyle(): string {
		return this._fillStyle;
	}

	public set fillStyle(value: string) {
		if (/^(#[0-9a-f]{6}|rgba?\(\d)/i.test(value)) {
			this._fillStyle = value;
		}
	}

	public beginPath(): void {
		this._path = [];
	}

	public rect(x: number, y: number, width: number, height: number): void {
		this._path.push({ x, y, width, height });
	}

	public fill(): void {
		this.fills++;
		this.rects.push(...this._path.map(rect => ({ ...rect, fill: this._fillStyle })));
	}
}

// The renderer checks colors on a scratch canvas of its own; in Node that
// canvas is a RecordingContext too.
(globalThis as { document?: unknown }).document = {
	createElement: () => ({ getContext: () => new RecordingContext() }),
};

/** How `draw` lays the chart out. */
interface Layout {
	barSpacing?: number;
	/** The bars' time indices; consecutive from 0 by default. */
	times?: number[];
	horizontalPixelRatio?: number;
	verticalPixelRatio?: number;
}

/** Draws columns at `xs`, each with `cells`, prices mapped to y = 100 - price, and returns the context. */
function draw(
	xs: number[],
	cells: (HeatmapCell | null)[],
	options: Partial<HeatmapSeriesOptions> = {},
	layout: Layout | number = {}
): RecordingContext {
	const { barSpacing = 10, times, horizontalPixelRatio = 1, verticalPixelRatio = 1 } = typeof layout === 'number' ? { barSpacing: layout } : layout;
	const renderer = new HeatmapSeriesRenderer();
	const bars = xs.map((x, index) => ({ x, time: times?.[index] ?? index, barColor: '#000000', originalData: { time: index, cells } }));
	renderer.update(
		{ bars, barSpacing, visibleRange: { from: 0, to: bars.length } } as never,
		{ ...defaultOptions, cellGap: 0, ...options }
	);
	const context = new RecordingContext();
	const target = {
		useBitmapCoordinateSpace: (paint: (scope: unknown) => void) => paint({
			context,
			horizontalPixelRatio,
			verticalPixelRatio,
			bitmapSize: { width: 200 * horizontalPixelRatio, height: 100 * verticalPixelRatio },
			mediaSize: { width: 200, height: 100 },
		}),
	};
	renderer.draw(target as never, (price: number) => 100 - price as never);
	return context;
}

const red = '#ff0000';
const blue = '#0000ff';

void describe('HeatmapSeriesRenderer', () => {
	void it('starts each column where the one before it ends, even when their edges round apart', () => {
		// Coordinates a hair off exact, as the chart's arithmetic produces: the
		// first column's right edge falls just below 10.5 and the second's left
		// edge just above it, so rounding each on its own left a 1 px seam.
		const { rects } = draw([9.8499999, 11.1500001], [{ low: 0, high: 10, amount: 1 }], { cellShader: () => red }, 1.3);
		expect(rects).to.have.length(2);
		expect(rects[1].x).to.equal(rects[0].x + rects[0].width);
	});

	void it('fills the cells of each color as one path', () => {
		const cells = [0, 1, 2, 3, 4, 5].map(r => ({ low: r * 10, high: r * 10 + 10, amount: r % 2 }));
		const context = draw([10, 20, 30, 40], cells, { cellShader: amount => (amount > 0 ? red : blue) });
		expect(context.fills).to.equal(2);
		expect(context.rects).to.have.length(24);
		expect(context.rects.filter(rect => rect.fill === red)).to.have.length(12);
	});

	void it('fills the borders of every cell as one more path, around the fill', () => {
		const context = draw([10, 30], [{ low: 0, high: 20, amount: 1 }], { cellShader: () => red, cellBorderWidth: 2, cellBorderColor: blue }, 20);
		expect(context.fills).to.equal(2);
		const fill = context.rects.filter(rect => rect.fill === red);
		expect(fill[0]).to.deep.include({ x: 2, y: 82, width: 16, height: 16 });
		// Four strips per cell, framing the fill.
		expect(context.rects.filter(rect => rect.fill === blue)).to.have.length(8);
	});

	void it('leaves out a cell whose color the canvas cannot parse, instead of painting it in the last fill', () => {
		const cells = [{ low: 0, high: 10, amount: 0 }, { low: 10, high: 20, amount: 1 }];
		const { rects } = draw([10], cells, { cellShader: amount => (amount > 0 ? 'not-a-color' : red) });
		expect(rects).to.have.length(1);
		expect(rects[0]).to.deep.include({ y: 90, fill: red });
	});

	void it('falls back to the default shader when the shader is not a function', () => {
		const { rects } = draw([10], [{ low: 0, high: 10, amount: 100 }], { cellShader: 'red' as never });
		expect(rects[0].fill).to.equal(defaultOptions.cellShader(100, { min: 100, max: 100 }));
	});

	void it('draws no cell off the pane, and none under half a pixel tall', () => {
		const cells = [{ low: 0, high: 10, amount: 1 }, { low: 150, high: 200, amount: 1 }, { low: -50, high: -10, amount: 1 }, { low: 20, high: 20.2, amount: 1 }];
		const { rects } = draw([10], cells, { cellShader: () => red });
		expect(rects).to.have.length(1);
		expect(rects[0]).to.deep.include({ y: 90, height: 10 });
	});

	void it('hands the shader the range of the amounts in view', () => {
		const seen: number[][] = [];
		draw([10, 20], [{ low: 0, high: 10, amount: 4 }, { low: 10, high: 20, amount: 9 }, null], {
			cellShader: (amount, range) => {
				seen.push([amount, range.min, range.max]);
				return red;
			},
		});
		expect(seen).to.deep.equal([[4, 4, 9], [9, 4, 9], [4, 4, 9], [9, 4, 9]]);
	});

	void it('gives every cell of one size the gap, however its edges round', () => {
		// Rows 3.5 px apart round to 4, 3, 4 and 3 px. Deciding on the rounded
		// length gave only the 4 px rows a gap.
		const cells = [0, 1, 2, 3].map(r => ({ low: 100 - (0.25 + r * 3.5), high: 100 - (0.25 + (r + 1) * 3.5), amount: 1 }));
		const { rects } = draw([10], cells, { cellShader: () => red, cellGap: 1 }, 20);
		const rows = rects.map(rect => [rect.y, rect.y + rect.height]).sort((a, b) => a[0] - b[0]);
		expect(rows).to.have.length(4);
		for (let i = 1; i < rows.length; i++) {
			expect(rows[i][0] - rows[i - 1][1], `gap above row ${i}`).to.equal(1);
		}
	});

	void it('leaves out the border of a cell whose color is invalid, with the cell', () => {
		const cells = [{ low: 0, high: 20, amount: 0 }, { low: 20, high: 40, amount: 1 }];
		const context = draw([10], cells, { cellShader: amount => (amount > 0 ? 'nope' : red), cellBorderWidth: 1, cellBorderColor: blue }, 20);
		const frame = context.rects.filter(rect => rect.fill === blue);
		expect(frame).to.have.length(4);
		expect(frame.every(rect => rect.y >= 80)).to.equal(true);
	});

	void it('draws no border when the border color is invalid', () => {
		const context = draw([10], [{ low: 0, high: 20, amount: 1 }], { cellShader: () => red, cellBorderWidth: 2, cellBorderColor: 'no-such-color' }, 20);
		expect(context.fills).to.equal(1);
		expect(context.rects).to.have.length(1);
		expect(context.rects[0]).to.deep.include({ width: 20, height: 20 });
	});

	void it('rounds the gap and the border per axis, each by its own pixel ratio', () => {
		// At 1.5 horizontally and 1.25 vertically, a 1 px gap is 2 device pixels
		// across and 1 down, and a 1 px border 2 across and 1 down.
		const context = draw([20], [{ low: 0, high: 40, amount: 1 }], { cellShader: () => red, cellGap: 1, cellBorderWidth: 1, cellBorderColor: blue }, {
			barSpacing: 40,
			horizontalPixelRatio: 1.5,
			verticalPixelRatio: 1.25,
		});
		const fill = context.rects.filter(rect => rect.fill === red)[0];
		// The slot spans 0 to 60 device pixels across, the cell 75 to 125 down.
		expect(fill).to.deep.include({ x: 1 + 2, width: 60 - 2 - 4, y: 75 + 0 + 1, height: 50 - 1 - 2 });
	});

	void it('counts a negative gap or border width as none', () => {
		const { rects } = draw([10], [{ low: 0, high: 20, amount: 1 }], { cellShader: () => red, cellGap: -4, cellBorderWidth: -2, cellBorderColor: blue }, 20);
		expect(rects).to.have.length(1);
		expect(rects[0]).to.deep.include({ x: 0, y: 80, width: 20, height: 20 });
	});

	void it('starts a column after whitespace at its own left edge', () => {
		// Times 0 and 2: the bar between them is whitespace, so the second column
		// does not reach back to where the first ended.
		const { rects } = draw([10, 30], [{ low: 0, high: 10, amount: 1 }], { cellShader: () => red }, { barSpacing: 10, times: [0, 2] });
		expect(rects.map(rect => rect.x)).to.deep.equal([5, 25]);
	});

	void it('skips columns that round to no width', () => {
		const { rects } = draw([10, 10.4, 10.8, 11.2], [{ low: 0, high: 10, amount: 1 }], { cellShader: () => red }, 0.4);
		expect(rects.every(rect => rect.width > 0)).to.equal(true);
		expect(rects.length).to.be.lessThan(4);
	});
});
