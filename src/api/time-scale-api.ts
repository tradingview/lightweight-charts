import { ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { ChartModel } from '../model/chart-model';
import { TimePoint, TimePointIndex, TimePointIndexRange, TimePointsRange } from '../model/time-data';
import { TimeScale, TimeScaleOptions } from '../model/time-scale';

import { Time } from './data-consumer';
import { convertTime } from './data-layer';
import { ITimeScaleApi, TimeRange, TimeRangeChangeEventHandler } from './itime-scale-api';

const enum Constants {
	AnimationDurationMs = 1000,
}

export class TimeScaleApi implements ITimeScaleApi, IDestroyable {
	private _model: ChartModel;
	private readonly _timeRangeChanged: Delegate<TimeRange | null> = new Delegate();

	public constructor(model: ChartModel) {
		this._model = model;
		this._timeScale().visibleBarsChanged().subscribe(this._onVisibleBarsChanged.bind(this));
	}

	public destroy(): void {
		this._timeScale().visibleBarsChanged().unsubscribeAll(this);
		this._timeRangeChanged.destroy();
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
		const convertedRange: TimePointsRange = {
			from: convertTime(range.from),
			to: convertTime(range.to),
		};
		this._model.setTargetTimeRange(convertedRange);
	}

	public getVisibleIndexRange(): TimePointIndexRange | null {
		const ts = this._timeScale();
		const lastIndex = ts.points().lastIndex();

		if (null === lastIndex) {
			return null;
		}

		const rightIndex = lastIndex + ts.rightOffset();
		const leftIndex = rightIndex - (ts.width() / ts.barSpacing()) + 1;

		return {
			from: leftIndex as TimePointIndex,
			to: rightIndex as TimePointIndex,
		};
	}

	public setVisibleIndexRange(range: TimePointIndexRange): void {
		if (range.from > range.to) {
			return;
		}
		this._model.setTargetIndexRange(range);
	}

	public resetTimeScale(): void {
		this._model.resetTimeScale();
	}

	public fitContent(): void {
		this._model.fitContent();
	}

	public subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
		this._timeRangeChanged.subscribe(handler);
	}

	public unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
		this._timeRangeChanged.unsubscribe(handler);
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

	private _onVisibleBarsChanged(): void {
		if (this._timeRangeChanged.hasListeners()) {
			this._timeRangeChanged.fire(this.getVisibleRange());
		}
	}
}

function timePointToTime(point: TimePoint): Time {
	return point.businessDay || point.timestamp;
}
