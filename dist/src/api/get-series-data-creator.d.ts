import { SeriesDataItemTypeMap } from '../model/data-consumer';
import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
export declare function getSeriesDataCreator<TSeriesType extends SeriesType, HorzScaleItem>(seriesType: TSeriesType): (plotRow: SeriesPlotRow<TSeriesType>) => SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType];
