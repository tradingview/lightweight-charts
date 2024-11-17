import { CustomPriceLine } from '../model/custom-price-line';
import { PriceLineOptions } from '../model/price-line-options';
import { IPriceLine } from './iprice-line';
export declare class PriceLine implements IPriceLine {
    private readonly _priceLine;
    constructor(priceLine: CustomPriceLine);
    applyOptions(options: Partial<PriceLineOptions>): void;
    options(): Readonly<PriceLineOptions>;
    priceLine(): CustomPriceLine;
}
