import {
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	WhitespaceData,
	Time,
} from 'lightweight-charts';
import { StackedBarsSeriesOptions, defaultOptions } from './options';
import { StackedBarsSeriesRenderer } from './renderer';
import { StackedBarsData } from './data';

export class StackedBarsSeries<TData extends StackedBarsData>
	implements ICustomSeriesPaneView<Time, TData, StackedBarsSeriesOptions>
{
	_renderer: StackedBarsSeriesRenderer<TData>;

	constructor() {
		this._renderer = new StackedBarsSeriesRenderer();
	}

	priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [
			0,
			plotRow.values.reduce(
				(previousValue, currentValue) => previousValue + currentValue,
				0
			),
		];
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	renderer(): StackedBarsSeriesRenderer<TData> {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: StackedBarsSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}
