import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { DualRangeHistogramSeriesOptions, defaultOptions } from './options';
import { DualRangeHistogramSeriesRenderer } from './renderer';
import { DualRangeHistogramData } from './data';

export class DualRangeHistogramSeries<
	HorzScaleItem = Time,
	TData extends DualRangeHistogramData<HorzScaleItem> = DualRangeHistogramData<HorzScaleItem>
> implements
		ICustomSeriesPaneView<HorzScaleItem, TData, DualRangeHistogramSeriesOptions>
{
	private _renderer: DualRangeHistogramSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new DualRangeHistogramSeriesRenderer();
	}

	public priceValueBuilder(): CustomSeriesPricePlotValues {
		return [0]; // keep zero line in view with autoscaling
	}

	public isWhitespace(
		data: TData | CustomSeriesWhitespaceData<HorzScaleItem>
	): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	public renderer(): DualRangeHistogramSeriesRenderer<HorzScaleItem, TData> {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: DualRangeHistogramSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): DualRangeHistogramSeriesOptions {
		return defaultOptions;
	}
}

export type { DualRangeHistogramData } from './data';
export type {
	DualRangeHistogramColumns,
	DualRangeHistogramSeriesOptions,
} from './options';
export { defaultOptions } from './options';
