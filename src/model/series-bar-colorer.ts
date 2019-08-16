import { ensure, ensureNotNull } from '../helpers/assertions';

import { PlotList } from './plot-list';
import { Series } from './series';
import { Bar, SeriesPlotIndex } from './series-data';
import {
	AreaStyleOptions,
	BarStyleOptions,
	CandlestickStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
} from './series-options';
import { TimePoint, TimePointIndex } from './time-data';

export interface PrecomputedBars {
	value: Bar;
	previousValue?: Bar;
}

export interface BarColorerStyle {
	barColor: string;
	barBorderColor: string; // Used in Candlesticks
	barWickColor: string; // Used in Candlesticks
}

const emptyResult: BarColorerStyle = {
	barColor: '',
	barBorderColor: '',
	barWickColor: '',
};

export class SeriesBarColorer {
	private _series: Series;

	public constructor(series: Series) {
		this._series = series;
	}

	public barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		// precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
		// Used to avoid binary search if bars are already known

		const targetType = this._series.seriesType();
		const seriesOptions = this._series.options();
		switch (targetType) {
			case 'Line':
				return this._lineStyle(seriesOptions as LineStyleOptions);

			case 'Area':
				return this._areaStyle(seriesOptions as AreaStyleOptions);

			case 'Bar':
				return this._barStyle(seriesOptions as BarStyleOptions, barIndex, precomputedBars);

			case 'Candlestick':
				return this._candleStyle(seriesOptions as CandlestickStyleOptions, barIndex, precomputedBars);

			case 'Histogram':
				return this._histogramStyle(seriesOptions as HistogramStyleOptions, barIndex, precomputedBars);
		}

		throw new Error('Unknown chart style');
	}

	private _barStyle(barStyle: BarStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result = { ...emptyResult };

		const upColor = barStyle.upColor;
		const downColor = barStyle.downColor;
		const borderUpColor = upColor;
		const borderDownColor = downColor;

		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const isUp = ensure(currentBar.value[SeriesPlotIndex.Open]) <= ensure(currentBar.value[SeriesPlotIndex.Close]);

		result.barColor = isUp ? upColor : downColor;
		result.barBorderColor = isUp ? borderUpColor : borderDownColor;

		return result;
	}

	private _candleStyle(candlestickStyle: CandlestickStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result = { ...emptyResult };

		const upColor = candlestickStyle.upColor;
		const downColor = candlestickStyle.downColor;
		const borderUpColor = candlestickStyle.borderUpColor;
		const borderDownColor = candlestickStyle.borderDownColor;

		const wickUpColor = candlestickStyle.wickUpColor;
		const wickDownColor = candlestickStyle.wickDownColor;

		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const isUp = ensure(currentBar.value[SeriesPlotIndex.Open]) <= ensure(currentBar.value[SeriesPlotIndex.Close]);

		result.barColor = isUp ? upColor : downColor;
		result.barBorderColor = isUp ? borderUpColor : borderDownColor;
		result.barWickColor = isUp ? wickUpColor : wickDownColor;

		return result;
	}

	private _areaStyle(areaStyle: AreaStyleOptions): BarColorerStyle {
		return {
			...emptyResult,
			barColor: areaStyle.lineColor,
		};
	}

	private _lineStyle(lineStyle: LineStyleOptions): BarColorerStyle {
		return {
			...emptyResult,
			barColor: lineStyle.color,
		};
	}

	private _histogramStyle(histogramStyle: HistogramStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result = { ...emptyResult };
		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const colorValue = currentBar.value[SeriesPlotIndex.Color];
		if (colorValue != null) {
			const palette = ensureNotNull(this._series.palette());
			result.barColor = palette.colorByIndex(colorValue);
		} else {
			result.barColor = histogramStyle.color;
		}
		return result;
	}

	private _getSeriesBars(): PlotList<TimePoint, Bar['value']> {
		return this._series.bars();
	}

	private _findBar(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): Bar | null {
		if (precomputedBars !== undefined) {
			return precomputedBars.value;
		}

		return this._getSeriesBars().valueAt(barIndex);
	}
}
