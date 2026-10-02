import { expect } from 'chai';
import { describe, it } from 'node:test';

import { FitRectOptions, anchorFractions, fitRect } from '../../src/fit-rect.js';

const pane = { width: 400, height: 200 };
const image = { width: 200, height: 100 };

function options(overrides?: Partial<FitRectOptions>): FitRectOptions {
	return {
		position: 'center',
		objectFit: 'contain',
		padding: 0,
		maxWidth: undefined,
		maxHeight: undefined,
		...overrides,
	};
}

void describe('anchorFractions', () => {
	void it('maps the named anchors', () => {
		expect(anchorFractions('center')).to.deep.equal({ x: 0.5, y: 0.5 });
		expect(anchorFractions('top-left')).to.deep.equal({ x: 0, y: 0 });
		expect(anchorFractions('top-right')).to.deep.equal({ x: 1, y: 0 });
		expect(anchorFractions('bottom-left')).to.deep.equal({ x: 0, y: 1 });
		expect(anchorFractions('bottom-right')).to.deep.equal({ x: 1, y: 1 });
	});

	void it('clamps a custom anchor and falls back for non-finite values', () => {
		expect(anchorFractions({ x: -1, y: 2 })).to.deep.equal({ x: 0, y: 1 });
		expect(anchorFractions({ x: NaN, y: 0.25 })).to.deep.equal({
			x: 0.5,
			y: 0.25,
		});
	});
});

void describe('fitRect', () => {
	void it('centres a contained image and keeps its aspect ratio', () => {
		const placement = fitRect(image, pane, options());
		expect(placement).to.not.equal(null);
		// Fits by height: 100 -> 200, so 400x200 filling the pane exactly.
		expect(placement?.dest).to.deep.equal({
			x: 0,
			y: 0,
			width: 400,
			height: 200,
		});
		expect(placement?.source).to.deep.equal({
			x: 0,
			y: 0,
			width: 200,
			height: 100,
		});
	});

	void it('honours padding', () => {
		const placement = fitRect(image, pane, options({ padding: 20 }));
		// 360x160 available, fitting by height: 320x160, centred.
		expect(placement?.dest).to.deep.equal({
			x: 40,
			y: 20,
			width: 320,
			height: 160,
		});
	});

	void it('limits the drawing area with maxWidth / maxHeight', () => {
		const placement = fitRect(image, pane, options({ maxWidth: 100 }));
		expect(placement?.dest).to.deep.equal({
			x: 150,
			y: 75,
			width: 100,
			height: 50,
		});
	});

	void it('anchors the image in the corners', () => {
		const opts = options({ maxWidth: 100, maxHeight: 100 });
		expect(fitRect(image, pane, { ...opts, position: 'top-left' })?.dest).to.deep.equal({
			x: 0,
			y: 0,
			width: 100,
			height: 50,
		});
		expect(
			fitRect(image, pane, { ...opts, position: 'bottom-right' })?.dest
		).to.deep.equal({ x: 300, y: 150, width: 100, height: 50 });
	});

	void it('places a fractional anchor between the edges', () => {
		const placement = fitRect(
			image,
			pane,
			options({ maxWidth: 100, position: { x: 0.25, y: 1 } })
		);
		expect(placement?.dest).to.deep.equal({
			x: 75,
			y: 150,
			width: 100,
			height: 50,
		});
	});

	void it('draws objectFit none at the natural size', () => {
		const placement = fitRect(image, pane, options({ objectFit: 'none' }));
		expect(placement?.dest).to.deep.equal({
			x: 100,
			y: 50,
			width: 200,
			height: 100,
		});
	});

	void it('crops the overflow of objectFit cover', () => {
		// The pane is 2:1 and the image 1:1, so cover scales by width and crops
		// the top and bottom halves of the image away.
		const placement = fitRect(
			{ width: 100, height: 100 },
			pane,
			options({ objectFit: 'cover' })
		);
		expect(placement?.dest).to.deep.equal({
			x: 0,
			y: 0,
			width: 400,
			height: 200,
		});
		expect(placement?.source).to.deep.equal({
			x: 0,
			y: 25,
			width: 100,
			height: 50,
		});
	});

	void it('crops objectFit none against the drawing area', () => {
		const placement = fitRect(
			image,
			pane,
			options({ objectFit: 'none', maxWidth: 50, maxHeight: 50 })
		);
		expect(placement?.dest).to.deep.equal({
			x: 175,
			y: 75,
			width: 50,
			height: 50,
		});
		expect(placement?.source).to.deep.equal({
			x: 75,
			y: 25,
			width: 50,
			height: 50,
		});
	});

	void it('returns null when there is nothing to draw', () => {
		expect(fitRect({ width: 0, height: 0 }, pane, options())).to.equal(null);
		expect(fitRect(image, { width: 0, height: 0 }, options())).to.equal(null);
		expect(fitRect(image, pane, options({ padding: 200 }))).to.equal(null);
		expect(fitRect(image, pane, options({ maxWidth: 0 }))).to.equal(null);
	});
});
