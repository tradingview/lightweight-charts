import { expect } from 'chai';
import { describe, it } from 'node:test';

import type { CanvasRenderingTarget2D } from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import type { PriceToCoordinateConverter } from 'lightweight-charts';

import { ScatterGeometryCache, XMapping } from '../../src/geometry.js';
import { ScatterModel, buildScatterModel } from '../../src/model.js';
import { defaultOptions } from '../../src/options.js';
import { ScatterRenderOptions, ScatterSeriesRenderer } from '../../src/renderer.js';

const renderOptions: ScatterRenderOptions = {
	hoveredOpacity: 1,
	hoveredSizeIncrease: 0,
	hoveredRingWidth: 0,
	hoveredRingColor: null,
	hoveredRingGap: 2,
	plotBorder: defaultOptions.plotBorder,
	baselines: [],
	hitTestTolerance: 3,
};

/** A renderer of `model` over a 500 × 300 pane, five pixels per X unit. */
function renderer(model: ScatterModel): ScatterSeriesRenderer {
	const cache = new ScatterGeometryCache();
	const mapping: XMapping = { start: 0, origin: 0, pxPerUnit: 5 };
	return new ScatterSeriesRenderer({
		model: () => model,
		options: () => renderOptions,
		backgroundColor: () => '#FFFFFF',
		xMapping: () => mapping,
		hoveredIndex: () => null,
		geometry: (m: ScatterModel, xMapping: XMapping, yToCoordinate: (y: number) => number | null) => cache.geometry(m, xMapping, yToCoordinate),
		hit: () => {},
		drawn: () => {},
	});
}

/** A canvas target recording the centres of the markers drawn, in bitmap pixels. */
function target(arcs: number[][]): CanvasRenderingTarget2D {
	const context = new Proxy({}, {
		get: (_: object, key: string | symbol) => (key === 'arc' ? (x: number, y: number) => arcs.push([x, y]) : () => {}),
		set: () => true,
	});
	return {
		useBitmapCoordinateSpace: (draw: (scope: unknown) => void) => draw({
			context,
			mediaSize: { width: 500, height: 300 },
			bitmapSize: { width: 1000, height: 600 },
			horizontalPixelRatio: 2,
			verticalPixelRatio: 2,
		}),
	} as unknown as CanvasRenderingTarget2D;
}

void describe('ScatterSeriesRenderer', () => {
	const points = Array.from({ length: 50 }, (_: unknown, i: number) => ({ id: `p${i}`, x: i * 2, y: i }));
	const model = buildScatterModel(points, { ...defaultOptions, xRange: { min: 0, max: 100 } });

	void it('converts the prices of the points only when the scales moved', () => {
		const draw = renderer(model);
		let calls = 0;
		const price = (scale: number): PriceToCoordinateConverter => (value: number) => {
			calls++;
			return (300 - value * scale) as ReturnType<PriceToCoordinateConverter>;
		};
		const first: number[][] = [];
		draw.draw(target(first), price(5), false);
		expect(first.length).to.equal(50);
		const afterFirst = calls;
		// A repaint over the same scales (a hover change): no point converted, just the three probes of the scale.
		const again: number[][] = [];
		draw.draw(target(again), price(5), false);
		expect(calls - afterFirst).to.equal(3);
		expect(again).to.deep.equal(first);
		expect(first[10]).to.deep.equal([20 * 5 * 2, (300 - 10 * 5) * 2]);
		// A new price scale: the points follow.
		const rescaled: number[][] = [];
		draw.draw(target(rescaled), price(2), false);
		expect(rescaled[10]).to.deep.equal([20 * 5 * 2, (300 - 10 * 2) * 2]);
	});

	void it('reports the same hit test data while the pointer stays on the same point', () => {
		const draw = renderer(model);
		const price: PriceToCoordinateConverter = (value: number) => (300 - value * 5) as ReturnType<PriceToCoordinateConverter>;
		// p10 is drawn at (100, 250).
		const first = draw.hitTest(100, 250, price);
		const moved = draw.hitTest(101, 249, price);
		expect(first?.objectId).to.equal('p10');
		expect(moved?.objectId).to.equal('p10');
		expect(moved?.hitTestData).to.equal(first?.hitTestData);
		const other = draw.hitTest(110, 245, price);
		expect(other?.objectId).to.equal('p11');
		expect(other?.hitTestData).to.not.equal(first?.hitTestData);
	});
});
