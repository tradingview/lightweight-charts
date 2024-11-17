import { PlotRow, PlotRowValueIndex } from '../model/plot-data';
import { TimePointIndex } from '../model/time-data';
/**
 * Search direction if no data found at provided index
 */
export declare const enum MismatchDirection {
    /**
     * Search the nearest left item
     */
    NearestLeft = -1,
    /**
     * Do not search
     */
    None = 0,
    /**
     * Search the nearest right item
     */
    NearestRight = 1
}
export interface MinMax {
    min: number;
    max: number;
}
/**
 * PlotList is an array of plot rows
 * each plot row consists of key (index in timescale) and plot value map
 */
export declare class PlotList<PlotRowType extends PlotRow = PlotRow> {
    private _items;
    private _minMaxCache;
    private _rowSearchCache;
    last(): PlotRowType | null;
    firstIndex(): TimePointIndex | null;
    lastIndex(): TimePointIndex | null;
    size(): number;
    isEmpty(): boolean;
    contains(index: TimePointIndex): boolean;
    valueAt(index: TimePointIndex): PlotRowType | null;
    search(index: TimePointIndex, searchMode?: MismatchDirection): PlotRowType | null;
    rows(): readonly PlotRowType[];
    minMaxOnRangeCached(start: TimePointIndex, end: TimePointIndex, plots: readonly PlotRowValueIndex[]): MinMax | null;
    setData(plotRows: readonly PlotRowType[]): void;
    private _indexAt;
    private _valueAt;
    private _search;
    private _searchNearestLeft;
    private _searchNearestRight;
    private _bsearch;
    private _lowerbound;
    private _upperbound;
    private _plotMinMax;
    private _minMaxOnRangeCachedImpl;
}
