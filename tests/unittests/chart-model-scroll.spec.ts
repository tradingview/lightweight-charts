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

function points(count: number, from: number = 0): TimeScalePoint[] {
	const result: TimeScalePoint[] = [];
	for (let i = from; i < from + count; ++i) {
		result.push({
			time: { timestamp: i as UTCTimestamp } as unknown as InternalHorzScaleItem,
			timeWeight: 20 as TickMarkWeightValue,
			originalTime: i as UTCTimestamp,
		});
	}
	return result;
}

describe('ChartModel time scale scrolling', () => {
	interface FlingParams {
		// pointer movement per 16ms into the past
		pxPerMove: number;
		// data update applied during the drag, right after the move with index `updateAtMove` (0..5)
		update?: (model: ChartModel<Time>) => void;
		updateAtMove?: number;
		// time between the last move and the release
		releaseDelay?: number;
		barSpacing?: number;
		rightOffset?: number;
	}

	// drives a drag the way the pane widget does: 6 moves of `pxPerMove` px per 16ms into the past over 1000 bars,
	// sampling the kinetic scroll position for the kinetic animation, optionally with a data update arriving during the drag;
	// returns the distance the fling would travel after release (0 if no fling starts)
	function flingDistance(params: FlingParams): number {
		const { pxPerMove, update, updateAtMove = 5, releaseDelay = 0, barSpacing = 6, rightOffset = -100 } = params;
		const model = createModel({ barSpacing });
		const timeScale = model.timeScale();
		timeScale.setWidth(600);
		model.updateTimeScale(999 as TimePointIndex, points(1000), 0);
		timeScale.setRightOffset(rightOffset);

		const animation = new KineticAnimation(0.2 / barSpacing, 7 / barSpacing, 0.997, 15 / barSpacing);
		const kineticPosition = () => timeScale.kineticScrollPosition() as Coordinate;

		let localX = 300 as Coordinate;
		let now = 0;
		model.startScrollTime(localX);
		animation.addPosition(kineticPosition(), now);
		for (let i = 0; i < 6; ++i) {
			now += 16;
			localX = localX + pxPerMove as Coordinate;
			model.scrollTimeTo(localX);
			if (update !== undefined && i === updateAtMove) {
				update(model);
			}
			animation.addPosition(kineticPosition(), now);
		}
		model.endScrollTime();

		const releaseOffset = timeScale.rightOffset();
		const releaseTime = now + releaseDelay;
		animation.start(releaseOffset as Coordinate, releaseTime);
		if (animation.finished(releaseTime)) {
			return 0;
		}
		return animation.getPosition(releaseTime + 5000) - releaseOffset;
	}

	// 50 bars appended to the right, base index 999 -> 1049 (compensated, the view stays in place)
	const append50 = (model: ChartModel<Time>) => model.updateTimeScale(1049 as TimePointIndex, points(1050), 1000);
	// infinite history: setData() with 50 older bars in front of the existing ones, base index 999 -> 1049, not compensated
	const prepend50 = (model: ChartModel<Time>) => model.updateTimeScale(1049 as TimePointIndex, points(1050, -50), 0);
	// setData() with the newest 100 bars removed, base index 999 -> 899
	const truncate100 = (model: ChartModel<Time>) => model.updateTimeScale(899 as TimePointIndex, points(900), 900);
	// one live bar while the last bar is visible: shiftVisibleRangeOnNewBar moves the view by one bar, not compensated
	const newBar = (model: ChartModel<Time>) => model.updateTimeScale(1000 as TimePointIndex, points(1001), 1000);

	it('does not change the kinetic fling when bars are appended during the drag', () => {
		const flingWithoutAppend = flingDistance({ pxPerMove: 10 });
		const flingWithAppend = flingDistance({ pxPerMove: 10, update: append50, updateAtMove: 3 });

		expect(flingWithoutAppend).to.be.lessThan(0);
		expect(flingWithAppend).to.be.closeTo(flingWithoutAppend, 1e-9);
	});

	it('does not start a kinetic fling when older bars are prepended during a slow drag', () => {
		expect(flingDistance({ pxPerMove: 1, releaseDelay: 10 })).to.be.equal(0);
		expect(flingDistance({ pxPerMove: 1, update: prepend50, releaseDelay: 10 })).to.be.equal(0);
		expect(flingDistance({ pxPerMove: 1, update: prepend50, releaseDelay: 49 })).to.be.equal(0);
	});

	it('does not start a kinetic fling when newer bars are removed during a slow drag', () => {
		expect(flingDistance({ pxPerMove: 1, update: truncate100, releaseDelay: 10 })).to.be.equal(0);
		expect(flingDistance({ pxPerMove: 1, update: truncate100, releaseDelay: 49 })).to.be.equal(0);
	});

	it('does not start a kinetic fling when a new bar shifts the visible range during a slow drag', () => {
		const lastBarVisible = { pxPerMove: 1, barSpacing: 30, rightOffset: 5 };

		expect(flingDistance({ ...lastBarVisible, releaseDelay: 10 })).to.be.equal(0);
		expect(flingDistance({ ...lastBarVisible, update: newBar, releaseDelay: 10 })).to.be.equal(0);
		expect(flingDistance({ ...lastBarVisible, update: newBar, releaseDelay: 49 })).to.be.equal(0);
	});

	it('does not change the kinetic fling when older bars are prepended during a fast drag', () => {
		const flingWithoutPrepend = flingDistance({ pxPerMove: 10 });
		const flingWithPrepend = flingDistance({ pxPerMove: 10, update: prepend50 });

		expect(flingWithoutPrepend).to.be.lessThan(0);
		expect(flingWithPrepend).to.be.closeTo(flingWithoutPrepend, 1e-9);
	});

	it('moves the kinetic scroll position only when the view is scrolled', () => {
		const model = createModel();
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);

		model.startScrollTime(100 as Coordinate);
		model.scrollTimeTo(300 as Coordinate);
		const position = timeScale.kineticScrollPosition();

		// compensated append: the right offset changes by -50, the view and the kinetic position don't
		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		expect(timeScale.rightOffset()).to.be.equal(-250);
		expect(timeScale.kineticScrollPosition()).to.be.equal(position);

		// prepend: the base index changes by +50, the view and the kinetic position don't
		model.updateTimeScale(599 as TimePointIndex, points(600, -50), 0);
		expect(timeScale.rightOffset()).to.be.equal(-250);
		expect(timeScale.kineticScrollPosition()).to.be.equal(position);

		// scrolling by 10 bars moves the kinetic position by 10 bars
		model.scrollTimeTo(310 as Coordinate);
		expect(timeScale.kineticScrollPosition()).to.be.equal(position - 10);
		model.endScrollTime();
	});

	it('keeps the kinetic scroll position when the compensation is applied while the drag is clamped at the oldest bar', () => {
		const model = createModel();
		const timeScale = model.timeScale();
		timeScale.setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);

		model.startScrollTime(0 as Coordinate);
		model.scrollTimeTo(1000 as Coordinate);
		const position = timeScale.kineticScrollPosition();

		model.updateTimeScale(549 as TimePointIndex, points(550), 500);
		expect(timeScale.rightOffset()).to.be.equal(-548);
		expect(timeScale.kineticScrollPosition()).to.be.equal(position);

		// still clamped: neither the view nor the kinetic position move
		model.scrollTimeTo(1000 as Coordinate);
		expect(timeScale.kineticScrollPosition()).to.be.equal(position);
		model.endScrollTime();
	});

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
