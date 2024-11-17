import { InternalHorzScaleItem } from './ihorz-scale-behavior';
import { TickMarkWeightValue, TimePointIndex, TimeScalePoint } from './time-data';
/**
 * Tick mark for the horizontal scale.
 */
export interface TickMark {
    /** Index */
    index: TimePointIndex;
    /** Time / Coordinate */
    time: InternalHorzScaleItem;
    /** Weight of the tick mark */
    weight: TickMarkWeightValue;
    /** Original value for the `time` property */
    originalTime: unknown;
}
export declare class TickMarks<HorzScaleItem> {
    private _marksByWeight;
    private _cache;
    private _uniformDistribution;
    setUniformDistribution(val: boolean): void;
    setTimeScalePoints(newPoints: readonly TimeScalePoint[], firstChangedPointIndex: number): void;
    build(spacing: number, maxWidth: number): readonly TickMark[];
    private _removeMarksSinceIndex;
    private _buildMarksImpl;
}
