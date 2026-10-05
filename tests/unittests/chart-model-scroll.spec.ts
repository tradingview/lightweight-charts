/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { ChartModel, ChartOptionsInternal } from '../../src/model/chart-model';
import { Coordinate } from '../../src/model/coordinate';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { KineticAnimation } from '../../src/model/kinetic-animation';
import { TickMarkWeightValue, TimePointIndex, TimeScalePoint } from '../../src/model/time-data';

function createModel(timeScaleOptions: Partial<ChartOptionsInternal<Time>['timeScale']> = {}): ChartModel<Time> {
	const options = chartOptionsDefaults<Time>();
	options.timeScale = { ...options.timeScale, barSpacing: 1, rightOffset: 0, ...timeScaleOptions };
	return new ChartModel<Time>(() => {}, options, new HorzScaleBehaviorTime());
}

function points(count: number): TimeScalePoint[] {
	const result: TimeScalePoint[] = [];
	for (let i = 0; i < count; ++i) {
		result.push({
			time: { timestamp: i as UTCTimestamp } as unknown as InternalHorzScaleItem,
			timeWeight: 20 as TickMarkWeightValue,
			originalTime: i as UTCTimestamp,
		});
	}
	return result;
}

describe('ChartModel time scale scrolling', () => {
	it('keeps the scrolled position when bars are appended to the right during a scroll', () => {
		const model = createModel();
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);

		// scroll 200 bars into the past so the last bar is no longer visible
		model.startScrollTime(100 as Coordinate);
		model.scrollTimeTo(300 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-200);

		// 50 new bars arrive while the mouse button is still held
		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		// compensation keeps the viewport in place: same right edge, base index moved by 50
		expect(timeScale.rightOffset()).to.be.equal(-250);

		// the next mouse move must build on the compensated offset, not jump back by 50 bars
		model.scrollTimeTo(310 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-260);
	});

	it('accumulates the compensation when several batches of bars arrive during one scroll', () => {
		const model = createModel();
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);

		model.startScrollTime(100 as Coordinate);
		model.scrollTimeTo(300 as Coordinate);

		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		model.scrollTimeTo(310 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-260);

		model.updateTimeScale(599 as TimePointIndex, points(600), 550);
		expect(timeScale.rightOffset()).to.be.equal(-310);

		model.scrollTimeTo(320 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-320);
	});

	it('keeps shifting the visible range for new bars during a scroll when the last bar is visible and shiftVisibleRangeOnNewBar is enabled', () => {
		const model = createModel({ shiftVisibleRangeOnNewBar: true });
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);

		// scroll 10 bars towards the future so the last bar stays visible
		model.startScrollTime(100 as Coordinate);
		model.scrollTimeTo(90 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(10);

		// no compensation here: the viewport is meant to move so the new bars come into view
		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		expect(timeScale.rightOffset()).to.be.equal(10);

		// the next mouse move must keep that shift instead of undoing it
		model.scrollTimeTo(80 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(20);
	});

	it('keeps the scrolled position when bars are appended while the drag is clamped at the oldest bar', () => {
		const model = createModel();
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);

		// drag far into the past so the offset is clamped at the left edge
		model.startScrollTime(0 as Coordinate);
		model.scrollTimeTo(1000 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-498);

		// the compensation must not be clamped against the old base index
		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		expect(timeScale.rightOffset()).to.be.equal(-548);

		// and the next mouse move must not move the chart either
		model.scrollTimeTo(1000 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-548);
	});

	it('keeps the scrolled position when bars are appended while the drag is clamped at the oldest bar with fixLeftEdge enabled', () => {
		const model = createModel({ fixLeftEdge: true });
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(999 as TimePointIndex, points(1000), 0);

		// with fixLeftEdge the first bar cannot leave the left edge, so the offset is clamped at -500
		model.startScrollTime(0 as Coordinate);
		model.scrollTimeTo(2000 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-500);

		model.updateTimeScale(1049 as TimePointIndex, points(1050), 1000);
		expect(timeScale.rightOffset()).to.be.equal(-550);

		model.scrollTimeTo(2000 as Coordinate);
		expect(timeScale.rightOffset()).to.be.equal(-550);
	});

	it('shifts a running kinetic scroll animation when bars are appended so the fling does not jump', () => {
		const model = createModel();
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);
		timeScale.setRightOffset(-200);

		// a fling into the past, started the way the pane widget starts it on pointer release
		const animation = new KineticAnimation(0.2, 7, 0.997, 15);
		animation.addPosition(-180 as Coordinate, 0);
		animation.addPosition(-200 as Coordinate, 16);
		animation.start(-200 as Coordinate, 20);
		expect(animation.finished(20)).to.be.equal(false);
		model.setTimeScaleAnimation(animation);
		const positionBefore = animation.getPosition(100);

		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		expect(timeScale.rightOffset()).to.be.equal(-250);
		// the offset the chart widget applies on the next frame must be compensated as well
		expect(animation.getPosition(100)).to.be.equal(positionBefore - 50);
	});

	it('does not touch a stopped animation when bars are appended', () => {
		const model = createModel();
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);
		timeScale.setRightOffset(-200);

		const animation = new KineticAnimation(0.2, 7, 0.997, 15);
		animation.addPosition(-180 as Coordinate, 0);
		animation.addPosition(-200 as Coordinate, 16);
		animation.start(-200 as Coordinate, 20);
		model.setTimeScaleAnimation(animation);
		model.stopTimeScaleAnimation();
		const positionBefore = animation.getPosition(100);

		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		expect(animation.getPosition(100)).to.be.equal(positionBefore);
	});
});
