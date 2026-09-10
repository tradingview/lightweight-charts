import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time
} from 'lightweight-charts';
import { defaultOptions, PrettyHistogramSeriesOptions } from './options';
import { PrettyHistogramSeriesRenderer } from './renderer';
import { PrettyHistogramData } from './data';

export class PrettyHistogramSeries<
	HorzScaleItem = Time,
	TData extends PrettyHistogramData<HorzScaleItem> = PrettyHistogramData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, PrettyHistogramSeriesOptions> {
	private _renderer: PrettyHistogramSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new PrettyHistogramSeriesRenderer();
	}

	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.value];
	}

	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return (data as Partial<TData>).value === undefined;
	}

	public renderer(): PrettyHistogramSeriesRenderer<HorzScaleItem, TData> {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: PrettyHistogramSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): PrettyHistogramSeriesOptions {
		return defaultOptions;
	}
}

export type { PrettyHistogramData } from './data';
export type { PrettyHistogramSeriesOptions } from './options';
export { defaultOptions } from './options';
