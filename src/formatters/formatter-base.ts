import { IPriceFormatter } from './iprice-formatter';

export abstract class FormatterBase implements IPriceFormatter {
	public abstract format(price: number): string;

	public formatTickmarks(prices: readonly number[]): string[] {
		return prices.map((price: number) => this.format(price));
	}
}
