import { supportsSeriesOrder } from '@tradingview/lwc-toolkit/chart/compat';
import { ConflationContext } from '@tradingview/lwc-toolkit/custom-series/compat';
import { OptionsAwareSeries } from '@tradingview/lwc-toolkit/custom-series/options-aware-series';
import { isFiniteNumber } from '@tradingview/lwc-toolkit/numbers';
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

import { BackgroundShadeData } from './data';
import { BackgroundShadeSeriesOptions, defaultOptions } from './options';
import { BackgroundShadeSeriesRenderer } from './renderer';

export class BackgroundShadeSeries<
	HorzScaleItem = Time,
	TData extends BackgroundShadeData<HorzScaleItem> = BackgroundShadeData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, BackgroundShadeSeriesOptions> {
	private readonly _renderer = new BackgroundShadeSeriesRenderer<HorzScaleItem, TData>();

	/**
	 * `NaN` keeps the series out of the price scale entirely: it does not
	 * change the autoscale range, and has no last value for a price line or a
	 * label. The shading spans the full height of the pane whatever the scale.
	 */
	public priceValueBuilder(_plotRow: TData): CustomSeriesPricePlotValues {
		return [NaN];
	}

	/**
	 * A point without a finite `value`, `null` included, as JSON sends a
	 * missing one, is whitespace: its slot stays unshaded.
	 */
	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !isFiniteNumber((data as Partial<TData>).value);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: BackgroundShadeSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	/**
	 * Conflated points keep the later of the two, the way the built-in
	 * histogram series does. Called by the library from v5.1 onwards.
	 */
	public conflationReducer(
		_item1: ConflationContext<TData>,
		item2: ConflationContext<TData>
	): TData {
		return item2.data;
	}

	public defaultOptions(): BackgroundShadeSeriesOptions {
		return defaultOptions;
	}
}

export type { BackgroundShadeData } from './data';
export type { BackgroundShadeSeriesOptions } from './options';
export { defaultOptions } from './options';

/**
 * Adds a background shade series to the chart and moves it behind every other
 * series in its pane, so that it reads as a background whatever order the
 * series are added in. Equivalent to `chart.addCustomSeries(new
 * BackgroundShadeSeries(), options, paneIndex)` followed by
 * `series.setSeriesOrder(0)`.
 *
 * `setSeriesOrder` arrived in `lightweight-charts` 5.0.6. On older versions
 * the series keeps the order it was added in, so add it before the others.
 */
export function createBackgroundShadeSeries<H = Time, D extends BackgroundShadeData<H> = BackgroundShadeData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<BackgroundShadeSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, BackgroundShadeSeriesOptions> {
	const series = chart.addCustomSeries(new BackgroundShadeSeries<H, D>(), options, paneIndex);
	if (supportsSeriesOrder(series)) {
		series.setSeriesOrder(0);
	}
	return series;
}
