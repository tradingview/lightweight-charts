import { BarPrice } from './bar';

/**
 * A function used to format a {@link BarPrice} as a string.
 */
export type PriceFormatterFn = (priceValue: BarPrice) => string;
