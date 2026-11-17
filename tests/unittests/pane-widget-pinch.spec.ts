/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { PaneWidget } from '../../src/gui/pane-widget';
import { clone } from '../../src/helpers/strict-type-checks';
import { ChartModel } from '../../src/model/chart-model';
import { Coordinate } from '../../src/model/coordinate';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { TickMarkWeightValue, TimePointIndex, TimeScalePoint } from '../../src/model/time-data';

function setup(): { model: ChartModel<Time>; widget: PaneWidget } {
	const options = clone(chartOptionsDefaults<Time>());
	options.timeScale.barSpacing = 6;
	const model = new ChartModel<Time>(() => {}, options, new HorzScaleBehaviorTime());
	model.timeScale().setWidth(900);
	const points = Array.from({ length: 1000 }, (unused: unknown, i: number): TimeScalePoint => ({
		time: { timestamp: i as UTCTimestamp } as unknown as InternalHorzScaleItem,
		timeWeight: 20 as TickMarkWeightValue,
		originalTime: i as UTCTimestamp,
	}));
	model.updateTimeScale(999 as TimePointIndex, points, 0);
	const widget = Object.create(PaneWidget.prototype) as PaneWidget;
	/* eslint-disable @typescript-eslint/naming-convention */
	Object.assign(widget, { _chart: { options: () => options, model: () => model } });
	/* eslint-enable @typescript-eslint/naming-convention */
	widget.pinchStartEvent();
	return { model, widget };
}

function pinch(scales: readonly number[]): number {
	const { model, widget } = setup();
	for (const scale of scales) {
		widget.pinchEvent({ x: 450, y: 150 }, scale);
	}
	return model.timeScale().barSpacing();
}

describe('Pane widget pinch zoom', () => {
	it('uses reciprocal zoom for reciprocal distance changes', () => {
		expect(pinch([5]) / 6).to.be.closeTo(6 / pinch([0.2]), 1e-12);
	});

	it('does not depend on the number of touch samples', () => {
		expect(pinch([2])).to.be.closeTo(pinch([1.25, 1.5, 1.75, 2]), 1e-12);
		expect(pinch([0.5])).to.be.closeTo(pinch([0.875, 0.75, 0.625, 0.5]), 1e-12);
	});

	it('returns to the original spacing when the fingers return to their starting distance', () => {
		expect(pinch([0.5, 0.75, 1, 2, 1])).to.be.closeTo(6, 1e-12);
	});

	it('ignores coincident or invalid touch distances without poisoning later samples', () => {
		expect(pinch([0, NaN, Infinity, -1, 2])).to.be.closeTo(pinch([2]), 1e-12);
	});

	it('keeps disabled pinch scaling disabled', () => {
		const { model, widget } = setup();
		model.applyOptions({ handleScale: { pinch: false } });
		widget.pinchEvent({ x: 450, y: 150 }, 2);
		expect(model.timeScale().barSpacing()).to.equal(6);
	});

	it('keeps the zoom anchored at the pinch midpoint', () => {
		const { model, widget } = setup();
		const scale = model.timeScale();
		const index = scale.coordinateToIndex(450 as Coordinate);
		const before = scale.indexToCoordinate(index);
		widget.pinchEvent({ x: 450, y: 150 }, 2);
		expect(scale.indexToCoordinate(index)).to.be.closeTo(450 + (before - 450) * Math.sqrt(2), 1e-5);
	});

	it('respects configured minimum and maximum spacing', () => {
		const { model, widget } = setup();
		model.applyOptions({ timeScale: { minBarSpacing: 4, maxBarSpacing: 8 } });
		widget.pinchEvent({ x: 450, y: 150 }, 0.01);
		expect(model.timeScale().barSpacing()).to.equal(4);
		widget.pinchEvent({ x: 450, y: 150 }, 100);
		expect(model.timeScale().barSpacing()).to.equal(8);
	});

	it('resets the previous distance ratio for each new gesture', () => {
		const { model, widget } = setup();
		widget.pinchEvent({ x: 450, y: 150 }, 2);
		widget.pinchStartEvent();
		widget.pinchEvent({ x: 450, y: 150 }, 0.5);
		expect(model.timeScale().barSpacing()).to.be.closeTo(6, 1e-12);
	});
});
