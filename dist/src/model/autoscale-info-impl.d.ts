import { PriceRangeImpl } from './price-range-impl';
import { AutoscaleInfo } from './series-options';
/**
 * Represents the margin used when updating a price scale.
 */
export interface AutoScaleMargins {
    /** The number of pixels for bottom margin */
    below: number;
    /** The number of pixels for top margin */
    above: number;
}
export declare class AutoscaleInfoImpl {
    private readonly _priceRange;
    private readonly _margins;
    constructor(priceRange: PriceRangeImpl | null, margins?: AutoScaleMargins | null);
    priceRange(): PriceRangeImpl | null;
    margins(): AutoScaleMargins | null;
    toRaw(): AutoscaleInfo | null;
    static fromRaw(raw: AutoscaleInfo | null): AutoscaleInfoImpl | null;
}
