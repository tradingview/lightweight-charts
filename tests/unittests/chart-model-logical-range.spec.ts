/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { ChartModel } from '../../src/model/chart-model';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { InvalidateMask, TimeScaleInvalidationType } from '../../src/model/invalidate-mask';
import { Logical, TickMarkWeightValue, TimePointIndex, TimeScalePoint } from '../../src/model/time-data';

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

interface ModelHarness {
	model: ChartModel<Time>;
	// merges the masks collected since the last call and applies their time scale
	// invalidations the way ChartWidget does on the next animation frame
	applyPendingMasks: () => void;
}

function createModel(width: number = 700): ModelHarness {
	const masks: InvalidateMask[] = [];
	const options = chartOptionsDefaults<Time>();
	options.timeScale = { ...options.timeScale, rightOffset: 0 };
	const model = new ChartModel<Time>((mask: InvalidateMask) => { masks.push(mask); }, options, new HorzScaleBehaviorTime());
	model.timeScale().setWidth(width);

	const applyPendingMasks = () => {
		let accumulated: InvalidateMask | null = null;
		for (const mask of masks.splice(0)) {
			if (accumulated === null) {
				accumulated = mask;
			} else {
				accumulated.merge(mask);
			}
		}
		if (accumulated === null) {
			return;
		}
		const timeScale = model.timeScale();
		for (const invalidation of accumulated.timeScaleInvalidations()) {
			switch (invalidation.type) {
				case TimeScaleInvalidationType.FitContent:
					timeScale.fitContent();
					break;
				case TimeScaleInvalidationType.ApplyRange:
					timeScale.setLogicalRange(invalidation.value);
					model.clearPendingLogicalRange(invalidation.value);
					break;
				case TimeScaleInvalidationType.ApplyBarSpacing:
					timeScale.setBarSpacing(invalidation.value);
					break;
				case TimeScaleInvalidationType.ApplyRightOffset:
					timeScale.setRightOffset(invalidation.value);
					break;
				case TimeScaleInvalidationType.Reset:
					timeScale.restoreDefault();
					break;
				default:
					break;
			}
		}
	};

	return { model, applyPendingMasks };
}

function pointsFromTimestamps(timestamps: number[]): TimeScalePoint[] {
	return timestamps.map((timestamp: number) => ({
		time: { timestamp: timestamp as UTCTimestamp } as unknown as InternalHorzScaleItem,
		timeWeight: 20 as TickMarkWeightValue,
		originalTime: timestamp as UTCTimestamp,
	}));
}

function visibleRange(model: ChartModel<Time>): { from: number; to: number } {
	const range = model.timeScale().visibleLogicalRange();
	expect(range, 'visible logical range').to.not.equal(null);
	return { from: range?.left() ?? NaN, to: range?.right() ?? NaN };
}

describe('ChartModel setTargetLogicalRange', () => {
	it('applies the requested range on the next frame when the data does not change', () => {
		const { model, applyPendingMasks } = createModel();
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });
		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(0, 1e-6);
		expect(range.to).to.be.closeTo(6, 1e-6);
	});

	it('keeps the requested bars when older bars are prepended before the next frame (issue #1107)', () => {
		const { model, applyPendingMasks } = createModel();
		// bars with timestamps 0..6, as in the issue's 2019-01-01..2019-01-07 example
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });

		// setData() with 5 older bars in front of the existing ones, before the next frame:
		// every existing bar's logical index grows by 5
		model.updateTimeScale(11 as TimePointIndex, points(12, -5), 0);

		applyPendingMasks();

		// the bars that were at 0..6 when the range was requested are now at 5..11
		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(5, 1e-6);
		expect(range.to).to.be.closeTo(11, 1e-6);
	});

	it('does not shift the requested range when newer bars are appended before the next frame', () => {
		const { model, applyPendingMasks } = createModel();
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });

		// appending on the right does not change the indices of the existing bars
		model.updateTimeScale(9 as TimePointIndex, points(10), 7);

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(0, 1e-6);
		expect(range.to).to.be.closeTo(6, 1e-6);
	});

	it('accumulates the shift when older bars are prepended in several batches before the next frame', () => {
		const { model, applyPendingMasks } = createModel();
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });

		// two series (possibly on different panes, sharing one time scale)
		// prepend their older bars one after another in the same tick;
		// whitespace points that extend the scale to the left shift indices the same way
		model.updateTimeScale(8 as TimePointIndex, points(9, -2), 0);
		model.updateTimeScale(11 as TimePointIndex, points(12, -5), 0);

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(5, 1e-6);
		expect(range.to).to.be.closeTo(11, 1e-6);
	});

	it('applies the range as requested when it was set before any data arrived', () => {
		const { model, applyPendingMasks } = createModel();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(0, 1e-6);
		expect(range.to).to.be.closeTo(6, 1e-6);
	});

	it('keeps a range around a single bar when older bars are prepended before the next frame', () => {
		const { model, applyPendingMasks } = createModel(300);
		model.updateTimeScale(0 as TimePointIndex, points(1), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: -2 as Logical, to: 2 as Logical });
		model.updateTimeScale(3 as TimePointIndex, points(4, -3), 0);

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(1, 1e-6);
		expect(range.to).to.be.closeTo(5, 1e-6);
	});

	it('shifts by the number of prepended bars, not by their time distance', () => {
		const { model, applyPendingMasks } = createModel(300);
		// irregularly spaced bars (e.g. daily bars with weekend/holiday gaps)
		model.updateTimeScale(2 as TimePointIndex, pointsFromTimestamps([10, 20, 45]), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 2 as Logical });
		model.updateTimeScale(4 as TimePointIndex, pointsFromTimestamps([1, 2, 10, 20, 45]), 0);

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(2, 1e-6);
		expect(range.to).to.be.closeTo(4, 1e-6);
	});

	it('applies a second requested range as given, without the shift of the first one', () => {
		const { model, applyPendingMasks } = createModel(300);
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });
		model.updateTimeScale(11 as TimePointIndex, points(12, -5), 0);
		// indices of this range already refer to the data after the prepend
		model.setTargetLogicalRange({ from: 0 as Logical, to: 2 as Logical });

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(0, 1e-6);
		expect(range.to).to.be.closeTo(2, 1e-6);
	});

	it('does not apply the requested range when fitContent supersedes it in the same tick', () => {
		const { model, applyPendingMasks } = createModel();
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });
		model.updateTimeScale(11 as TimePointIndex, points(12, -5), 0);
		model.fitContent();

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(0, 1e-6);
		expect(range.to).to.be.closeTo(11, 1e-6);
	});

	it('applies the range positionally when the data is replaced by disjoint bars before the next frame', () => {
		const { model, applyPendingMasks } = createModel(300);
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 1 as Logical, to: 3 as Logical });
		// no bar of the old data survives, so there is no index shift to follow
		model.updateTimeScale(6 as TimePointIndex, pointsFromTimestamps([100, 101, 102, 103, 104, 105, 106]), 0);

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(1, 1e-6);
		expect(range.to).to.be.closeTo(3, 1e-6);
	});

	it('stays on the same bars when older bars are prepended after the range was applied', () => {
		const { model, applyPendingMasks } = createModel();
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		model.setTargetLogicalRange({ from: 0 as Logical, to: 6 as Logical });
		applyPendingMasks();

		model.updateTimeScale(11 as TimePointIndex, points(12, -5), 0);
		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(5, 1e-6);
		expect(range.to).to.be.closeTo(11, 1e-6);
	});

	it('is not affected by later mutations of the range object passed by the caller', () => {
		const { model, applyPendingMasks } = createModel();
		model.updateTimeScale(6 as TimePointIndex, points(7), 0);
		applyPendingMasks();

		const requested = { from: 0 as Logical, to: 6 as Logical };
		model.setTargetLogicalRange(requested);
		requested.from = 3 as Logical;

		applyPendingMasks();

		const range = visibleRange(model);
		expect(range.from).to.be.closeTo(0, 1e-6);
		expect(range.to).to.be.closeTo(6, 1e-6);
	});
});
