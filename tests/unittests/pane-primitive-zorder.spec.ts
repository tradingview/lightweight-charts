/* eslint-disable @typescript-eslint/no-floating-promises */
import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { IPanePrimitiveBase, IPanePrimitivePaneView, PrimitivePaneViewZOrder } from '../../src/model/ipane-primitive';
import { PanePrimitiveWrapper } from '../../src/model/pane-primitive-wrapper';

function paneView(zOrder?: PrimitivePaneViewZOrder): IPanePrimitivePaneView {
	return {
		zOrder: zOrder === undefined ? undefined : () => zOrder,
		renderer: () => null,
	};
}

function wrapperFor(views: readonly IPanePrimitivePaneView[]): PanePrimitiveWrapper {
	const primitive: IPanePrimitiveBase = {
		paneViews: () => views,
	};
	return new PanePrimitiveWrapper(primitive);
}

function layers(wrapper: PanePrimitiveWrapper): [number, number, number] {
	return [
		wrapper.bottomPaneViews().length,
		wrapper.paneViews().length,
		wrapper.topPaneViews().length,
	];
}

describe('PanePrimitiveWrapper zOrder', () => {
	it('places each pane view on the layer named by zOrder', () => {
		const bottom = paneView('bottom');
		const normal = paneView('normal');
		const implicitNormal = paneView();
		const top = paneView('top');
		const wrapper = wrapperFor([bottom, normal, implicitNormal, top]);

		deepStrictEqual(layers(wrapper), [1, 2, 1]);
		strictEqual(wrapper.bottomPaneViews()[0].zOrder(), 'bottom');
		deepStrictEqual(wrapper.paneViews().map((view: { zOrder(): PrimitivePaneViewZOrder }) => view.zOrder()), ['normal', 'normal']);
		strictEqual(wrapper.topPaneViews()[0].zOrder(), 'top');
	});

	it('keeps a view on its current layer when zOrder changes without a new array', () => {
		let zOrder: PrimitivePaneViewZOrder = 'bottom';
		const view = paneView('bottom');
		view.zOrder = () => zOrder;
		const views = [view];
		const wrapper = wrapperFor(views);

		deepStrictEqual(layers(wrapper), [1, 0, 0]);
		const wrapped = wrapper.bottomPaneViews()[0];

		zOrder = 'top';
		deepStrictEqual(layers(wrapper), [0, 0, 1]);
		strictEqual(wrapper.topPaneViews()[0], wrapped);
	});
});
