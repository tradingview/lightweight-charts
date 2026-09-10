import {
	CandlestickSeriesOptions,
	CustomSeriesOptions,
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
	customSeriesDefaultOptions,
} from 'lightweight-charts';
import { RoundedCandleData } from './data';
import { RoundedCandleRadius } from './radius';
import { RoundedCandleSeriesRenderer } from './renderer';

export interface RoundedCandleSeriesOptions
	extends CustomSeriesOptions,
		CandlestickSeriesOptions {
	radius: RoundedCandleRadius;
}

const defaultOptions: RoundedCandleSeriesOptions = {
	...customSeriesDefaultOptions,
	upColor: '#26a69a',
	downColor: '#ef5350',
	wickVisible: true,
	borderVisible: true,
	borderColor: '#378658',
	borderUpColor: '#26a69a',
	borderDownColor: '#ef5350',
	wickColor: '#737375',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
	radius: function (bs: number): number {
		if (bs < 4) return 0;
		return bs / 3;
	},
} as const;

export class RoundedCandleSeries<
	HorzScaleItem = Time,
	TData extends RoundedCandleData<HorzScaleItem> = RoundedCandleData<HorzScaleItem>
> implements ICustomSeriesPaneView<HorzScaleItem, TData, RoundedCandleSeriesOptions>
{
	private _renderer: RoundedCandleSeriesRenderer<HorzScaleItem, TData>;

	public constructor() {
		this._renderer = new RoundedCandleSeriesRenderer();
	}

	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.high, plotRow.low, plotRow.close];
	}

	public renderer(): RoundedCandleSeriesRenderer<HorzScaleItem, TData> {
		return this._renderer;
	}

	public isWhitespace(
		data: TData | CustomSeriesWhitespaceData<HorzScaleItem>
	): data is CustomSeriesWhitespaceData<HorzScaleItem> {
		return (data as Partial<TData>).close === undefined;
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: RoundedCandleSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	public defaultOptions(): RoundedCandleSeriesOptions {
		return defaultOptions;
	}
}

export type { RoundedCandleData, RoundedCandleSeriesData } from './data';
export type { RoundedCandleRadius } from './radius';
export { defaultOptions };
