import {
    CustomSeriesPricePlotValues,
    ICustomSeriesPaneView,
    PaneRendererCustomData,
    SeriesDataItemTypeMap,
    SingleValueData,
    Time,
    WhitespaceData
} from 'lightweight-charts';
import { defaultOptions, PrettyHistogramSeriesOptions } from './options';
import { PrettyHistogramSeriesRenderer } from './renderer';

export class PrettyHistogramSeries<
    HorzScaleItem = Time,
    TData extends (SeriesDataItemTypeMap<HorzScaleItem>['Custom'] & SingleValueData<HorzScaleItem>) = SeriesDataItemTypeMap<HorzScaleItem>['Custom'] & SingleValueData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, PrettyHistogramSeriesOptions> {
	private _renderer: PrettyHistogramSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new PrettyHistogramSeriesRenderer();
	}

	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.value];
	}

	public isWhitespace(data: TData | WhitespaceData<HorzScaleItem>): data is WhitespaceData<HorzScaleItem> {
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
