import { InternalHorzScaleItem } from './ihorz-scale-behavior';
import { TimePointIndex } from './time-data';
/**
 * Plot's index in plot list tuple for series
 */
export declare const enum PlotRowValueIndex {
    Open = 0,
    High = 1,
    Low = 2,
    Close = 3
}
export type PlotRowValue = [
    number,
    number,
    number,
    number
];
export interface PlotRow {
    readonly index: TimePointIndex;
    readonly time: InternalHorzScaleItem;
    readonly originalTime: unknown;
    readonly value: PlotRowValue;
    readonly customValues?: Record<string, unknown>;
}
