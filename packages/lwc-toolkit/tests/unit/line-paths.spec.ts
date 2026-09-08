import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	areaBetween,
	buildLinePath,
	LinePathData,
	PolylineStroke,
	Position,
	strokeStyledPolyline,
	XPositioned,
} from '../../src/custom-series/line-paths.js';
import { BitmapCoordinatesRenderingScope } from '../../src/custom-series/renderer-base.js';

/**
 * Stand-in for the browser's `Path2D`, which Node does not provide. Each
 * instance records the calls made on it; a path copied into another one is
 * prefixed so that the composition stays visible in the recorded operations.
 */
class FakePath2D {
	public readonly ops: string[] = [];

	public constructor(from?: FakePath2D) {
		if (from !== undefined) {
			this.ops.push(...from.ops.map((op: string) => `copy:${op}`));
		}
	}

	public moveTo(x: number, y: number): void {
		this.ops.push(`moveTo(${x},${y})`);
	}

	public lineTo(x: number, y: number): void {
		this.ops.push(`lineTo(${x},${y})`);
	}

	public addPath(path: FakePath2D): void {
		this.ops.push(...path.ops.map((op: string) => `add:${op}`));
	}

	public closePath(): void {
		this.ops.push('closePath');
	}
}

(globalThis as unknown as { Path2D: unknown }).Path2D = FakePath2D;

function ops(path: LinePathData | Path2D): string[] {
	const target = 'path' in path ? path.path : path;
	return (target as unknown as FakePath2D).ops;
}

function scope(
	horizontalPixelRatio: number,
	verticalPixelRatio: number
): BitmapCoordinatesRenderingScope {
	return {
		horizontalPixelRatio,
		verticalPixelRatio,
	} as unknown as BitmapCoordinatesRenderingScope;
}

interface TestBar extends XPositioned {
	value: number;
}

function bars(xs: number[]): TestBar[] {
	return xs.map((x: number, i: number) => ({ x, value: i }));
}

const value = (bar: TestBar): number => bar.value;

void describe('buildLinePath', () => {
	void it('moves to the first point and lines to the rest', () => {
		const line = buildLinePath(bars([0, 10, 20]), 0, 3, value, scope(1, 1));
		expect(ops(line)).to.deep.equal([
			'moveTo(0,0)',
			'lineTo(10,1)',
			'lineTo(20,2)',
		]);
	});

	void it('scales x by the horizontal and y by the vertical pixel ratio', () => {
		const line = buildLinePath(bars([0, 10]), 0, 2, value, scope(2, 3));
		expect(ops(line)).to.deep.equal(['moveTo(0,0)', 'lineTo(20,3)']);
	});

	void it('only walks the requested range', () => {
		const line = buildLinePath(bars([0, 10, 20, 30]), 1, 3, value, scope(1, 1));
		expect(ops(line)).to.deep.equal(['moveTo(10,1)', 'lineTo(20,2)']);
	});

	void it('reports the first and last points of the path', () => {
		const line = buildLinePath(bars([0, 10, 20]), 0, 3, value, scope(2, 2));
		expect(line.first).to.deep.equal({ x: 0, y: 0 });
		expect(line.last).to.deep.equal({ x: 40, y: 4 });
	});

	void it('walks the bars backwards when reversed', () => {
		const line = buildLinePath(
			bars([0, 10, 20]),
			0,
			3,
			value,
			scope(1, 1),
			true
		);
		expect(ops(line)).to.deep.equal([
			'moveTo(20,2)',
			'lineTo(10,1)',
			'lineTo(0,0)',
		]);
	});

	void it('reports first and last in traversal order when reversed', () => {
		const line = buildLinePath(
			bars([0, 10, 20]),
			0,
			3,
			value,
			scope(1, 1),
			true
		);
		expect(line.first).to.deep.equal({ x: 20, y: 2 });
		expect(line.last).to.deep.equal({ x: 0, y: 0 });
	});

	void it('hands the absolute bar index to getY', () => {
		const indices: number[] = [];
		buildLinePath(
			bars([0, 10, 20, 30]),
			2,
			4,
			(_: TestBar, index: number) => {
				indices.push(index);
				return 0;
			},
			scope(1, 1)
		);
		expect(indices).to.deep.equal([2, 3]);
	});

	void it('draws a single bar as a lone move, with first equal to last', () => {
		const line = buildLinePath(bars([0, 10, 20]), 1, 2, value, scope(1, 1));
		expect(ops(line)).to.deep.equal(['moveTo(10,1)']);
		expect(line.first).to.deep.equal(line.last);
	});

	void it('returns an empty path for an empty range', () => {
		const line = buildLinePath(bars([0, 10]), 1, 1, value, scope(1, 1));
		expect(ops(line)).to.deep.equal([]);
		expect(line.first).to.deep.equal({ x: 0, y: 0 });
		expect(line.last).to.deep.equal({ x: 0, y: 0 });
	});
});

void describe('areaBetween', () => {
	void it('closes the band between the two lines', () => {
		const upper = buildLinePath(bars([0, 10]), 0, 2, value, scope(1, 1));
		const lower = buildLinePath(
			bars([0, 10]),
			0,
			2,
			(bar: TestBar) => bar.value + 5,
			scope(1, 1),
			true
		);
		expect(ops(areaBetween(upper, lower))).to.deep.equal([
			// the upper line, copied
			'copy:moveTo(0,0)',
			'copy:lineTo(10,1)',
			// across to where the (reversed) lower line starts
			'lineTo(10,6)',
			// the lower line, running back the other way
			'add:moveTo(10,6)',
			'add:lineTo(0,5)',
			// and back to the start of the upper line
			'lineTo(0,0)',
			'closePath',
		]);
	});

	void it('leaves the source paths untouched', () => {
		const upper = buildLinePath(bars([0, 10]), 0, 2, value, scope(1, 1));
		const lower = buildLinePath(bars([0, 10]), 0, 2, value, scope(1, 1), true);
		const before = [...ops(upper)];
		areaBetween(upper, lower);
		expect(ops(upper)).to.deep.equal(before);
	});
});

interface RecordedStroke {
	strokeStyle: string;
	lineWidth: number;
	points: string[];
}

interface FakeContext {
	strokes: RecordedStroke[];
	strokeStyle: string;
	lineWidth: number;
}

/**
 * Minimal context which records each stroked run: the style in effect and the
 * points which were added to the path since the last `beginPath`.
 */
function fakeContext(): FakeContext & CanvasRenderingContext2D {
	const strokes: RecordedStroke[] = [];
	let points: string[] = [];
	const context = {
		strokes,
		strokeStyle: '',
		lineWidth: 0,
		beginPath: (): void => {
			points = [];
		},
		moveTo: (x: number, y: number): void => {
			points.push(`M${x},${y}`);
		},
		lineTo: (x: number, y: number): void => {
			points.push(`L${x},${y}`);
		},
	} as unknown as FakeContext & CanvasRenderingContext2D;
	context.stroke = (): void => {
		strokes.push({
			strokeStyle: context.strokeStyle as string,
			lineWidth: context.lineWidth,
			points: [...points],
		});
	};
	return context;
}

function points(xs: number[]): Position[] {
	return xs.map((x: number) => ({ x, y: x }));
}

void describe('strokeStyledPolyline', () => {
	const red: PolylineStroke = { strokeStyle: 'red', lineWidth: 1 };
	const blue: PolylineStroke = { strokeStyle: 'blue', lineWidth: 3 };

	void it('strokes a single-styled line once', () => {
		const ctx = fakeContext();
		strokeStyledPolyline(ctx, points([0, 1, 2, 3]), () => red);
		expect(ctx.strokes).to.have.length(1);
		expect(ctx.strokes[0]).to.deep.equal({
			strokeStyle: 'red',
			lineWidth: 1,
			points: ['M0,0', 'L1,1', 'L2,2', 'L3,3'],
		});
	});

	void it('starts a new run when the style object changes', () => {
		const ctx = fakeContext();
		strokeStyledPolyline(ctx, points([0, 1, 2, 3]), (i: number) =>
			i < 3 ? red : blue
		);
		expect(ctx.strokes.map((s: RecordedStroke) => s.strokeStyle)).to.deep.equal(
			['red', 'blue']
		);
		expect(ctx.strokes[0].points).to.deep.equal(['M0,0', 'L1,1', 'L2,2']);
		// the new run restarts at the last point of the previous one, so the
		// line stays joined up
		expect(ctx.strokes[1].points).to.deep.equal(['M2,2', 'L3,3']);
	});

	void it('applies the line width of each run', () => {
		const ctx = fakeContext();
		strokeStyledPolyline(ctx, points([0, 1, 2]), (i: number) =>
			i < 2 ? red : blue
		);
		expect(ctx.strokes.map((s: RecordedStroke) => s.lineWidth)).to.deep.equal([
			1, 3,
		]);
	});

	void it('styles the segment ending at a point by that point index', () => {
		const seen: number[] = [];
		strokeStyledPolyline(fakeContext(), points([0, 1, 2]), (i: number) => {
			seen.push(i);
			return red;
		});
		// each segment is styled once, and there is no segment for point 0
		expect(seen).to.deep.equal([1, 2]);
	});

	void it('strokes once per run, not once per segment', () => {
		const ctx = fakeContext();
		const styles = [red, red, blue, blue, red];
		strokeStyledPolyline(
			ctx,
			points([0, 1, 2, 3, 4]),
			(i: number) => styles[i]
		);
		expect(ctx.strokes.map((s: RecordedStroke) => s.strokeStyle)).to.deep.equal(
			['red', 'blue', 'red']
		);
	});

	void it('treats equal-looking but distinct style objects as separate runs', () => {
		const ctx = fakeContext();
		strokeStyledPolyline(ctx, points([0, 1, 2]), () => ({
			strokeStyle: 'red',
			lineWidth: 1,
		}));
		expect(ctx.strokes).to.have.length(2);
	});

	void it('draws nothing for fewer than two points', () => {
		const ctx = fakeContext();
		strokeStyledPolyline(ctx, points([0]), () => red);
		strokeStyledPolyline(ctx, [], () => red);
		expect(ctx.strokes).to.deep.equal([]);
	});
});
