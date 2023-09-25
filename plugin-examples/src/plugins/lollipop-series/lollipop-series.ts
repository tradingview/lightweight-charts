import {
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	WhitespaceData,
	Time,
} from 'lightweight-charts';
import { LollipopSeriesOptions, defaultOptions } from './options';
import { LollipopSeriesRenderer } from './renderer';
import { LollipopData } from './data';

export class LollipopSeries<TData extends LollipopData>
	implements ICustomSeriesPaneView<Time, TData, LollipopSeriesOptions>
{
	_renderer: LollipopSeriesRenderer<TData>;

	constructor() {
		this._renderer = new LollipopSeriesRenderer();
	}

	priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		// zero at the start because it should draw from zero (like a column)
		return [0, plotRow.value];
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return (data as Partial<TData>).value === undefined;
	}

	renderer(): LollipopSeriesRenderer<TData> {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: LollipopSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}
