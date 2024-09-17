import {
	CustomSeriesOptions,
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	customSeriesDefaultOptions,
	CandlestickSeriesOptions,
	WhitespaceData,
	Time,
} from 'lightweight-charts';
import { OptionPriceSeriesData, /* isRoundedCandleData */ } from './data';
import { OptionPriceSeriesRenderer } from './renderer';

export interface OptionPriceSeriesOptions
	extends CustomSeriesOptions,
		Exclude<
			CandlestickSeriesOptions,
			'borderVisible' | 'borderColor' | 'borderUpColor' | 'borderDownColor'
		> {
	radius: (barSpacing: number) => number;
}

const defaultOptions: OptionPriceSeriesOptions = {
	...customSeriesDefaultOptions,
	lastValueVisible: false,
	priceLineVisible: false,
	// upColor: '#26a69a',
	upColor: 'blue',
	// downColor: '#ef5350',
	downColor: 'orange',
	wickVisible: true,
	borderVisible: true,
	borderColor: '#378658',
	borderUpColor: '#26a69a',
	borderDownColor: '#ef5350',
	wickColor: '#737375',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
	radius: function (bs: number) {
		if (bs < 4) return 0;
		return bs / 3;
	},
} as const;

export class OptionPriceSeries<TData extends OptionPriceSeriesData>
	implements ICustomSeriesPaneView<Time, TData, OptionPriceSeriesOptions>
{
	_renderer: OptionPriceSeriesRenderer<TData>;
	_optionType: 'call' | 'put';

	constructor(optionType: 'call' | 'put') {
		this._renderer = new OptionPriceSeriesRenderer();
		this._optionType = optionType;
	}

	priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.high, plotRow.low, plotRow.close];
	}

	renderer(): OptionPriceSeriesRenderer<TData> {
		return this._renderer;
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return (data as Partial<TData>).close === undefined;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: OptionPriceSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}
