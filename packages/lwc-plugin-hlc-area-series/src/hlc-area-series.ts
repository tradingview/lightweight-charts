import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { HLCAreaSeriesOptions, defaultOptions } from './options';
import { HLCAreaSeriesRenderer } from './renderer';
import { HLCAreaData } from './data';

export class HLCAreaSeries<
	HorzScaleItem = Time,
	TData extends HLCAreaData<HorzScaleItem> = HLCAreaData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, HLCAreaSeriesOptions>
{
	private _renderer: HLCAreaSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new HLCAreaSeriesRenderer();
	}

	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.low, plotRow.high, plotRow.close];
	}

	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return (data as Partial<TData>).close === undefined;
	}

	public renderer(): HLCAreaSeriesRenderer<HorzScaleItem, TData> {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: HLCAreaSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): HLCAreaSeriesOptions {
		return defaultOptions;
	}
}

export type { HLCAreaData } from './data';
export type { HLCAreaSeriesOptions } from './options';
export { defaultOptions } from './options';
