import { PriceLineOptions } from '../model/price-line-options';

export interface IPriceLine {
	applyOptions(options: Partial<PriceLineOptions>): void;
	options(): Readonly<PriceLineOptions>;
}
