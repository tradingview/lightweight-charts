import { PriceFormatter } from './price-formatter';
export declare class PercentageFormatter extends PriceFormatter {
    constructor(priceScale?: number);
    format(price: number): string;
}
