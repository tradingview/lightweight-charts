import {
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	DeepPartial,
	IChartApiBase,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	ISeriesApi,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';

import { BoxWhiskerData } from './data';
import { boxWhiskerPlotValues, isBoxPlot } from './geometry';
import { BoxWhiskerSeriesOptions, defaultOptions } from './options';
import { BoxWhiskerSeriesRenderer } from './renderer';

export class BoxWhiskerSeries<
	HorzScaleItem = Time,
	TData extends BoxWhiskerData<HorzScaleItem> = BoxWhiskerData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, BoxWhiskerSeriesOptions> {
	private readonly _renderer: BoxWhiskerSeriesRenderer<HorzScaleItem, TData> = new BoxWhiskerSeriesRenderer();

	/**
	 * The highest and the lowest of the five numbers, the outliers' extremes,
	 * and the median last, so that the price line and the last value label
	 * show the median.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return boxWhiskerPlotValues(plotRow);
	}

	/**
	 * A point without five finite numbers, a missing or `null` one included, is
	 * whitespace: it keeps its place on the time scale and stays out of the
	 * price scale.
	 */
	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !isBoxPlot(data as Partial<TData>);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: BoxWhiskerSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): BoxWhiskerSeriesOptions {
		return defaultOptions;
	}
}

export type { BoxWhiskerData } from './data';
export type { BoxWhiskerSeriesOptions } from './options';
export { defaultOptions } from './options';

/** The series API `createBoxWhiskerSeries` returns, with the plugin's data and options types. */
export type BoxWhiskerSeriesApi<H = Time, D extends BoxWhiskerData<H> = BoxWhiskerData<H>> =
	ISeriesApi<'Custom', H, D | CustomSeriesWhitespaceData<H>, BoxWhiskerSeriesOptions, DeepPartial<BoxWhiskerSeriesOptions>>;

/**
 * Adds a box and whisker series to the chart, the same as
 * `chart.addCustomSeries(new BoxWhiskerSeries(), options, paneIndex)`, with
 * the plugin's data and options types kept on the returned series. No option
 * changes the plot values, so the series needs nothing more.
 */
export function createBoxWhiskerSeries<H = Time, D extends BoxWhiskerData<H> = BoxWhiskerData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<BoxWhiskerSeriesOptions> = {},
	paneIndex: number = 0
): BoxWhiskerSeriesApi<H, D> {
	return chart.addCustomSeries<D, BoxWhiskerSeriesOptions, DeepPartial<BoxWhiskerSeriesOptions>>(new BoxWhiskerSeries<H, D>(), options, paneIndex);
}
