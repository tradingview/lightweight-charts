import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	clampCornerRadius,
	CornerRadii,
	drawRoundRect,
	drawRoundRectWithBorder,
} from '../../src/canvas/round-rect.js';

interface RecordedCall {
	method: string;
	args: unknown[];
}

interface FakeContext {
	calls: RecordedCall[];
	fillStyle: string;
	strokeStyle: string;
	lineWidth: number;
}

/**
 * Minimal `CanvasRenderingContext2D` stand-in which records the calls made on it,
 * plus the fill/stroke style in effect at the time of each fill or stroke.
 */
function fakeContext(): FakeContext & CanvasRenderingContext2D {
	const calls: RecordedCall[] = [];
	const record =
		(method: string) =>
			(...args: unknown[]): void => {
				calls.push({ method, args });
			};
	const context = {
		calls,
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 0,
		beginPath: record('beginPath'),
		closePath: record('closePath'),
		roundRect: record('roundRect'),
		save: record('save'),
		restore: record('restore'),
	} as unknown as FakeContext & CanvasRenderingContext2D;
	context.fill = (): void => {
		calls.push({ method: 'fill', args: [context.fillStyle] });
	};
	context.stroke = (): void => {
		calls.push({ method: 'stroke', args: [context.strokeStyle, context.lineWidth] });
	};
	return context;
}

function methods(ctx: FakeContext): string[] {
	return ctx.calls.map((call: RecordedCall) => call.method);
}

function call(ctx: FakeContext, method: string): RecordedCall {
	const found = ctx.calls.find((item: RecordedCall) => item.method === method);
	expect(found, `no ${method} call recorded`).to.not.equal(undefined);
	return found as RecordedCall;
}

void describe('clampCornerRadius', () => {
	void it('returns the desired radius when the rectangle is big enough', () => {
		expect(clampCornerRadius(4, 20, 30)).to.equal(4);
	});

	void it('never exceeds half the width', () => {
		expect(clampCornerRadius(10, 6, 30)).to.equal(3);
	});

	void it('never exceeds the height', () => {
		expect(clampCornerRadius(10, 40, 2)).to.equal(2);
	});

	void it('treats a negative height as its absolute value', () => {
		// a box drawn upwards from the zero line has a negative length
		expect(clampCornerRadius(10, 40, -2)).to.equal(2);
	});

	void it('floors the result to a whole bitmap pixel', () => {
		expect(clampCornerRadius(2.9, 40, 30)).to.equal(2);
		expect(clampCornerRadius(10, 5, 30)).to.equal(2);
	});

	void it('returns 0 for a zero sized rectangle', () => {
		expect(clampCornerRadius(5, 0, 0)).to.equal(0);
	});
});

void describe('drawRoundRect', () => {
	void it('starts a new path and adds the rounded rect to it', () => {
		const ctx = fakeContext();
		const radii: CornerRadii = [1, 2, 3, 4];
		drawRoundRect(ctx, 10, 20, 30, 40, radii);
		expect(methods(ctx)).to.deep.equal(['beginPath', 'roundRect']);
		expect(call(ctx, 'roundRect').args).to.deep.equal([10, 20, 30, 40, radii]);
	});

	void it('neither fills nor strokes the path', () => {
		const ctx = fakeContext();
		drawRoundRect(ctx, 0, 0, 1, 1, [0, 0, 0, 0]);
		expect(methods(ctx)).to.not.include('fill');
		expect(methods(ctx)).to.not.include('stroke');
	});
});

void describe('drawRoundRectWithBorder', () => {
	void it('clamps inset radii to zero when the border is thicker than the corner radius', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 0, 0, 20, 20, '#f00', 4, [1, 0, 3, 1], '#00f');
		// Canvas roundRect throws a RangeError for any negative radius.
		expect(call(ctx, 'roundRect').args[4]).to.deep.equal([0, 0, 1, 0]);
	});

	void it('fills the whole rect and skips the border when the border width is 0', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 10, 20, 30, 40, '#f00', 0, [2, 2, 2, 2], '#00f');
		expect(methods(ctx)).to.deep.equal([
			'save',
			'beginPath',
			'roundRect',
			'fill',
			'restore',
		]);
		expect(call(ctx, 'roundRect').args).to.deep.equal([
			10,
			20,
			30,
			40,
			[2, 2, 2, 2],
		]);
		expect(call(ctx, 'fill').args).to.deep.equal(['#f00']);
	});

	void it('skips the border when no border colour is given', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 10, 20, 30, 40, '#f00', 2, [2, 2, 2, 2]);
		expect(methods(ctx)).to.not.include('stroke');
		expect(call(ctx, 'roundRect').args).to.deep.equal([
			10,
			20,
			30,
			40,
			[2, 2, 2, 2],
		]);
	});

	void it('skips the border when it is the same colour as the background', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 10, 20, 30, 40, '#f00', 2, [2, 2, 2, 2], '#f00');
		expect(methods(ctx)).to.not.include('stroke');
	});

	void it('defaults to no border and square corners', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 10, 20, 30, 40, '#f00');
		expect(methods(ctx)).to.not.include('stroke');
		expect(call(ctx, 'roundRect').args).to.deep.equal([
			10,
			20,
			30,
			40,
			[0, 0, 0, 0],
		]);
	});

	void it('insets the path by half the border width, so the stroke sits inside the rect', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 10, 20, 30, 40, '#f00', 2, [4, 4, 4, 4], '#00f');
		expect(call(ctx, 'roundRect').args).to.deep.equal([
			11,
			21,
			28,
			38,
			[3, 3, 3, 3],
		]);
		expect(methods(ctx)).to.deep.equal([
			'save',
			'beginPath',
			'roundRect',
			'fill',
			'stroke',
			'restore',
		]);
	});

	void it('fills with the background and strokes with the border colour and width', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 10, 20, 30, 40, '#f00', 2, [4, 4, 4, 4], '#00f');
		expect(call(ctx, 'fill').args).to.deep.equal(['#f00']);
		expect(call(ctx, 'stroke').args).to.deep.equal(['#00f', 2]);
	});

	void it('leaves square corners square when insetting the radii', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 0, 0, 20, 20, '#f00', 4, [6, 0, 6, 0], '#00f');
		expect(call(ctx, 'roundRect').args[4]).to.deep.equal([4, 0, 4, 0]);
	});

	void it('always restores the context', () => {
		for (const borderColor of [undefined, '#00f']) {
			const ctx = fakeContext();
			drawRoundRectWithBorder(ctx, 0, 0, 20, 20, '#f00', 2, [1, 1, 1, 1], borderColor);
			expect(methods(ctx).filter((m: string) => m === 'save')).to.have.length(1);
			expect(methods(ctx).filter((m: string) => m === 'restore')).to.have.length(1);
		}
	});
	void it('caps a thick border at the size of a narrow rectangle', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 0, 0, 1, 3, '#f00', 4, [1, 1, 1, 1], '#00f');
		expect(call(ctx, 'roundRect').args).to.deep.equal([0.5, 0.5, 0, 2, [0.5, 0.5, 0.5, 0.5]]);
		expect(call(ctx, 'stroke').args).to.deep.equal(['#00f', 1]);
	});

	void it('does not stroke zero-sized rectangles with a stale line width', () => {
		const ctx = fakeContext();
		drawRoundRectWithBorder(ctx, 0, 0, 0, 3, '#f00', 4, [1, 1, 1, 1], '#00f');
		expect(methods(ctx)).to.deep.equal([]);
	});

});
