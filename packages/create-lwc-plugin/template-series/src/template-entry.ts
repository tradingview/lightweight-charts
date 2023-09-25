import {
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	WhitespaceData,
	Time,
} from 'lightweight-charts';
import { _CLASSNAME_Options, defaultOptions } from './options';
import { _CLASSNAME_Renderer } from './renderer';
import { _CLASSNAME_Data } from './data';

export class _CLASSNAME_<TData extends _CLASSNAME_Data>
	implements ICustomSeriesPaneView<Time, TData, _CLASSNAME_Options>
{
	_renderer: _CLASSNAME_Renderer<TData>;

	constructor() {
		this._renderer = new _CLASSNAME_Renderer();
	}

	priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		const midPoint = (plotRow.low + plotRow.high) / 2;
		//* The values returned here are used for the autoscaling behaviour on the chart,
		//* and the last value is also used as the price value for the crosshair and price label.
		return [plotRow.low, plotRow.high, midPoint];
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		//* Method for checking if a specific datapoint should be considered whitespace
		//* Use this to filter out the data points which should be whitespace on the chart (and
		//* not get provided to the renderer).
		return (data as Partial<TData>).low === undefined || (data as Partial<TData>).high === undefined;
	}

	renderer(): _CLASSNAME_Renderer<TData> {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: _CLASSNAME_Options
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}
