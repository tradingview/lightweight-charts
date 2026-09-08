import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { StackedBarsSeriesOptions, defaultOptions } from './options';
import { StackedBarsSeriesRenderer } from './renderer';
import { StackedBarsData } from './data';

export class StackedBarsSeries<
	HorzScaleItem = Time,
	TData extends StackedBarsData<HorzScaleItem> = StackedBarsData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, StackedBarsSeriesOptions>
{
	private _renderer: StackedBarsSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new StackedBarsSeriesRenderer();
	}

	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [
			0,
			plotRow.values.reduce(
				(previousValue, currentValue) => previousValue + currentValue,
				0
			),
		];
	}

	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	public renderer(): StackedBarsSeriesRenderer<HorzScaleItem, TData> {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: StackedBarsSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): StackedBarsSeriesOptions {
		return defaultOptions;
	}
}

export type { StackedBarsData } from './data';
export type { StackedBarsSeriesOptions } from './options';
export { defaultOptions } from './options';
