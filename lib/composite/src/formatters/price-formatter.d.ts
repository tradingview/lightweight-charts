import { IPriceFormatter } from './iprice-formatter';
/**
 * @param value - The number of convert.
 * @param length - The length. Must be between 0 and 16 inclusive.
 */
export declare function numberToStringWithLeadingZero(value: number, length: number): string;
export declare class PriceFormatter implements IPriceFormatter {
    protected _fractionalLength: number | undefined;
    private readonly _priceScale;
    private readonly _minMove;
    constructor(priceScale?: number, minMove?: number);
    format(price: number): string;
    private _calculateDecimal;
    private _formatAsDecimal;
}
