import { AutoscaleInfo, Logical, Time, DataChangedScope } from 'lightweight-charts';
import {
	_CLASSNAME_PriceAxisPaneView,
	_CLASSNAME_TimeAxisPaneView,
} from './axis-pane-view';
import {
	_CLASSNAME_PriceAxisLabelSource,
	_CLASSNAME_TimeAxisLabelSource,
} from './axis-view';
import { Point, _CLASSNAME_DataSource } from './data-source';
import { _CLASSNAME_Options, defaultOptions } from './options';
import { _CLASSNAME_PaneView } from './pane-view';
import { AxisLabelView } from '@tradingview/lwc-toolkit/axis-label-view';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';

export class _CLASSNAME_
	extends PluginBase
	implements _CLASSNAME_DataSource
{
	private _options: _CLASSNAME_Options;
	private _p1: Point;
	private _p2: Point;
	private _paneViews: _CLASSNAME_PaneView[];
	private _timeAxisViews: AxisLabelView[];
	private _priceAxisViews: AxisLabelView[];
	private _priceAxisPaneViews: _CLASSNAME_PriceAxisPaneView[];
	private _timeAxisPaneViews: _CLASSNAME_TimeAxisPaneView[];

	constructor(
		p1: Point,
		p2: Point,
		options: Partial<_CLASSNAME_Options> = {}
	) {
		super();
		this._p1 = p1;
		this._p2 = p2;
		this._options = {
			...defaultOptions,
			...options,
		};
		this._paneViews = [new _CLASSNAME_PaneView(this)];
		//* AxisLabelView renders each label from its source, and hides it while
		//* the point cannot be placed on the axis.
		this._timeAxisViews = [
			new AxisLabelView(new _CLASSNAME_TimeAxisLabelSource(this, p1)),
			new AxisLabelView(new _CLASSNAME_TimeAxisLabelSource(this, p2)),
		];
		this._priceAxisViews = [
			new AxisLabelView(new _CLASSNAME_PriceAxisLabelSource(this, p1)),
			new AxisLabelView(new _CLASSNAME_PriceAxisLabelSource(this, p2)),
		];
		this._priceAxisPaneViews = [new _CLASSNAME_PriceAxisPaneView(this, true)];
		this._timeAxisPaneViews = [new _CLASSNAME_TimeAxisPaneView(this, false)];
	}

	updateAllViews() {
		//* Use this method to update any data required by the
		//* views to draw.
		//* The axis labels read their coordinates from the chart on demand, so
		//* only the pane views need updating here.
		this._paneViews.forEach(pw => pw.update());
		this._priceAxisPaneViews.forEach(pw => pw.update());
		this._timeAxisPaneViews.forEach(pw => pw.update());
	}

	priceAxisViews() {
		//* Labels rendered on the price scale
		return this._priceAxisViews;
	}

	timeAxisViews() {
		//* labels rendered on the time scale
		return this._timeAxisViews;
	}

	paneViews() {
		//* rendering on the main chart pane
		return this._paneViews;
	}

	priceAxisPaneViews() {
		//* rendering on the price scale
		return this._priceAxisPaneViews;
	}

	timeAxisPaneViews() {
		//* rendering on the time scale
		return this._timeAxisPaneViews;
	}

	autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		//* Use this method to provide autoscale information if your primitive
		//* should have the ability to remain in view automatically.
		if (
			this._timeCurrentlyVisible(this.p1.time, startTimePoint, endTimePoint) ||
			this._timeCurrentlyVisible(this.p2.time, startTimePoint, endTimePoint)
		) {
			return {
				priceRange: {
					minValue: Math.min(this.p1.price, this.p2.price),
					maxValue: Math.max(this.p1.price, this.p2.price),
				},
			};
		}
		return null;
	}

	dataUpdated(_scope: DataChangedScope): void {
		//* This method will be called by PluginBase when the data on the
		//* series has changed.
	}

	private _timeCurrentlyVisible(
		time: Time,
		startTimePoint: Logical,
		endTimePoint: Logical
	): boolean {
		const ts = this.chart.timeScale();
		const coordinate = ts.timeToCoordinate(time);
		if (coordinate === null) return false;
		const logical = ts.coordinateToLogical(coordinate);
		if (logical === null) return false;
		return logical <= endTimePoint && logical >= startTimePoint;
	}

	public get options(): _CLASSNAME_Options {
		return this._options;
	}

	applyOptions(options: Partial<_CLASSNAME_Options>) {
		this._options = { ...this._options, ...options };
		this.requestUpdate();
	}

	public get p1(): Point {
		return this._p1;
	}

	public get p2(): Point {
		return this._p2;
	}
}
