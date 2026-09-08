import {
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
import { finiteValues, sumValues } from './stack';

export class StackedBarsSeries<
	HorzScaleItem = Time,
	TData extends StackedBarsData<HorzScaleItem> = StackedBarsData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, StackedBarsSeriesOptions>
{
	private _renderer: StackedBarsSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new StackedBarsSeriesRenderer();
	}

	/**
	 * Reports the extremes of the stack as well as its total, so that a column
	 * containing negative values — which is drawn downwards from the base —
	 * stays fully in view.
	 */
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return stackedPlotValues(finiteValues(plotRow.values));
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
