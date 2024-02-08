import { PriceMark, PriceScale } from './price-scale';
export type CoordinateToLogicalConverter = (x: number, firstValue: number) => number;
export type LogicalToCoordinateConverter = (x: number, firstValue: number, keepItFloat: boolean) => number;
export declare class PriceTickMarkBuilder {
    private _marks;
    private _base;
    private readonly _priceScale;
    private readonly _coordinateToLogicalFunc;
    private readonly _logicalToCoordinateFunc;
    constructor(priceScale: PriceScale, base: number, coordinateToLogicalFunc: CoordinateToLogicalConverter, logicalToCoordinateFunc: LogicalToCoordinateConverter);
    tickSpan(high: number, low: number): number;
    rebuildTickMarks(): void;
    marks(): PriceMark[];
    private _fontHeight;
    private _tickMarkHeight;
}
