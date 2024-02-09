import { Mutable } from '../helpers/mutable';
import { SeriesDataItemTypeMap } from './data-consumer';
import { WhitespacePlotRow } from './get-series-plot-row-creator';
import { IHorzScaleBehavior, InternalHorzScaleItem } from './ihorz-scale-behavior';
import { Series, SeriesUpdateInfo } from './series';
import { SeriesPlotRow } from './series-data';
import { SeriesType } from './series-options';
import { TimePointIndex, TimeScalePoint } from './time-data';
export type TimedData<HorzScaleItem> = Pick<SeriesDataItemTypeMap<HorzScaleItem>[SeriesType], 'time'>;
export interface TimeScaleChanges {
    /**
     * An index of the first changed time scale point by any type of change (time, weight, etc)
     */
    firstChangedPointIndex?: TimePointIndex;
    /**
     * An array of the new time scale points
     */
    points?: readonly TimeScalePoint[];
    /**
     * In terms of time scale "base index" means the latest time scale point with data (there might be whitespaces)
     */
    baseIndex: TimePointIndex | null;
}
export interface SeriesChanges {
    /**
     * Data to be merged into series' plot list
     */
    data: readonly SeriesPlotRow<SeriesType>[];
    /**
     * Additional info about this change
     */
    info?: SeriesUpdateInfo;
}
export interface DataUpdateResponse {
    /**
     * Contains updates for all _changed_ series (if series data doesn't changed then it will not be here)
     */
    series: Map<Series<SeriesType>, SeriesChanges>;
    /**
     * Contains optional time scale points
     */
    timeScale: TimeScaleChanges;
}
interface TimePointData {
    index: TimePointIndex;
    timePoint: InternalHorzScaleItem;
    mapping: Map<Series<SeriesType>, Mutable<SeriesPlotRow<SeriesType> | WhitespacePlotRow>>;
}
export interface InternalTimeScalePoint extends Mutable<TimeScalePoint> {
    pointData: TimePointData;
}
export declare class DataLayer<HorzScaleItem> {
    private _pointDataByTimePoint;
    private _seriesRowsBySeries;
    private _seriesLastTimePoint;
    private _sortedTimePoints;
    private readonly _horzScaleBehavior;
    constructor(horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>);
    destroy(): void;
    setSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType][]): DataUpdateResponse;
    removeSeries(series: Series<SeriesType>): DataUpdateResponse;
    updateSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]): DataUpdateResponse;
    private _updateLastSeriesRow;
    private _setRowsToSeries;
    private _cleanupPointsData;
    /**
     * Sets new time scale and make indexes valid for all series
     *
     * @returns The index of the first changed point or `-1` if there is no change.
     */
    private _replaceTimeScalePoints;
    private _getBaseIndex;
    private _getUpdateResponse;
}
export {};
