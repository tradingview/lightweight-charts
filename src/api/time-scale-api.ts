import { Size } from 'fancy-canvas';

import { TimeAxisWidget } from '../gui/time-axis-widget';

import { assert } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { ChartModel } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { Logical, LogicalRange, Range, Time, TimePointIndex, TimePointsRange } from '../model/time-data';
import { TimeScale, TimeScaleOptions } from '../model/time-scale';

import { convertTime } from './data-layer';
import {
	ITimeScaleApi,
	LogicalRangeChangeEventHandler,
	SizeChangeEventHandler,
	TimeRange,
	TimeRangeChangeEventHandler,
} from './itime-scale-api';
const enum Constants {
	AnimationDurationMs = 1000,
}

export class TimeScaleApi implements ITimeScaleApi, IDestroyable {
	private _model: ChartModel;
	private _timeScale: TimeScale;
	private readonly _timeAxisWidget: TimeAxisWidget;
	private readonly _timeRangeChanged: Delegate<TimeRange | null> = new Delegate();
	private readonly _logicalRangeChanged: Delegate<LogicalRange | null> = new Delegate();
	private readonly _sizeChanged: Delegate<number, number> = new Delegate();

	public constructor(model: ChartModel, timeAxisWidget: TimeAxisWidget) {
		this._model = model;
		this._timeScale = model.timeScale();
		this._timeAxisWidget = timeAxisWidget;
		this._timeScale.visibleBarsChanged().subscribe(this._onVisibleBarsChanged.bind(this));
		this._timeScale.logicalRangeChanged().subscribe(this._onVisibleLogicalRangeChanged.bind(this));
		this._timeAxisWidget.sizeChanged().subscribe(this._onSizeChanged.bind(this));
	}

	public destroy(): void {
		this._timeScale.visibleBarsChanged().unsubscribeAll(this);
		this._timeScale.logicalRangeChanged().unsubscribeAll(this);
		this._timeAxisWidget.sizeChanged().unsubscribeAll(this);
		this._timeRangeChanged.destroy();
		this._logicalRangeChanged.destroy();
		this._sizeChanged.destroy();
	}

	public scrollPosition(): number {
		return this._timeScale.rightOffset();
	}

	public scrollToPosition(position: number, animated: boolean): void {
		if (!animated) {
			this._model.setRightOffset(position);
			return;
		}

		this._timeScale.scrollToOffsetAnimated(position, Constants.AnimationDurationMs);
	}

	public scrollToRealTime(): void {
		this._timeScale.scrollToRealTime();
	}

	public getVisibleRange(): TimeRange | null {
		const timeRange = this._timeScale.visibleTimeRange();

		if (timeRange === null) {
			return null;
		}

		return {
			from: timeRange.from.businessDay ?? timeRange.from.timestamp,
			to: timeRange.to.businessDay ?? timeRange.to.timestamp,
		};
	}

	public setVisibleRange(range: TimeRange): void {
		const convertedRange: TimePointsRange = {
			from: convertTime(range.from),
			to: convertTime(range.to),
		};
		const logicalRange = this._timeScale.logicalRangeForTimeRange(convertedRange);

		this._model.setTargetLogicalRange(logicalRange);
	}

	public getVisibleLogicalRange(): LogicalRange | null {
		const logicalRange = this._timeScale.visibleLogicalRange();
		if (logicalRange === null) {
			return null;
		}

		return {
			from: logicalRange.left(),
			to: logicalRange.right(),
		};
	}

	public setVisibleLogicalRange(range: Range<number>): void {
		assert(range.from <= range.to, 'The from index cannot be after the to index.');
		this._model.setTargetLogicalRange(range as LogicalRange);
	}

	public resetTimeScale(): void {
		this._model.resetTimeScale();
	}

	public fitContent(): void {
		this._model.fitContent();
	}

	public logicalToCoordinate(logical: Logical): Coordinate | null {
		const timeScale = this._model.timeScale();

		if (timeScale.isEmpty()) {
			return null;
		} else {
			return timeScale.indexToCoordinate(logical as unknown as TimePointIndex);
		}
	}

	public coordinateToLogical(x: number): Logical | null {
		if (this._timeScale.isEmpty()) {
			return null;
		} else {
			return this._timeScale.coordinateToIndex(x as Coordinate) as unknown as Logical;
		}
	}

	public timeToCoordinate(time: Time): Coordinate | null {
		const timePoint = convertTime(time);
		const timePointIndex = this._timeScale.timeToIndex(timePoint, false);
		if (timePointIndex === null) {
			return null;
		}

		return this._timeScale.indexToCoordinate(timePointIndex);
	}

	public coordinateToTime(x: number): Time | null {
		const timeScale = this._model.timeScale();
		const timePointIndex = timeScale.coordinateToIndex(x as Coordinate);
		const timePoint = timeScale.indexToTime(timePointIndex);
		if (timePoint === null) {
			return null;
		}

		return timePoint.businessDay ?? timePoint.timestamp;
	}

	public width(): number {
		return this._timeAxisWidget.getSize().width;
	}

	public height(): number {
		return this._timeAxisWidget.getSize().height;
	}

	public subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
		this._timeRangeChanged.subscribe(handler);
	}

	public unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
		this._timeRangeChanged.unsubscribe(handler);
	}

	public subscribeVisibleLogicalRangeChange(handler: LogicalRangeChangeEventHandler): void {
		this._logicalRangeChanged.subscribe(handler);
	}

	public unsubscribeVisibleLogicalRangeChange(handler: LogicalRangeChangeEventHandler): void {
		this._logicalRangeChanged.unsubscribe(handler);
	}

	public subscribeSizeChange(handler: SizeChangeEventHandler): void {
		this._sizeChanged.subscribe(handler);
	}

	public unsubscribeSizeChange(handler: SizeChangeEventHandler): void {
		this._sizeChanged.unsubscribe(handler);
	}

	public applyOptions(options: DeepPartial<TimeScaleOptions>): void {
		this._timeScale.applyOptions(options);
	}

	public options(): Readonly<TimeScaleOptions> {
		return clone(this._timeScale.options());
	}

	private _onVisibleBarsChanged(): void {
		if (this._timeRangeChanged.hasListeners()) {
			this._timeRangeChanged.fire(this.getVisibleRange());
		}
	}

	private _onVisibleLogicalRangeChanged(): void {
		if (this._logicalRangeChanged.hasListeners()) {
			this._logicalRangeChanged.fire(this.getVisibleLogicalRange());
		}
	}

	private _onSizeChanged(size: Size): void {
		this._sizeChanged.fire(size.width, size.height);
	}
}
