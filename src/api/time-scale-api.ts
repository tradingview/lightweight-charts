import { ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';
import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { BarsRange } from '../model/bars-range';
import { ChartModel } from '../model/chart-model';
import { TimePoint, TimePointIndex, UTCTimestamp } from '../model/time-data';
import { TimeScale, TimeScaleOptions } from '../model/time-scale';

import { convertTime, Time } from './data-layer';
import { ITimeScaleApi, TimeRange } from './itime-scale-api';

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

	public scrollToRealtime(): void {
		this._timeScale().scrollToRealTime();
	}

	public getVisibleRange(): TimeRange | null {
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
		};
	}

	public setVisibleRange(range: TimeRange): void {
		const points = this._timeScale().points();
		const firstIndex = points.firstIndex();
		const lastIndex = points.lastIndex();

		if (firstIndex === null || lastIndex === null) {
			return;
		}

		const firstPoint = ensureNotNull(points.valueAt(firstIndex)).timestamp;
		const lastPoint = ensureNotNull(points.valueAt(lastIndex)).timestamp;

		const from = convertTime(range.from);
		const to = convertTime(range.to);

		const barRange = new BarsRange(
			ensureNotNull(points.indexOf(Math.max(firstPoint, from.timestamp) as UTCTimestamp, true)),
			ensureNotNull(points.indexOf(Math.min(lastPoint, to.timestamp) as UTCTimestamp, true))
		);
		this._timeScale().setVisibleRange(barRange);
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

	public options(): TimeScaleOptions {
		return clone(this._timeScale().options());
	}

	private _timeScale(): TimeScale {
		return this._model.timeScale();
	}
}

function timePointToTime(point: TimePoint): Time {
	return point.businessDay || point.timestamp;
}
