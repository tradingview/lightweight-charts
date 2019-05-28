import { PriceFormatter } from './price-formatter';

export class PercentageFormatter extends PriceFormatter {
	public constructor(priceScale: number = 100) {
		super(priceScale);
	}

	public format(price: number, signPositive?: boolean, tailSize?: number, signNegative?: boolean): string {
		return `${super.format(price, signPositive, tailSize, signNegative)}%`;
	}
}
