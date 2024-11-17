import { LogicalRange } from '../model/time-data';
export declare const enum InvalidationLevel {
    None = 0,
    Cursor = 1,
    Light = 2,
    Full = 3
}
export interface PaneInvalidation {
    level: InvalidationLevel;
    autoScale?: boolean;
}
export declare const enum TimeScaleInvalidationType {
    FitContent = 0,
    ApplyRange = 1,
    ApplyBarSpacing = 2,
    ApplyRightOffset = 3,
    Reset = 4,
    Animation = 5,
    StopAnimation = 6
}
export interface TimeScaleApplyRangeInvalidation {
    type: TimeScaleInvalidationType.ApplyRange;
    value: LogicalRange;
}
export interface TimeScaleFitContentInvalidation {
    type: TimeScaleInvalidationType.FitContent;
}
export interface TimeScaleApplyRightOffsetInvalidation {
    type: TimeScaleInvalidationType.ApplyRightOffset;
    value: number;
}
export interface TimeScaleApplyBarSpacingInvalidation {
    type: TimeScaleInvalidationType.ApplyBarSpacing;
    value: number;
}
export interface TimeScaleResetInvalidation {
    type: TimeScaleInvalidationType.Reset;
}
export interface ITimeScaleAnimation {
    getPosition(time: number): number;
    finished(time: number): boolean;
}
export interface StartTimeScaleAnimationInvalidation {
    type: TimeScaleInvalidationType.Animation;
    value: ITimeScaleAnimation;
}
export interface StopTimeScaleAnimationInvalidation {
    type: TimeScaleInvalidationType.StopAnimation;
}
export type TimeScaleInvalidation = TimeScaleApplyRangeInvalidation | TimeScaleFitContentInvalidation | TimeScaleApplyRightOffsetInvalidation | TimeScaleApplyBarSpacingInvalidation | TimeScaleResetInvalidation | StartTimeScaleAnimationInvalidation | StopTimeScaleAnimationInvalidation;
export declare class InvalidateMask {
    private _invalidatedPanes;
    private _globalLevel;
    private _timeScaleInvalidations;
    constructor(globalLevel: InvalidationLevel);
    invalidatePane(paneIndex: number, invalidation: PaneInvalidation): void;
    fullInvalidation(): InvalidationLevel;
    invalidateForPane(paneIndex: number): PaneInvalidation;
    setFitContent(): void;
    applyRange(range: LogicalRange): void;
    setTimeScaleAnimation(animation: ITimeScaleAnimation): void;
    stopTimeScaleAnimation(): void;
    resetTimeScale(): void;
    setBarSpacing(barSpacing: number): void;
    setRightOffset(offset: number): void;
    timeScaleInvalidations(): readonly TimeScaleInvalidation[];
    merge(other: InvalidateMask): void;
    static light(): InvalidateMask;
    static full(): InvalidateMask;
    private _applyTimeScaleInvalidation;
    private _removeTimeScaleAnimation;
}
