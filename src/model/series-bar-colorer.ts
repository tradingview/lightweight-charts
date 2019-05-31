import { ensure, ensureNotNull } from '../helpers/assertions';

import { PlotList } from './plot-list';
import { Series } from './series';
import { Bar, SeriesPlotIndex } from './series-data';
import { TimePoint, TimePointIndex } from './time-data';

export interface PrecomputedBars {
	value: Bar;
	previousValue?: Bar;
}

export interface BarColorerStyle {
	barColor: string;
	barBorderColor: string; // Used in Candles
	barWickColor: string; // Used in Candles
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
		switch (targetType) {
			case 'Line':
				return this._lineStyle();

			case 'Area':
				return this._areaStyle();

			case 'Bar':
				return this._barStyle(barIndex, precomputedBars);

			case 'Candle':
				return this._candleStyle(barIndex, precomputedBars);

			case 'Histogram':
				return this._histogramStyle(barIndex, precomputedBars);
		}

		throw new Error('Unknown chart style');
	}

	private _barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result = { ...emptyResult };
		const barStyle = this._series.internalOptions().barStyle;

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

	private _candleStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result = { ...emptyResult };
		const candleStyle = this._series.internalOptions().candleStyle;

		const upColor = candleStyle.upColor;
		const downColor = candleStyle.downColor;
		const borderUpColor = candleStyle.borderUpColor;
		const borderDownColor = candleStyle.borderDownColor;

		const wickUpColor = candleStyle.wickUpColor;
		const wickDownColor = candleStyle.wickDownColor;

		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const isUp = ensure(currentBar.value[SeriesPlotIndex.Open]) <= ensure(currentBar.value[SeriesPlotIndex.Close]);

		result.barColor = isUp ? upColor : downColor;
		result.barBorderColor = isUp ? borderUpColor : borderDownColor;
		result.barWickColor = isUp ? wickUpColor : wickDownColor;

		return result;
	}

	private _areaStyle(): BarColorerStyle {
		const result = { ...emptyResult };
		result.barColor = this._series.internalOptions().areaStyle.lineColor;
		return result;
	}

	private _lineStyle(): BarColorerStyle {
		const result = { ...emptyResult };
		result.barColor = this._series.internalOptions().lineStyle.color;
		return result;
	}

	private _histogramStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result = { ...emptyResult };
		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const colorValue = currentBar.value[SeriesPlotIndex.Color];
		if (colorValue !== undefined && colorValue !== null) {
			const palette = ensureNotNull(this._series.palette());
			result.barColor = palette.colorByIndex(colorValue);
		} else {
			result.barColor = this._series.internalOptions().histogramStyle.color;
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
