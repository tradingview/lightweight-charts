import { createOptionsAwareSeries, OptionsAwareSeries } from '@tradingview/lwc-toolkit/custom-series/options-aware-series';
import {
	DeepPartial,
	IChartApiBase,
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time
} from 'lightweight-charts';
import { defaultOptions, PrettyHistogramSeriesOptions } from './options';
import { PrettyHistogramSeriesRenderer } from './renderer';
import { PrettyHistogramData } from './data';
import { ConflationContext } from './compat';

export class PrettyHistogramSeries<
	HorzScaleItem = Time,
	TData extends PrettyHistogramData<HorzScaleItem> = PrettyHistogramData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, PrettyHistogramSeriesOptions> {
	private _renderer: PrettyHistogramSeriesRenderer<HorzScaleItem, TData>;
	private _options: PrettyHistogramSeriesOptions = defaultOptions;

	public constructor(private readonly _readOptions?: () => Readonly<PrettyHistogramSeriesOptions>) {
		this._renderer = new PrettyHistogramSeriesRenderer();
	}

	/**
	 * The base is reported alongside the value, so that autoscaling keeps the
	 * line the columns grow from in view — the same as the built-in histogram.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [(this._readOptions?.() ?? this._options).base, plotRow.value];
	}

	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return (data as Partial<TData>).value === undefined;
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: PrettyHistogramSeriesOptions
	): void {
		this._options = options;
		this._renderer.update(data, options);
	}

	/**
	 * Conflated points keep the later of the two, the way the built-in histogram
	 * series does. Called by the library from v5.1 onwards.
	 */
	public conflationReducer(
		_item1: ConflationContext<TData>,
		item2: ConflationContext<TData>
	): TData {
		return item2.data;
	}

	public defaultOptions(): PrettyHistogramSeriesOptions {
		return defaultOptions;
	}
}

export type { PrettyHistogramData } from './data';
export type {
	PrettyHistogramSeriesOptions,
	PrettyHistogramWidthMode,
} from './options';
export { defaultOptions } from './options';

/**
 * Adds a series with synchronous option access for correct initial autoscaling.
 * applyOptions automatically rebuilds plot values when scaling options change.
 * Use this helper in place of chart.addCustomSeries(new PrettyHistogramSeries(), options).
 */
export function createPrettyHistogramSeries<H = Time, D extends PrettyHistogramData<H> = PrettyHistogramData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<PrettyHistogramSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, PrettyHistogramSeriesOptions> {
	return createOptionsAwareSeries(chart, readOptions => new PrettyHistogramSeries<H, D>(readOptions), defaultOptions, options, ['base'], paneIndex);
}
