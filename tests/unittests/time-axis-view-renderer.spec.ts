/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { TimeAxisViewRenderer, TimeAxisViewRendererData } from '../../src/renderers/time-axis-view-renderer';
import { TimeAxisViewRendererOptions } from '../../src/renderers/itime-axis-view-renderer';
import { TextWidthCache } from '../../src/model/text-width-cache';

function fakeMeasureCtx() {
	return {
		measureText: (text: string) => ({
			width: text.length * 10,
			actualBoundingBoxAscent: 0,
			actualBoundingBoxDescent: 0,
		}),
		save: () => {},
		restore: () => {},
		textBaseline: 'alphabetic' as CanvasTextBaseline,
		font: '',
	};
}

interface Recorded {
	boxAnchorY?: number;
	tickTop?: number;
	tickBottom?: number;
	textTranslateY?: number;
}

function fakeTarget(bitmapHeight: number, recorded: Recorded) {
	const bitmapCtx = {
		fillStyle: '',
		beginPath: () => {},
		moveTo: (x: number, y: number) => {
			recorded.boxAnchorY = y;
		},
		lineTo: () => {},
		arcTo: () => {},
		fill: () => {},
		fillRect: (x: number, y: number, w: number, h: number) => {
			recorded.tickTop = y;
			recorded.tickBottom = y + h;
		},
	};
	const textCtx = {
		...fakeMeasureCtx(),
		textAlign: 'left' as CanvasTextAlign,
		fillStyle: '',
		translate: (x: number, y: number) => {
			recorded.textTranslateY = y;
		},
		fillText: () => {},
	};
	return {
		useMediaCoordinateSpace: (cb: (scope: { context: unknown; mediaSize: { height: number } }) => unknown) =>
			cb({ context: textCtx, mediaSize: { height: bitmapHeight } }),
		useBitmapCoordinateSpace: (cb: (scope: { context: unknown; bitmapSize: { height: number }; horizontalPixelRatio: number; verticalPixelRatio: number }) => unknown) =>
			cb({ context: bitmapCtx, bitmapSize: { height: bitmapHeight }, horizontalPixelRatio: 1, verticalPixelRatio: 1 }),
	};
}

function rendererOptions(position: 'top' | 'bottom'): TimeAxisViewRendererOptions {
	return {
		borderSize: 1,
		baselineOffset: 0,
		paddingTop: 3,
		paddingBottom: 11,
		paddingHorizontal: 9,
		tickLength: 5,
		fontSize: 12,
		font: '12px sans-serif',
		widthCache: new TextWidthCache(),
		labelBottomOffset: 4,
		position,
	};
}

function rendererData(): TimeAxisViewRendererData {
	return {
		visible: true,
		background: '#000',
		color: '#fff',
		text: 'label',
		width: 200,
		coordinate: 100,
		tickVisible: true,
	};
}

describe('TimeAxisViewRenderer position mirroring', () => {
	// labelHeight = ceil(border 1 + tick 5 + paddingTop 3 + font 12 + paddingBottom 11) = 32, widget height 40
	it('bottom: box anchored to widget top, text below border+tick+paddingTop', () => {
		const recorded: Recorded = {};
		const target = fakeTarget(40, recorded);
		const renderer = new TimeAxisViewRenderer();
		renderer.setData(rendererData());
		renderer.draw(target as never, rendererOptions('bottom'));

		// yText = 0 + border 1 + tick 5 + paddingTop 3 + fontSize/2 6 = 15
		expect(recorded.textTranslateY).to.be.equal(15);
		// tick from 0 to 5
		expect(recorded.tickTop).to.be.equal(0);
		expect(recorded.tickBottom).to.be.equal(5);
		// box path starts at the widget's top edge
		expect(recorded.boxAnchorY).to.be.equal(0);
	});

	it('top: box anchored to widget bottom, text below paddingBottom from the free edge', () => {
		const recorded: Recorded = {};
		const target = fakeTarget(40, recorded);
		const renderer = new TimeAxisViewRenderer();
		renderer.setData(rendererData());
		renderer.draw(target as never, rendererOptions('top'));

		// yBox = 40 - 32 = 8; yText = 8 + paddingBottom 11 + fontSize/2 6 = 25
		expect(recorded.textTranslateY).to.be.equal(25);
		// tick mirrored to the attachment (bottom) edge: from 40 - 5 = 35 to 40
		expect(recorded.tickTop).to.be.equal(35);
		expect(recorded.tickBottom).to.be.equal(40);
		// box path starts at the widget's bottom edge
		expect(recorded.boxAnchorY).to.be.equal(40);
	});
});
