import { expect } from 'chai';
import { IChartApiBase, IPaneApi, Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { chartTableElement, paneContentElement } from '../../src/dom/pane-element.js';

/**
 * The smallest element shape the helpers touch: a `style`, `children`,
 * `firstElementChild`, `querySelector` and `closest`. Plain objects keep the
 * test free of a DOM implementation.
 */
interface FakeElement {
	name: string;
	style: { position: string };
	children: FakeElement[];
	firstElementChild: FakeElement | null;
	querySelector(selector: string): unknown;
	closest(selector: string): FakeElement | null;
}

function element(
	name: string,
	options: {
		position?: string;
		canvas?: boolean;
		children?: FakeElement[];
		table?: FakeElement | null;
	} = {}
): FakeElement {
	const children = options.children ?? [];
	return {
		name,
		style: { position: options.position ?? '' },
		children,
		firstElementChild: children[0] ?? null,
		querySelector: (selector: string): unknown =>
			selector === 'canvas' && options.canvas === true ? { name: `${name}-canvas` } : null,
		closest: (selector: string): FakeElement | null =>
			selector === 'table' ? options.table ?? null : null,
	};
}

function asElement(fake: FakeElement | null): HTMLElement | null {
	return fake as unknown as HTMLElement | null;
}

function pane(paneElement: FakeElement | null): IPaneApi<Time> {
	return {
		getHTMLElement: (): HTMLElement | null => asElement(paneElement),
	} as unknown as IPaneApi<Time>;
}

function chart(panes: IPaneApi<Time>[]): IChartApiBase<Time> {
	return { panes: (): IPaneApi<Time>[] => panes } as unknown as IChartApiBase<Time>;
}

/** A pane row: optional left axis cell, the main cell, optional right axis cell. */
function paneRow(options: { leftAxis?: boolean; rightAxis?: boolean; wrapper?: boolean } = {}): FakeElement {
	const mainChildren = options.wrapper === false ? [] : [element('canvas-wrapper')];
	const cells: FakeElement[] = [];
	if (options.leftAxis) {
		cells.push(element('left-axis', { canvas: true }));
	}
	cells.push(element('main-cell', { position: 'relative', canvas: true, children: mainChildren }));
	if (options.rightAxis) {
		cells.push(element('right-axis', { canvas: true }));
	}
	return element('pane-row', { children: cells });
}

void describe('paneContentElement', () => {
	void it('returns the canvas wrapper inside the main pane cell', () => {
		const result = paneContentElement(pane(paneRow()));
		expect((result as unknown as FakeElement).name).to.equal('canvas-wrapper');
	});

	void it('skips a visible left price-axis cell which also holds a canvas', () => {
		const row = paneRow({ leftAxis: true, rightAxis: true });
		const result = paneContentElement(pane(row));
		expect((result as unknown as FakeElement).name).to.equal('canvas-wrapper');
	});

	void it('falls back to the first canvas-bearing cell when none is position:relative', () => {
		const row = element('pane-row', {
			children: [
				element('spacer'),
				element('some-cell', { canvas: true, children: [element('wrapper-2')] }),
			],
		});
		const result = paneContentElement(pane(row));
		expect((result as unknown as FakeElement).name).to.equal('wrapper-2');
	});

	void it('returns the cell itself when it has no child element', () => {
		const row = paneRow({ wrapper: false });
		const result = paneContentElement(pane(row));
		expect((result as unknown as FakeElement).name).to.equal('main-cell');
	});

	void it('returns null while the pane has no HTML element yet', () => {
		expect(paneContentElement(pane(null))).to.equal(null);
	});

	void it('returns null when no cell holds a canvas', () => {
		const row = element('pane-row', { children: [element('empty', { position: 'relative' })] });
		expect(paneContentElement(pane(row))).to.equal(null);
	});
});

void describe('chartTableElement', () => {
	void it('returns the table the pane row lives in', () => {
		const table = element('chart-table');
		const row = element('pane-row', { table });
		const result = chartTableElement(chart([pane(row)]));
		expect(result).to.equal(asElement(table));
	});

	void it('skips panes which have no element yet', () => {
		const table = element('chart-table');
		const result = chartTableElement(chart([pane(null), pane(element('pane-row', { table }))]));
		expect(result).to.equal(asElement(table));
	});

	void it('returns null when the chart has no panes', () => {
		expect(chartTableElement(chart([]))).to.equal(null);
	});

	void it('returns null when the pane row is not inside a table', () => {
		expect(chartTableElement(chart([pane(element('detached-row'))]))).to.equal(null);
	});
});
