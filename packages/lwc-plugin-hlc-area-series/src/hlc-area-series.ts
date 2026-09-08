import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { HLCAreaSeriesOptions, defaultOptions } from './options';
import { HLCAreaSeriesRenderer } from './renderer';
import { HLCAreaData } from './data';

/**
 * One of the two data points a conflation reducer is handed. Declared here
 * rather than imported so that the package still typechecks against
 * `lightweight-charts` 5.0.0, which has no conflation.
 */
export interface HLCAreaConflationContext<TData> {
	readonly data: TData;
}

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
		const point = data as Partial<TData>;
		return (
			point.high === undefined ||
			point.low === undefined ||
			point.close === undefined
		);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: HLCAreaSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	/**
	 * Merges two points into one while the chart conflates data: the highest
	 * high, the lowest low and the last close.
	 */
	public conflationReducer(
		item1: HLCAreaConflationContext<TData>,
		item2: HLCAreaConflationContext<TData>
	): TData {
		const first = item1.data;
		const second = item2.data;
		return {
			...first,
			high: Math.max(first.high, second.high),
			low: Math.min(first.low, second.low),
			close: second.close,
		} as TData;
	}

	public defaultOptions(): HLCAreaSeriesOptions {
		return defaultOptions;
	}
}

export type { HLCAreaData } from './data';
export type { HLCAreaLineType, HLCAreaSeriesOptions } from './options';
export { defaultOptions } from './options';
