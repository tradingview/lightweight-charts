import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { RoundedCandleData } from './data';
import { RoundedCandleSeriesOptions, defaultOptions } from './options';
import { RoundedCandleSeriesRenderer } from './renderer';

/**
 * One of the two data points a conflation reducer is handed. Declared here
 * rather than imported so that the package still typechecks against
 * `lightweight-charts` 5.0.0, which has no conflation.
 */
export interface RoundedCandleConflationContext<TData> {
	readonly data: TData;
}

export class RoundedCandleSeries<
	HorzScaleItem = Time,
	TData extends RoundedCandleData<HorzScaleItem> = RoundedCandleData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, RoundedCandleSeriesOptions>
{
	private _renderer: RoundedCandleSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new RoundedCandleSeriesRenderer();
	}

	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.high, plotRow.low, plotRow.close];
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public isWhitespace(
		data: TData | CustomSeriesWhitespaceData<HorzScaleItem>
	): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		const point = data as Partial<TData>;
		return (
			point.open === undefined ||
			point.high === undefined ||
			point.low === undefined ||
			point.close === undefined
		);
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: RoundedCandleSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	/**
	 * Merges two candles into one while the chart conflates data: the open of
	 * the first, the close of the second, and the extremes of both. The per-item
	 * color overrides of the first candle are kept.
	 */
	public conflationReducer(
		item1: RoundedCandleConflationContext<TData>,
		item2: RoundedCandleConflationContext<TData>
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

	public defaultOptions(): RoundedCandleSeriesOptions {
		return defaultOptions;
	}
}

export type { RoundedCandleData, RoundedCandleSeriesData } from './data';
export type { RoundedCandleRadius } from './radius';
export type {
	RoundedCandleSeriesOptions,
	RoundedCandleUpDownMode,
	RoundedCandleWickLineCap,
} from './options';
export type { CandleColorSource, ResolvedCandleColors } from './colors';
export { defaultOptions };
