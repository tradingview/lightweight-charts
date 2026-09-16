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
import { stackedPlotValues } from '@tradingview/lwc-toolkit/custom-series/stacking';

import { StackedBarsConflationContext } from './compat';
import { StackedBarsSeriesOptions, defaultOptions } from './options';
import { StackedBarsSeriesRenderer } from './renderer';
import { StackedBarsData } from './data';
import { bandValues, stackBands, sumValues } from './stack';

export class StackedBarsSeries<
	HorzScaleItem = Time,
	TData extends StackedBarsData<HorzScaleItem> = StackedBarsData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, StackedBarsSeriesOptions>
{
	private _renderer: StackedBarsSeriesRenderer<HorzScaleItem, TData>;

	private _options: StackedBarsSeriesOptions = defaultOptions;

	public constructor(private readonly _readOptions?: () => Readonly<StackedBarsSeriesOptions>) {
		this._renderer = new StackedBarsSeriesRenderer();
	}

	/**
	 * Reports the extremes of the stack as well as its total, so that a column
	 * containing negative values — which is drawn downwards from the base —
	 * stays fully in view.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		const options = this._readOptions?.() ?? this._options;
		return stackedPlotValues(bandValues(stackBands(plotRow.values, options)), options.base);
	}

	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	/**
	 * Merges two points into one when the chart conflates the data: each band
	 * is the sum of the two, which keeps every column a total of the period it
	 * now covers. Optional on `ICustomSeriesPaneView` from `lightweight-charts`
	 * 5.1; older hosts simply never call it.
	 */
	public conflationReducer(
		item1: StackedBarsConflationContext<TData>,
		item2: StackedBarsConflationContext<TData>
	): TData {
		return {
			...item1.data,
			values: sumValues(item1.data.values, item2.data.values),
		};
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: StackedBarsSeriesOptions
	): void {
		this._options = options;
		this._renderer.update(data, options);
	}

	public defaultOptions(): StackedBarsSeriesOptions {
		return defaultOptions;
	}
}

export type { StackedBarsData } from './data';
export type {
	StackedBarsColumnWidthMode,
	StackedBarsSeriesOptions,
	StackedBarsStackOrder,
} from './options';
export { defaultOptions } from './options';

/**
 * Adds a series with synchronous option access for correct initial autoscaling.
 * applyOptions automatically rebuilds plot values when scaling options change.
 * Use this helper in place of chart.addCustomSeries(new StackedBarsSeries(), options).
 */
export function createStackedBarsSeries<H = Time, D extends StackedBarsData<H> = StackedBarsData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<StackedBarsSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, StackedBarsSeriesOptions> {
	return createOptionsAwareSeries(chart, readOptions => new StackedBarsSeries<H, D>(readOptions), defaultOptions, options, ['base', 'percent', 'stackOrder'], paneIndex);
}
