import { PriceFormatter } from './price-formatter';

const tryCutFractionalZerosRegExp = /\.0+%$/;

export class PercentageFormatter extends PriceFormatter {
	public constructor(priceScale: number = 100) {
		super(priceScale);
	}

	public override format(price: number): string {
		return `${super.format(price)}%`;
	}

	public override tryCutFractionalZeros(label: string): string {
		const result = label.replace(tryCutFractionalZerosRegExp, '');
		return result === label ? result : `${result}%`;
	}
}
