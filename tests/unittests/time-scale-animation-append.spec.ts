/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { ChartModel } from '../../src/model/chart-model';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { ITimeScaleAnimation } from '../../src/model/invalidate-mask';
import { TickMarkWeightValue, TimePointIndex, TimeScalePoint } from '../../src/model/time-data';

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

// scrollToOffsetAnimated() reads performance.now() for its start time; pin it so the test is deterministic
let now = 0;
const originalNow = performance.now.bind(performance);

describe('TimeScale animated scroll while bars are appended', () => {
	beforeEach(() => {
		now = 1000;
		performance.now = () => now;
	});

	afterEach(() => {
		performance.now = originalNow;
	});

	function createModelWithAnimationSpy(): { model: ChartModel<Time>; animation: () => ITimeScaleAnimation } {
		const options = chartOptionsDefaults<Time>();
		options.timeScale = { ...options.timeScale, barSpacing: 1, rightOffset: 0 };
		const model = new ChartModel<Time>(() => {}, options, new HorzScaleBehaviorTime());
		let captured: ITimeScaleAnimation | null = null;
		const setTimeScaleAnimation = model.setTimeScaleAnimation.bind(model);
		model.setTimeScaleAnimation = (animation: ITimeScaleAnimation) => {
			captured = animation;
			setTimeScaleAnimation(animation);
		};
		model.timeScale().setWidth(500);
		model.updateTimeScale(499 as TimePointIndex, points(500), 0);
		return {
			model,
			animation: () => {
				expect(captured, 'scrollToOffsetAnimated should start an animation').to.not.equal(null);
				return captured as ITimeScaleAnimation;
			},
		};
	}

	it('keeps the view in place when bars are appended mid-animation and still finishes at the target', () => {
		const { model, animation } = createModelWithAnimationSpy();
		const timeScale = model.timeScale();
		timeScale.setRightOffset(-200);

		// 400ms animation back to the newest bar; apply a frame at 48% the way ChartWidget does
		timeScale.scrollToOffsetAnimated(0, 400);
		now += 192;
		timeScale.setRightOffset(animation().getPosition(now));
		const rightEdgeBefore = timeScale.baseIndex() + timeScale.rightOffset();

		model.updateTimeScale(549 as TimePointIndex, points(550), 500);

		// the next frame at the same instant must not move the view
		timeScale.setRightOffset(animation().getPosition(now));
		const rightEdgeAfter = timeScale.baseIndex() + timeScale.rightOffset();
		expect(rightEdgeAfter - rightEdgeBefore).to.be.closeTo(0, 0.01);

		// the animation still ends at the requested offset (the newest bar)
		expect(animation().getPosition(1400)).to.be.equal(0);
	});
});
