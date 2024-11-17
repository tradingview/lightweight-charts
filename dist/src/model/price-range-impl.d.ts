import { PriceRange } from './series-options';
export declare class PriceRangeImpl {
    private _minValue;
    private _maxValue;
    constructor(minValue: number, maxValue: number);
    equals(pr: PriceRangeImpl | null): boolean;
    clone(): PriceRangeImpl;
    minValue(): number;
    maxValue(): number;
    length(): number;
    isEmpty(): boolean;
    merge(anotherRange: PriceRangeImpl | null): PriceRangeImpl;
    scaleAroundCenter(coeff: number): void;
    shift(delta: number): void;
    toRaw(): PriceRange;
    static fromRaw(raw: PriceRange | null): PriceRangeImpl | null;
}
