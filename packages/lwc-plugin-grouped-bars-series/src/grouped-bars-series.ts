import { createOptionsAwareSeries, OptionsAwareSeries } from '@tradingview/lwc-toolkit/custom-series/options-aware-series';
import { AcceptedInput } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import {
	CustomBarItemData,
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	DeepPartial,
	IChartApiBase,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';

import { GroupedBarsData } from './data';
import { GroupedBarsSeriesOptions, defaultOptions } from './options';
import { GroupedBarsSeriesRenderer } from './renderer';
import { columnCount, groupedBarsBase, isDrawnValue } from './values';

export class GroupedBarsSeries<
	HorzScaleItem = Time,
	TData extends GroupedBarsData<HorzScaleItem> = GroupedBarsData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, GroupedBarsSeriesOptions> {
	private readonly _renderer: GroupedBarsSeriesRenderer<HorzScaleItem, TData>;
	private _options: GroupedBarsSeriesOptions = defaultOptions;
	private _columns: { revision: number; base: number; count: number } | null = null;

	/**
	 * @param _readOptions - Reads the series' current options. Passed in by
	 * `createGroupedBarsSeries`, so that `base` is known before the first render.
	 * @param _readInput - Reads the data the series accepted, whose revision
	 * moves on every change. Passed in by `createGroupedBarsSeries`, so that the
	 * number of columns is counted once per data change; without it, every
	 * update counts it again over all the bars.
	 */
	public constructor(
		private readonly _readOptions?: () => Readonly<GroupedBarsSeriesOptions>,
		private readonly _readInput?: () => AcceptedInput<HorzScaleItem, TData>
	) {
		this._renderer = new GroupedBarsSeriesRenderer(bars => this._columnCount(bars));
	}

	/**
	 * The base first, so that autoscaling keeps the line the columns grow from
	 * in view, then every value that draws a column. The last of those comes
	 * last, which is what the price line and the last value label show.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		const base = this._base();
		return [base, ...plotRow.values.filter(value => isDrawnValue(value, base))];
	}

	/**
	 * A point with no value that draws a column is whitespace: it keeps its
	 * place on the time scale and stays out of the price scale. `null`,
	 * non-finite values and values equal to `base` draw nothing.
	 */
	public isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		const base = this._base();
		return !(data as Partial<TData>).values?.some(value => isDrawnValue(value, base));
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: GroupedBarsSeriesOptions
	): void {
		this._options = options;
		this._renderer.update(data, options);
	}

	public defaultOptions(): GroupedBarsSeriesOptions {
		return defaultOptions;
	}

	private _base(): number {
		return groupedBarsBase(this._readOptions?.() ?? this._options);
	}

	private _columnCount(bars: readonly CustomBarItemData<HorzScaleItem, TData>[]): number {
		const base = this._base();
		const input = this._readInput?.();
		if (input === undefined) {
			return columnCount(bars, base, bar => bar.originalData.values);
		}
		const columns = this._columns;
		if (columns === null || columns.revision !== input.revision || columns.base !== base) {
			const count = columnCount(input.points, base, point => (point as Partial<TData>).values);
			this._columns = { revision: input.revision, base, count };
			return count;
		}
		return columns.count;
	}
}

export type { GroupedBarsData } from './data';
export type { GroupedBarsColumnWidthMode, GroupedBarsSeriesOptions } from './options';
export { defaultOptions } from './options';

/**
 * Adds a grouped bars series to the chart. Prefer it to
 * `chart.addCustomSeries(new GroupedBarsSeries(), options)`: the series reads
 * its current options as it builds its plot values, so `base` is part of the
 * autoscale range from the first `setData`, and changing it through
 * `applyOptions` rescales the series without setting the data again.
 */
export function createGroupedBarsSeries<H = Time, D extends GroupedBarsData<H> = GroupedBarsData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<GroupedBarsSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, GroupedBarsSeriesOptions> {
	return createOptionsAwareSeries(
		chart,
		(readOptions, readInput) => new GroupedBarsSeries<H, D>(readOptions, readInput),
		defaultOptions,
		options,
		['base'],
		paneIndex
	);
}
