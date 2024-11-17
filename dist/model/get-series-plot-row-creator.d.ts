import { Mutable } from '../helpers/mutable';
import { CustomData } from '../model/icustom-series';
import { PlotRow } from '../model/plot-data';
import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { TimePointIndex } from '../model/time-data';
import { SeriesDataItemTypeMap, WhitespaceData } from './data-consumer';
import { InternalHorzScaleItem } from './ihorz-scale-behavior';
export type CustomDataToPlotRowValueConverter<HorzScaleItem> = (item: CustomData<HorzScaleItem> | WhitespaceData) => number[];
export type WhitespacePlotRow = Omit<PlotRow, 'value'>;
export declare function isSeriesPlotRow(row: SeriesPlotRow | WhitespacePlotRow): row is SeriesPlotRow;
type SeriesItemValueFnMap<HorzScaleItem> = {
    [T in keyof SeriesDataItemTypeMap]: (time: InternalHorzScaleItem, index: TimePointIndex, item: SeriesDataItemTypeMap<HorzScaleItem>[T], originalTime: HorzScaleItem, dataToPlotRow?: CustomDataToPlotRowValueConverter<HorzScaleItem>, customIsWhitespace?: WhitespaceCheck<HorzScaleItem>) => Mutable<SeriesPlotRow<T> | WhitespacePlotRow>;
};
export type WhitespaceCheck<HorzScaleItem> = (bar: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]) => bar is WhitespaceData<HorzScaleItem>;
export declare function getSeriesPlotRowCreator<TSeriesType extends SeriesType, HorzScaleItem>(seriesType: TSeriesType): SeriesItemValueFnMap<HorzScaleItem>[TSeriesType];
export {};
