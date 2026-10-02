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
import { BrushableAreaSeriesOptions, defaultOptions } from './options';
import { BrushableAreaSeriesRenderer } from './renderer';
import { BrushableAreaData } from './data';

export class BrushableAreaSeries<
	HorzScaleItem = Time,
	TData extends BrushableAreaData<HorzScaleItem> = BrushableAreaData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, BrushableAreaSeriesOptions>
{
	private _renderer: BrushableAreaSeriesRenderer<HorzScaleItem, TData>;

	public constructor(isGap?: GapCheck<HorzScaleItem, TData>) {
		this._renderer = new BrushableAreaSeriesRenderer(isGap);
	}

	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.value];
	}

	public isWhitespace(
		data: TData | CustomSeriesWhitespaceData<HorzScaleItem>
	): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return (data as Partial<TData>).value === undefined;
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: BrushableAreaSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): BrushableAreaSeriesOptions {
		return defaultOptions;
	}
}

export type { BrushableAreaData } from './data';
export type {
	BrushableAreaSeriesOptions,
	BrushableAreaStyle,
	BrushRange,
} from './options';
export { defaultOptions } from './options';
export type {
	BrushableAreaInteractionOptions,
	BrushableAreaRange,
} from './interaction';
export {
	BrushableAreaInteraction,
	defaultInteractionOptions,
} from './interaction';

/**
 * Adds an area series that preserves explicit whitespace without treating
 * timestamps contributed by other series as gaps. Prefer this helper over
 * chart.addCustomSeries(new BrushableAreaSeries(), options).
 */
export function createBrushableAreaSeries<H = Time, D extends BrushableAreaData<H> = BrushableAreaData<H>>(
	chart: IChartApiBase<H>,
	options: DeepPartial<BrushableAreaSeriesOptions> = {},
	paneIndex: number = 0
): OptionsAwareSeries<H, D, BrushableAreaSeriesOptions> {
	return createWhitespaceSeries(chart, isGap => new BrushableAreaSeries<H, D>(isGap), defaultOptions, options, [], paneIndex);
}
