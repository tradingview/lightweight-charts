import { RangeImpl } from './range-impl';
import { Logical, TimePointIndex } from './time-data';
export declare class TimeScaleVisibleRange {
    private readonly _logicalRange;
    constructor(logicalRange: RangeImpl<Logical> | null);
    strictRange(): RangeImpl<TimePointIndex> | null;
    logicalRange(): RangeImpl<Logical> | null;
    static invalid(): TimeScaleVisibleRange;
}
