import { expect } from 'chai';
import { describe, it } from 'node:test';
import {
	CustomBarItemData,
	CustomData,
	CustomSeriesOptions,
	IRange,
	PaneRendererCustomData,
	PriceToCoordinateConverter,
	Time,
} from 'lightweight-charts';

import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '../../src/custom-series/renderer-base.js';

interface TestData extends CustomData<Time> {
	value: number;
}

type TestBar = CustomBarItemData<Time, TestData>;

function makeBars(count: number): TestBar[] {
	return Array.from({ length: count }, (_: unknown, i: number) => ({
		x: i * 10,
		time: i,
		barColor: '#000000',
		originalData: { time: i as unknown as Time, value: i },
	}));
}

function paneData(
	bars: TestBar[],
	visibleRange: IRange<number> | null
): PaneRendererCustomData<Time, TestData> {
	return {
		bars,
		barSpacing: 10,
		visibleRange,
		conflationFactor: 1,
	} as unknown as PaneRendererCustomData<Time, TestData>;
}

const options = {} as unknown as CustomSeriesOptions;

const priceToCoordinate: PriceToCoordinateConverter = (price: number) =>
	price as unknown as ReturnType<PriceToCoordinateConverter>;

interface FakeTarget {
	target: CanvasRenderingTarget2D;
	/** How many times the renderer entered the bitmap coordinate space. */
	entered: () => number;
}

/**
 * Stands in for the chart's rendering target, recording whether the renderer
 * entered the bitmap coordinate space at all.
 */
function fakeTarget(): FakeTarget {
	let entered = 0;
	const scope = {
		context: {} as unknown as CanvasRenderingContext2D,
		mediaSize: { width: 100, height: 50 },
		bitmapSize: { width: 200, height: 100 },
		horizontalPixelRatio: 2,
		verticalPixelRatio: 2,
	} as unknown as BitmapCoordinatesRenderingScope;
	const target = {
		useBitmapCoordinateSpace: <T>(
			fn: (renderingScope: BitmapCoordinatesRenderingScope) => T
		): T => {
			entered++;
			return fn(scope);
		},
	} as unknown as CanvasRenderingTarget2D;
	return { target, entered: () => entered };
}

class TestRenderer extends CustomSeriesRendererBase<Time, TestData> {
	public calls: CustomSeriesDrawArgs<Time, TestData, CustomSeriesOptions>[] = [];
	public scopes: BitmapCoordinatesRenderingScope[] = [];

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<Time, TestData, CustomSeriesOptions>
	): void {
		this.scopes.push(scope);
		this.calls.push(args);
	}
}

function drawWith(
	data: PaneRendererCustomData<Time, TestData> | null
): { renderer: TestRenderer; target: FakeTarget } {
	const renderer = new TestRenderer();
	if (data !== null) {
		renderer.update(data, options);
	}
	const target = fakeTarget();
	renderer.draw(target.target, priceToCoordinate, false);
	return { renderer, target };
}

void describe('CustomSeriesRendererBase', () => {
	void it('draws when there is data and a non-empty visible range', () => {
		const { renderer, target } = drawWith(
			paneData(makeBars(5), { from: 1, to: 4 })
		);
		expect(target.entered()).to.equal(1);
		expect(renderer.calls).to.have.length(1);
	});

	void it('does not draw before update has been called', () => {
		const { renderer, target } = drawWith(null);
		expect(target.entered()).to.equal(0);
		expect(renderer.calls).to.have.length(0);
	});

	void it('does not draw when there are no bars', () => {
		const { renderer, target } = drawWith(paneData([], { from: 0, to: 0 }));
		expect(target.entered()).to.equal(0);
		expect(renderer.calls).to.have.length(0);
	});

	void it('does not draw when the visible range is null', () => {
		const { renderer, target } = drawWith(paneData(makeBars(5), null));
		expect(target.entered()).to.equal(0);
		expect(renderer.calls).to.have.length(0);
	});

	void it('does not draw for an empty visible range (from === to)', () => {
		const { renderer, target } = drawWith(
			paneData(makeBars(5), { from: 2, to: 2 })
		);
		expect(target.entered()).to.equal(0);
		expect(renderer.calls).to.have.length(0);
	});

	void it('does not draw for an inverted visible range (from > to)', () => {
		const { renderer, target } = drawWith(
			paneData(makeBars(5), { from: 4, to: 2 })
		);
		expect(target.entered()).to.equal(0);
		expect(renderer.calls).to.have.length(0);
	});

	void it('hands drawImpl the data, options and visible range bounds', () => {
		const data = paneData(makeBars(5), { from: 1, to: 4 });
		const renderer = new TestRenderer();
		renderer.update(data, options);
		renderer.draw(fakeTarget().target, priceToCoordinate, false);
		const args = renderer.calls[0];
		expect(args.data).to.equal(data);
		expect(args.options).to.equal(options);
		expect(args.priceToCoordinate).to.equal(priceToCoordinate);
		expect(args.from).to.equal(1);
		expect(args.to).to.equal(4);
	});

	void it('draws inside the bitmap coordinate space', () => {
		const { renderer } = drawWith(paneData(makeBars(3), { from: 0, to: 3 }));
		expect(renderer.scopes[0].horizontalPixelRatio).to.equal(2);
		expect(renderer.scopes[0].verticalPixelRatio).to.equal(2);
	});

	void it('passes the hover flag and hit test data through', () => {
		const renderer = new TestRenderer();
		renderer.update(paneData(makeBars(3), { from: 0, to: 3 }), options);
		const hitTestData = { index: 2 };
		renderer.draw(fakeTarget().target, priceToCoordinate, true, hitTestData);
		expect(renderer.calls[0].isHovered).to.equal(true);
		expect(renderer.calls[0].hitTestData).to.equal(hitTestData);
	});

	void it('reports isHovered as false when the host omits it', () => {
		const renderer = new TestRenderer();
		renderer.update(paneData(makeBars(3), { from: 0, to: 3 }), options);
		renderer.draw(fakeTarget().target, priceToCoordinate);
		expect(renderer.calls[0].isHovered).to.equal(false);
		expect(renderer.calls[0].hitTestData).to.equal(undefined);
	});

	void it('draws with the data from the most recent update', () => {
		const renderer = new TestRenderer();
		renderer.update(paneData(makeBars(3), { from: 0, to: 3 }), options);
		const latest = paneData(makeBars(9), { from: 5, to: 9 });
		renderer.update(latest, options);
		renderer.draw(fakeTarget().target, priceToCoordinate, false);
		expect(renderer.calls[0].data).to.equal(latest);
		expect(renderer.calls[0].from).to.equal(5);
	});

	void it('stops drawing again once the visible range goes away', () => {
		const renderer = new TestRenderer();
		const target = fakeTarget();
		renderer.update(paneData(makeBars(3), { from: 0, to: 3 }), options);
		renderer.draw(target.target, priceToCoordinate, false);
		renderer.update(paneData(makeBars(3), null), options);
		renderer.draw(target.target, priceToCoordinate, false);
		expect(target.entered()).to.equal(1);
	});
});
