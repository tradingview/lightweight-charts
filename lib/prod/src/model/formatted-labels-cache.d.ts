import { IHorzScaleBehavior } from './ihorz-scale-behavior';
import { TickMark } from './tick-marks';
export type FormatFunction = (tickMark: TickMark) => string;
export declare class FormattedLabelsCache<HorzScaleItem> {
    private readonly _format;
    private readonly _maxSize;
    private _actualSize;
    private _usageTick;
    private _oldestTick;
    private _cache;
    private _tick2Labels;
    private readonly _horzScaleBehavior;
    constructor(format: FormatFunction, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>, size?: number);
    format(tickMark: TickMark): string;
}
