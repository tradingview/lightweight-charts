export declare class RangeImpl<T extends number> {
    private readonly _left;
    private readonly _right;
    constructor(left: T, right: T);
    left(): T;
    right(): T;
    count(): number;
    contains(index: T): boolean;
    equals(other: RangeImpl<T>): boolean;
}
export declare function areRangesEqual<T extends number>(first: RangeImpl<T> | null, second: RangeImpl<T> | null): boolean;
