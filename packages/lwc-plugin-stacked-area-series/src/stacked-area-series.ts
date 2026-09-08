import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { StackedAreaSeriesOptions, defaultOptions } from './options';
import { StackedAreaSeriesRenderer } from './renderer';
import { StackedAreaData } from './data';

export class StackedAreaSeries<
	HorzScaleItem = Time,
	TData extends StackedAreaData<HorzScaleItem> = StackedAreaData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, StackedAreaSeriesOptions>
{
	private _renderer: StackedAreaSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new StackedAreaSeriesRenderer();
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

	public renderer(): StackedAreaSeriesRenderer<HorzScaleItem, TData> {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: StackedAreaSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): StackedAreaSeriesOptions {
		return defaultOptions;
	}
}

export type { StackedAreaData } from './data';
export type { StackedAreaSeriesOptions } from './options';
export { defaultOptions } from './options';
