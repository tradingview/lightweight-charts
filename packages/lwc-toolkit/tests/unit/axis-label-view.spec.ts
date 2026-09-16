import { expect } from 'chai';
import { Coordinate } from 'lightweight-charts';
import { describe, it } from 'node:test';

import {
	AxisLabelSource,
	AxisLabelView,
	OFFSCREEN_LABEL_COORDINATE,
} from '../../src/axis-label-view.js';

class FakeSource implements AxisLabelSource {
	public pos: Coordinate | null;
	public label = 'label';
	public coordinateCalls = 0;

	public constructor(pos: number | null) {
		this.pos = pos as Coordinate | null;
	}

	public coordinate(): Coordinate | null {
		this.coordinateCalls++;
		return this.pos;
	}

	public text(): string {
		return this.label;
	}

	public textColor(): string {
		return '#ffffff';
	}

	public backColor(): string {
		return '#2962ff';
	}
}

class HiddenSource extends FakeSource {
	public visible(): boolean {
		return false;
	}

	public tickVisible(): boolean {
		return false;
	}
}

void describe('AxisLabelView', () => {
	void it('passes the source values through', () => {
		const view = new AxisLabelView(new FakeSource(42));
		expect(view.coordinate()).to.equal(42);
		expect(view.text()).to.equal('label');
		expect(view.textColor()).to.equal('#ffffff');
		expect(view.backColor()).to.equal('#2962ff');
	});

	void it('is visible by default when the source omits visible()/tickVisible()', () => {
		const view = new AxisLabelView(new FakeSource(0));
		expect(view.visible()).to.equal(true);
		expect(view.tickVisible()).to.equal(true);
	});

	void it('honours a source which opts out of drawing', () => {
		const view = new AxisLabelView(new HiddenSource(42));
		expect(view.visible()).to.equal(false);
		expect(view.tickVisible()).to.equal(false);
	});

	void it('hides the label when the coordinate cannot be resolved', () => {
		const view = new AxisLabelView(new FakeSource(null));
		expect(view.visible()).to.equal(false);
		expect(view.tickVisible()).to.equal(false);
	});

	void it('reports a far-offscreen coordinate rather than 0 for an unresolved value', () => {
		const view = new AxisLabelView(new FakeSource(null));
		expect(view.coordinate()).to.equal(OFFSCREEN_LABEL_COORDINATE);
		expect(view.coordinate()).to.be.lessThan(-1000);
	});

	void it('keeps a real coordinate of 0 as 0', () => {
		const view = new AxisLabelView(new FakeSource(0));
		expect(view.coordinate()).to.equal(0);
	});

	void it('re-reads the source on every call, so no update step is needed', () => {
		const source = new FakeSource(null);
		const view = new AxisLabelView(source);
		expect(view.visible()).to.equal(false);
		source.pos = 15 as Coordinate;
		source.label = 'moved';
		expect(view.coordinate()).to.equal(15);
		expect(view.text()).to.equal('moved');
		expect(view.visible()).to.equal(true);
		expect(source.coordinateCalls).to.be.greaterThan(1);
	});

	void it('exposes the source it was built over', () => {
		const source = new FakeSource(1);
		expect(new AxisLabelView(source).source()).to.equal(source);
	});
});
