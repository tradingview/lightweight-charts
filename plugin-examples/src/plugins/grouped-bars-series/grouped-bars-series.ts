import {
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	WhitespaceData,
	Time,
} from 'lightweight-charts';
import { GroupedBarsSeriesOptions, defaultOptions } from './options';
import { GroupedBarsSeriesRenderer } from './renderer';
import { GroupedBarsData } from './data';

export class GroupedBarsSeries<TData extends GroupedBarsData>
	implements ICustomSeriesPaneView<Time, TData, GroupedBarsSeriesOptions>
{
	_renderer: GroupedBarsSeriesRenderer<TData>;

	constructor() {
		this._renderer = new GroupedBarsSeriesRenderer();
	}

	priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [
			0,
			...plotRow.values,
		];
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	renderer(): GroupedBarsSeriesRenderer<TData> {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: GroupedBarsSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}
