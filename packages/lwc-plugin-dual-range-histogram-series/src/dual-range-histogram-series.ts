import { createOptionsAwareSeries, OptionsAwareSeries } from '@tradingview/lwc-toolkit/custom-series/options-aware-series';
import {
	DeepPartial,
	IChartApiBase,
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { DualRangeHistogramSeriesOptions, defaultOptions } from './options';
import { DualRangeHistogramSeriesRenderer } from './renderer';
import { DualRangeHistogramData } from './data';
import { ConflationContext } from './compat';

export class DualRangeHistogramSeries<
	HorzScaleItem = Time,
	TData extends DualRangeHistogramData<HorzScaleItem> = DualRangeHistogramData<HorzScaleItem>
> implements
		ICustomSeriesPaneView<HorzScaleItem, TData, DualRangeHistogramSeriesOptions>
{
	private _renderer: DualRangeHistogramSeriesRenderer<HorzScaleItem, TData>;
	private _options: DualRangeHistogramSeriesOptions = defaultOptions;

	public constructor(private readonly _readOptions?: () => Readonly<DualRangeHistogramSeriesOptions>) {
		this._renderer = new DualRangeHistogramSeriesRenderer();
	}

	/**
	 * In `pixels` scale mode only the base line is reported, so that the columns
	 * never affect the scaling of the other series on the same price scale; use
	 * `keepPixelSeriesInView` to reserve room for them. In `price` mode the
	 * values are prices measured from `baseValue` and autoscale like any other
	 * series.
	 *
	 * The plot values are built when the data is set, so `scaleMode` and
	 * `baseValue` are read then: use `createDualRangeHistogramSeries` to keep them synchronized with the API.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		const options = this._readOptions?.() ?? this._options;
		const base = options.baseValue;
		if (options.scaleMode !== 'price') {
			return [base];
		}
		let min = 0;
		let max = 0;
		for (const value of plotRow.values) {
			if (!Number.isFinite(value)) {
				continue;
			}
			min = Math.min(min, value);
			max = Math.max(max, value);
		}
		return [base + min, base + max, base];
	}

	public isWhitespace(
		data: TData | CustomSeriesWhitespaceData<HorzScaleItem>
	): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: DualRangeHistogramSeriesOptions
	): void {
		this._options = options;
		this._renderer.update(data, options);
	}

	/**
	 * Conflated points keep the later of the two, the way a histogram series
	 * does. Called by the library from v5.1 onwards.
	 */
	public conflationReducer(
		_item1: ConflationContext<TData>,
		item2: ConflationContext<TData>
	): TData {
		return item2.data;
	}

	public defaultOptions(): DualRangeHistogramSeriesOptions {
		return defaultOptions;
	}
}

export type { DualRangeHistogramData } from './data';
export type {
	DualRangeHistogramColumns,
	DualRangeHistogramNormalize,
	DualRangeHistogramScaleMode,
	DualRangeHistogramSeriesOptions,
} from './options';
export { defaultOptions } from './options';
export { keepPixelSeriesInView } from './keep-in-view';
export type { PixelHeightSeriesApi } from './keep-in-view';

/**
 * Adds a series with synchronous option access for correct initial autoscaling.
 * applyOptions automatically rebuilds plot values when scaling options change.
 * Use this helper in place of chart.addCustomSeries(new DualRangeHistogramSeries(), options).
 */
export function createDualRangeHistogramSeries<H = Time, D extends DualRangeHistogramData<H> = DualRangeHistogramData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<DualRangeHistogramSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, DualRangeHistogramSeriesOptions> {
	return createOptionsAwareSeries(chart, readOptions => new DualRangeHistogramSeries<H, D>(readOptions), defaultOptions, options, ['scaleMode', 'baseValue'], paneIndex);
}
