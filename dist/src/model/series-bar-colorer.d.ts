import { Series } from './series';
import { SeriesPlotRow } from './series-data';
import { SeriesType } from './series-options';
import { TimePointIndex } from './time-data';
export interface PrecomputedBars {
    value: SeriesPlotRow;
    previousValue?: SeriesPlotRow;
}
export interface CommonBarColorerStyle {
    barColor: string;
}
export interface LineStrokeColorerStyle {
    lineColor: string;
}
export interface LineBarColorerStyle extends CommonBarColorerStyle, LineStrokeColorerStyle {
}
export interface HistogramBarColorerStyle extends CommonBarColorerStyle {
}
export interface AreaFillColorerStyle {
    topColor: string;
    bottomColor: string;
}
export interface AreaBarColorerStyle extends CommonBarColorerStyle, AreaFillColorerStyle, LineStrokeColorerStyle {
}
export interface BaselineStrokeColorerStyle {
    topLineColor: string;
    bottomLineColor: string;
}
export interface BaselineFillColorerStyle {
    topFillColor1: string;
    topFillColor2: string;
    bottomFillColor2: string;
    bottomFillColor1: string;
}
export interface BaselineBarColorerStyle extends CommonBarColorerStyle, BaselineStrokeColorerStyle, BaselineFillColorerStyle {
}
export interface BarColorerStyle extends CommonBarColorerStyle {
}
export interface CandlesticksColorerStyle extends CommonBarColorerStyle {
    barBorderColor: string;
    barWickColor: string;
}
export interface CustomBarColorerStyle extends CommonBarColorerStyle {
}
export interface BarStylesMap {
    Bar: BarColorerStyle;
    Candlestick: CandlesticksColorerStyle;
    Area: AreaBarColorerStyle;
    Baseline: BaselineBarColorerStyle;
    Line: LineBarColorerStyle;
    Histogram: HistogramBarColorerStyle;
    Custom: CustomBarColorerStyle;
}
export interface ISeriesBarColorer<T extends SeriesType> {
    barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarStylesMap[T];
}
export declare class SeriesBarColorer<T extends SeriesType> implements ISeriesBarColorer<T> {
    private _series;
    private readonly _styleGetter;
    constructor(series: Series<T>);
    barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarStylesMap[T];
    private _findBar;
}
