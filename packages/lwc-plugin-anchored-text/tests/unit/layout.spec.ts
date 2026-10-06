import { expect } from 'chai';
import { describe, it } from 'node:test';

import { layoutAnchoredText } from '../../src/layout.js';
import { resolveOptions } from '../../src/options.js';

const pane = { width: 400, height: 200 };
const text = { width: 100, ascent: 16, descent: 4 };

void describe('layoutAnchoredText', () => {
	void it('anchors to the top-left corner by default, inset by the margins', () => {
		const layout = layoutAnchoredText(text, pane, resolveOptions());
		expect(layout).to.deep.equal({ x: 20, y: 10, width: 100, height: 20, baselineY: 26 });
	});

	void it('centres on both axes', () => {
		const layout = layoutAnchoredText(text, pane, resolveOptions({ horzAlign: 'center', vertAlign: 'center' }));
		expect(layout.x).to.equal(150);
		expect(layout.y).to.equal(90);
		expect(layout.baselineY).to.equal(106);
	});

	void it('anchors to the bottom-right corner, inset by the margins', () => {
		const layout = layoutAnchoredText(text, pane, resolveOptions({ horzAlign: 'right', vertAlign: 'bottom' }));
		expect(layout.x).to.equal(280);
		expect(layout.y).to.equal(170);
		expect(layout.baselineY).to.equal(186);
	});

	void it('uses the margins which are set', () => {
		const layout = layoutAnchoredText(text, pane, resolveOptions({ horzAlign: 'right', vertAlign: 'bottom', horzMargin: 5, vertMargin: 2 }));
		expect(layout.x).to.equal(295);
		expect(layout.y).to.equal(178);
	});

	void it('ignores the margin of a centred axis', () => {
		const layout = layoutAnchoredText(text, pane, resolveOptions({ horzAlign: 'center', vertAlign: 'center', horzMargin: 50, vertMargin: 50 }));
		expect(layout.x).to.equal(150);
		expect(layout.y).to.equal(90);
	});

	void it('lets lineHeight replace the measured height and puts the baseline at its bottom', () => {
		const layout = layoutAnchoredText(text, pane, resolveOptions({ lineHeight: 30 }));
		expect(layout.height).to.equal(30);
		expect(layout.y).to.equal(10);
		expect(layout.baselineY).to.equal(40);
	});

	void it('does not clamp text wider than the pane', () => {
		const layout = layoutAnchoredText({ ...text, width: 500 }, pane, resolveOptions({ horzAlign: 'center' }));
		expect(layout.x).to.equal(-50);
	});
});
