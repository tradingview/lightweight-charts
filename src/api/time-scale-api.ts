import { ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';
import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { ChartModel } from '../model/chart-model';
import { TimePoint, TimePointIndex, TimePointsRange } from '../model/time-data';
import { TimeScale, TimeScaleOptions } from '../model/time-scale';

import { Time } from './data-consumer';
import { convertTime } from './data-layer';
import { ITimeScaleApi, TimeRange, TimeRangeWithBars } from './itime-scale-api';

const enum Constants {
	AnimationDurationMs = 1000,
}

export class TimeScaleApi implements ITimeScaleApi, IDestroyable {
	private _model: ChartModel;

	public constructor(model: ChartModel) {
		this._model = model;
	}

	public destroy(): void {
		delete this._model;
	}

	public scrollPosition(): number {
		return this._timeScale().rightOffset();
	}

	public scrollToPosition(position: number, animated: boolean): void {
		if (!animated) {
			this._timeScale().setRightOffset(position);
			return;
		}

		this._timeScale().scrollToOffsetAnimated(position, Constants.AnimationDurationMs);
	}

	public scrollToRealTime(): void {
		this._timeScale().scrollToRealTime();
	}

	public getVisibleRange(): TimeRangeWithBars | null {
		const visibleBars = this._timeScale().visibleBars();
		if (visibleBars === null) {
			return null;
		}

		const points = this._model.timeScale().points();
		const firstIndex = ensureNotNull(points.firstIndex());
		const lastIndex = ensureNotNull(points.lastIndex());

		return {
			from: timePointToTime(ensureNotNull(points.valueAt(Math.max(firstIndex, visibleBars.firstBar()) as TimePointIndex))),
			to: timePointToTime(ensureNotNull(points.valueAt(Math.min(lastIndex, visibleBars.lastBar()) as TimePointIndex))),
			barsBefore: visibleBars.firstBar(),
			barsAfter: Math.ceil(this.scrollPosition()),
		};
	}

	public setVisibleRange(range: TimeRange): void {
		const convertedRange: TimePointsRange = {
			from: convertTime(range.from),
			to: convertTime(range.to),
		};
		this._model.setTargetTimeRange(convertedRange);
	}

	public resetTimeScale(): void {
		this._model.resetTimeScale();
	}

	public fitContent(): void {
		this._model.fitContent();
	}

	public applyOptions(options: DeepPartial<TimeScaleOptions>): void {
		this._timeScale().applyOptions(options);
	}

	public options(): Readonly<TimeScaleOptions> {
		return clone(this._timeScale().options());
	}

	private _timeScale(): TimeScale {
		return this._model.timeScale();
	}
}

function timePointToTime(point: TimePoint): Time {
	return point.businessDay || point.timestamp;
}
