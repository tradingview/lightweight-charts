import { BarPrice } from './bar';

/**
 * A function used to format a {@link BarPrice} as a string.
 */
export type PriceFormatterFn = (priceValue: BarPrice) => string;

export type PricesFormatterFn = (priceValue: BarPrice[]) => string[];

/**
 * A function used to format a percentage value as a string.
 */
export type PercentageFormatterFn = (percentageValue: number) => string;

export type PercentagesFormatterFn = (percentageValue: number[]) => string[];
