import { createWhitespaceSeries, OptionsAwareSeries } from '@tradingview/lwc-toolkit/custom-series/options-aware-series';
import { GapCheck } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	DeepPartial,
	IChartApiBase,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';
import { stackedPlotValues } from '@tradingview/lwc-toolkit/custom-series/stacking';

import { StackedAreaConflationContext } from './compat';
import { StackedAreaSeriesOptions, defaultOptions } from './options';
import { StackedAreaSeriesRenderer } from './renderer';
import { StackedAreaData } from './data';
import { paddedValues, percentValues, sumValues } from './stack';

export class StackedAreaSeries<
	HorzScaleItem = Time,
	TData extends StackedAreaData<HorzScaleItem> = StackedAreaData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, StackedAreaSeriesOptions>
{
	private _renderer: StackedAreaSeriesRenderer<HorzScaleItem, TData>;

	private _options: StackedAreaSeriesOptions = defaultOptions;

	public constructor(
		isGap?: GapCheck<HorzScaleItem, TData>,
		private readonly _readOptions?: () => Readonly<StackedAreaSeriesOptions>
	) {
		this._renderer = new StackedAreaSeriesRenderer(isGap);
	}

	/**
	 * Reports the extremes of the stack as well as its total, so that a point
	 * containing negative values — whose bands are drawn back down towards the
	 * base — stays fully in view. The values are scaled and offset exactly as
	 * the renderer draws them, so `percent` autoscales to `base`…`base + 100`
	 * rather than to the raw totals.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		const options = this._readOptions?.() ?? this._options;
		const padded = paddedValues(plotRow.values, plotRow.values.length);
		return stackedPlotValues(options.percent ? percentValues(padded) : padded, options.base);
	}

	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	/**
	 * Merges two points into one when the chart conflates the data: each band
	 * is the sum of the two. Optional on `ICustomSeriesPaneView` from
	 * `lightweight-charts` 5.1; older hosts simply never call it.
	 */
	public conflationReducer(
		item1: StackedAreaConflationContext<TData>,
		item2: StackedAreaConflationContext<TData>
	): TData {
		return {
			...item1.data,
			values: sumValues(item1.data.values, item2.data.values),
		};
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: StackedAreaSeriesOptions
	): void {
		// Kept for the price-value builder of a bare pane view, which the host
		// can call before it has ever handed the options to a renderer.
		this._options = options;
		this._renderer.update(data, options);
	}

	public defaultOptions(): StackedAreaSeriesOptions {
		return defaultOptions;
	}
}

export type { StackedAreaData } from './data';
export type {
	StackedAreaColor,
	StackedAreaGapHandling,
	StackedAreaLineType,
	StackedAreaPointColor,
	StackedAreaSeriesOptions,
} from './options';
export { defaultOptions } from './options';

/**
 * Adds an area series that preserves explicit whitespace without treating
 * timestamps contributed by other series as gaps. Prefer this helper over
 * chart.addCustomSeries(new StackedAreaSeries(), options).
 */
export function createStackedAreaSeries<H = Time, D extends StackedAreaData<H> = StackedAreaData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<StackedAreaSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, StackedAreaSeriesOptions> {
	return createWhitespaceSeries(
		chart,
		(isGap, readOptions) => new StackedAreaSeries<H, D>(isGap, readOptions),
		defaultOptions,
		options,
		['base', 'percent'],
		paneIndex
	);
}
