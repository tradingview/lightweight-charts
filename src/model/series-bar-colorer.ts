import { ensure, ensureNotNull } from '../helpers/assertions';

import { PlotRowValueIndex } from './plot-data';
import { Series } from './series';
import { SeriesPlotRow } from './series-data';
import {
	AreaStyleOptions,
	BarStyleOptions,
	BaselineStyleOptions,
	CandlestickStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	SeriesOptionsMap,
	SeriesType,
} from './series-options';
import { TimePointIndex } from './time-data';

export interface PrecomputedBars {
	value: SeriesPlotRow;
	previousValue?: SeriesPlotRow;
}

export interface CommonBarColorerStyle {
	barColor: string;
}

export interface AreaBarColorerStyle extends CommonBarColorerStyle {
	topColor: string;
	bottomColor: string;
}

export interface BarColorerStyle extends CommonBarColorerStyle {
	barBorderColor: string;
}

export interface CandlesticksColorerStyle extends CommonBarColorerStyle {
	barBorderColor: string;
	barWickColor: string;
}

export interface BarStylesMap {
	Bar: BarColorerStyle;
	Candlestick: CandlesticksColorerStyle;
	Area: AreaBarColorerStyle;
	Baseline: CommonBarColorerStyle;
	Line: CommonBarColorerStyle;
	Histogram: CommonBarColorerStyle;
}

type FindBarFn = (barIndex: TimePointIndex, precomputedBars?: PrecomputedBars) => SeriesPlotRow | null;

type StyleGetterFn<T extends SeriesType> = (
	findBar: FindBarFn,
	barStyle: ReturnType<Series<T>['options']>,
	barIndex: TimePointIndex,
	precomputedBars?: PrecomputedBars
) => BarStylesMap[T];

type BarStylesFnMap = {
	[T in keyof SeriesOptionsMap]: StyleGetterFn<T>;
};

const barStyleFnMap: BarStylesFnMap = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Bar: (findBar: FindBarFn, barStyle: BarStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle => {
		const upColor = barStyle.upColor;
		const downColor = barStyle.downColor;
		const borderUpColor = upColor;
		const borderDownColor = downColor;

		const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Bar'>;
		const isUp = ensure(currentBar.value[PlotRowValueIndex.Open]) <= ensure(currentBar.value[PlotRowValueIndex.Close]);

		return {
			barColor: currentBar.color ?? (isUp ? upColor : downColor),
			barBorderColor: currentBar.color ?? (isUp ? borderUpColor : borderDownColor),
		};
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Candlestick: (findBar: FindBarFn, candlestickStyle: CandlestickStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): CandlesticksColorerStyle => {
		const upColor = candlestickStyle.upColor;
		const downColor = candlestickStyle.downColor;
		const borderUpColor = candlestickStyle.borderUpColor;
		const borderDownColor = candlestickStyle.borderDownColor;

		const wickUpColor = candlestickStyle.wickUpColor;
		const wickDownColor = candlestickStyle.wickDownColor;

		const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Candlestick'>;
		const isUp = ensure(currentBar.value[PlotRowValueIndex.Open]) <= ensure(currentBar.value[PlotRowValueIndex.Close]);

		return {
			barColor: currentBar.color ?? (isUp ? upColor : downColor),
			barBorderColor: currentBar.borderColor ?? (isUp ? borderUpColor : borderDownColor),
			barWickColor: currentBar.wickColor ?? (isUp ? wickUpColor : wickDownColor),
		};
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Area: (findBar: FindBarFn, areaStyle: AreaStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): AreaBarColorerStyle => {
		const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Area'>;
		return {
			barColor: currentBar.lineColor ?? areaStyle.lineColor,
			topColor: currentBar.topColor ?? areaStyle.topColor,
			bottomColor: currentBar.bottomColor ?? areaStyle.bottomColor,
		};
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Baseline: (findBar: FindBarFn, baselineStyle: BaselineStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): CommonBarColorerStyle => {
		const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Baseline'>;
		const isAboveBaseline = currentBar.value[PlotRowValueIndex.Close] >= baselineStyle.baseValue.price;

		return {
			barColor: isAboveBaseline ? baselineStyle.topLineColor : baselineStyle.bottomLineColor,
		};
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Line: (findBar: FindBarFn, lineStyle: LineStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): CommonBarColorerStyle => {
		const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Line'>;

		return {
			barColor: currentBar.color ?? lineStyle.color,
		};
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Histogram: (findBar: FindBarFn, histogramStyle: HistogramStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): CommonBarColorerStyle => {
		const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Histogram'>;
		return {
			barColor: currentBar.color ?? histogramStyle.color,
		};
	},
};

export class SeriesBarColorer<T extends SeriesType> {
	private _series: Series<T>;
	private readonly _styleGetter: typeof barStyleFnMap[T];

	public constructor(series: Series<T>) {
		this._series = series;
		this._styleGetter = barStyleFnMap[series.seriesType()];
	}

	public barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarStylesMap[T] {
		// precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
		// Used to avoid binary search if bars are already known
		return this._styleGetter(this._findBar, this._series.options(), barIndex, precomputedBars);
	}

	private _findBar = (barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): SeriesPlotRow | null => {
		if (precomputedBars !== undefined) {
			return precomputedBars.value;
		}

		return this._series.bars().valueAt(barIndex);
	};
}
