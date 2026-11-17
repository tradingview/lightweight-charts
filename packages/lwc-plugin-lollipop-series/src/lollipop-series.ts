import { createOptionsAwareSeries, OptionsAwareSeries } from '@tradingview/lwc-toolkit/custom-series/options-aware-series';
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

import { LollipopData } from './data';
import { lollipopBase } from './geometry';
import { LollipopSeriesOptions, defaultOptions } from './options';
import { LollipopSeriesRenderer } from './renderer';

export class LollipopSeries<
	HorzScaleItem = Time,
	TData extends LollipopData<HorzScaleItem> = LollipopData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, LollipopSeriesOptions> {
	private readonly _renderer: LollipopSeriesRenderer<HorzScaleItem, TData>;
	private _options: LollipopSeriesOptions = defaultOptions;

	/**
	 * @param _readOptions - Reads the series' current options. Passed in by
	 * `createLollipopSeries`, so that `base` is known before the first render.
	 */
	public constructor(private readonly _readOptions?: () => Readonly<LollipopSeriesOptions>) {
		this._renderer = new LollipopSeriesRenderer();
	}

	/**
	 * The base is reported before the value, so that autoscaling keeps the line
	 * the stems grow from in view, and the value, which comes last, is what the
	 * price line and the last value label show.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [lollipopBase(this._readOptions?.() ?? this._options), plotRow.value];
	}

	/**
	 * A point without a finite `value`, `null` included, as JSON sends a
	 * missing one, is whitespace.
	 */
	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return !Number.isFinite((data as Partial<TData>).value);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: LollipopSeriesOptions
	): void {
		this._options = options;
		this._renderer.update(data, options);
	}

	public defaultOptions(): LollipopSeriesOptions {
		return defaultOptions;
	}
}

export type { LollipopData } from './data';
export type { LollipopSeriesOptions } from './options';
export { defaultOptions } from './options';

/**
 * Adds a lollipop series to the chart. Prefer it to
 * `chart.addCustomSeries(new LollipopSeries(), options)`: the series reads its
 * current options as it builds its plot values, so `base` is part of the
 * autoscale range from the first `setData`, and changing it through
 * `applyOptions` rescales the series without setting the data again.
 */
export function createLollipopSeries<H = Time, D extends LollipopData<H> = LollipopData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<LollipopSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, LollipopSeriesOptions> {
	return createOptionsAwareSeries(chart, readOptions => new LollipopSeries<H, D>(readOptions), defaultOptions, options, ['base'], paneIndex);
}
