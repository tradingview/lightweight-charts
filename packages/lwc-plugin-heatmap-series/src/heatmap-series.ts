import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	IChartApiBase,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	ISeriesApi,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';

import { HeatmapData } from './data';
import { hasDrawnCell, heatmapPlotValues } from './geometry';
import { HeatmapSeriesOptions, HeatmapSeriesPartialOptions, defaultOptions } from './options';
import { HeatmapSeriesRenderer } from './renderer';

export class HeatmapSeries<
	HorzScaleItem = Time,
	TData extends HeatmapData<HorzScaleItem> = HeatmapData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, HeatmapSeriesOptions> {
	private readonly _renderer: HeatmapSeriesRenderer<HorzScaleItem, TData> = new HeatmapSeriesRenderer();

	/**
	 * The lowest and the highest cell edge, so the whole column stays in view,
	 * and their middle last, which is the value the price line and the last
	 * value label show.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return heatmapPlotValues(plotRow.cells);
	}

	/**
	 * A point with no cell that can be drawn is whitespace: it keeps its place
	 * on the time scale and stays out of the price scale. That covers `cells`
	 * that is missing, `null` or empty, and cells that are all `null` or hold
	 * a number that is not finite.
	 */
	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !hasDrawnCell((data as Partial<TData>).cells);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: HeatmapSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): HeatmapSeriesOptions {
		return defaultOptions;
	}
}

export { createColorScale } from './color-scale';
export type { ColorScaleOptions } from './color-scale';
export type { HeatmapCell, HeatmapData } from './data';
export type { HeatmapAmountRange, HeatmapCellShader, HeatmapSeriesOptions, HeatmapSeriesPartialOptions } from './options';
export { defaultOptions } from './options';

/** The series API `createHeatmapSeries` returns, with the plugin's data and options types. */
export type HeatmapSeriesApi<H = Time, D extends HeatmapData<H> = HeatmapData<H>> =
	ISeriesApi<'Custom', H, D | CustomSeriesWhitespaceData<H>, HeatmapSeriesOptions, HeatmapSeriesPartialOptions>;

/**
 * Adds a heatmap series to the chart. The same as
 * `chart.addCustomSeries(new HeatmapSeries(), options, paneIndex)`, except
 * that the options, here and in `applyOptions`, keep `cellShader` a function
 * type, so an inline shader gets its parameters typed.
 */
export function createHeatmapSeries<H = Time, D extends HeatmapData<H> = HeatmapData<H>>(
	chart: IChartApiBase<H>,
	options: HeatmapSeriesPartialOptions = {},
	paneIndex: number = 0
): HeatmapSeriesApi<H, D> {
	return chart.addCustomSeries<D, HeatmapSeriesOptions, HeatmapSeriesPartialOptions>(new HeatmapSeries<H, D>(), options, paneIndex);
}
