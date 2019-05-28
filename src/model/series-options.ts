import { DeepPartial } from '../helpers/strict-type-checks';

import { LineStyle, LineWidth } from '../renderers/draw-line';

export type SeriesType = 'Bar' | 'Candle' | 'Area' | 'Line' | 'Histogram';

export interface CandleStyleOptions {
	upColor: string;
	downColor: string;
	wickVisible: boolean;
	borderVisible: boolean;
	borderColor: string;
	borderUpColor: string;
	borderDownColor: string;
	wickColor: string;
	wickUpColor: string;
	wickDownColor: string;
}

export function fillUpDownCandlesColors(options: DeepPartial<CandleStyleOptions>): void {
	if (options.borderColor !== undefined) {
		options.borderUpColor = options.borderColor;
		options.borderDownColor = options.borderColor;
	}
	if (options.wickColor !== undefined) {
		options.wickUpColor = options.wickColor;
		options.wickDownColor = options.wickColor;
	}
}

export interface BarStyleOptions {
	upColor: string;
	downColor: string;
	openVisible: boolean;
	thinBars: boolean;
}

export interface LineStyleOptions {
	color: string;
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	crossHairMarkerVisible: boolean;
	crossHairMarkerRadius: number;
}

export interface AreaStyleOptions {
	topColor: string;
	bottomColor: string;
	lineColor: string;
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	crossHairMarkerVisible: boolean;
	crossHairMarkerRadius: number;
}

export interface HistogramStyleOptions {
	color: string;
	base: number;
	lineWidth: number;
}

export interface PriceFormat {
	type: 'price' | 'volume' | 'percent';
	precision: number;
	minMove: number;
}

export function precisionByMinMove(minMove: number): number {
	if (minMove >= 1) {
		return 0;
	}
	let i = 0;
	for (; i < 8; i++) {
		const intPart = Math.round(minMove);
		const fractPart = Math.abs(intPart - minMove);
		if (fractPart < 1e-8) {
			return i;
		}
		minMove = minMove * 10;
	}
	return i;
}

export const enum PriceAxisLastValueMode {
	LastPriceAndPercentageValue,
	LastValueAccordingToScale,
}

export interface SeriesOptionsBase {
	priceLineVisible: boolean;
	lastValueVisible: boolean;
	/**
	 * @internal
	 */
	seriesLastValueMode?: PriceAxisLastValueMode;
	priceLineWidth: LineWidth;
	priceLineColor: string;
	priceFormat: PriceFormat;
	baseLineColor: string;
}

export interface CandleSeriesOptions extends SeriesOptionsBase {
	candleStyle: CandleStyleOptions;
}

export interface BarSeriesOptions extends SeriesOptionsBase {
	barStyle: BarStyleOptions;
}

export interface LineSeriesOptions extends SeriesOptionsBase {
	lineStyle: LineStyleOptions;
}

export interface AreaSeriesOptions extends SeriesOptionsBase {
	areaStyle: AreaStyleOptions;
}

export interface HistogramSeriesOptions extends SeriesOptionsBase {
	histogramStyle: HistogramStyleOptions;
}

export type SeriesOptions = CandleSeriesOptions & BarSeriesOptions & LineSeriesOptions & AreaSeriesOptions & HistogramSeriesOptions;
