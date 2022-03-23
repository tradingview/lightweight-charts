import { isInteger, isNumber } from '../helpers/strict-type-checks';

import { IPriceFormatter } from './iprice-formatter';

const formatterOptions = {
	decimalSign: '.',
	decimalSignFractional: '\'',
};

/**
 * @param value - The number of convert.
 * @param length - The length. Must be between 0 and 16 inclusive.
 */
export function numberToStringWithLeadingZero(value: number, length: number): string {
	if (!isNumber(value)) {
		return 'n/a';
	}

	if (!isInteger(length)) {
		throw new TypeError('invalid length');
	}

	if (length < 0 || length > 16) {
		throw new TypeError('invalid length');
	}

	if (length === 0) {
		return value.toString();
	}

	const dummyString = '0000000000000000';
	return (dummyString + value.toString()).slice(-length);
}

export class PriceFormatter implements IPriceFormatter {
	protected _fractionalLength: number | undefined;
	private readonly _priceScale: number;
	private readonly _minMove: number;

	public constructor(priceScale?: number, minMove?: number) {
		if (!minMove) {
			minMove = 1;
		}

		if (!isNumber(priceScale) || !isInteger(priceScale)) {
			priceScale = 100;
		}

		if (priceScale < 0) {
			throw new TypeError('invalid base');
		}

		this._priceScale = priceScale;
		this._minMove = minMove;

		this._calculateDecimal();
	}

	public format(price: number): string {
		// \u2212 is unicode's minus sign https://www.fileformat.info/info/unicode/char/2212/index.htm
		// we should use it because it has the same width as plus sign +
		const sign = price < 0 ? '\u2212' : '';
		price = Math.abs(price);

		return sign + this._formatAsDecimal(price);
	}

	private _calculateDecimal(): void {
		// check if this._base is power of 10
		// for double fractional _fractionalLength if for the main fractional only
		this._fractionalLength = 0;
		if (this._priceScale > 0 && this._minMove > 0) {
			let base = this._priceScale;

			while (base > 1) {
				base /= 10;
				this._fractionalLength++;
			}
		}
	}

	private _formatAsDecimal(price: number): string {
		const base = this._priceScale / this._minMove;

		let intPart = Math.floor(price);

		let fracString = '';
		const fracLength = this._fractionalLength !== undefined ? this._fractionalLength : NaN;
		if (base > 1) {
			let fracPart = +(Math.round(price * base) - intPart * base).toFixed(this._fractionalLength);
			if (fracPart >= base) {
				fracPart -= base;
				intPart += 1;
			}

			fracString = formatterOptions.decimalSign + numberToStringWithLeadingZero(+fracPart.toFixed(this._fractionalLength) * this._minMove, fracLength);
		} else {
			// should round int part to min move
			intPart = Math.round(intPart * base) / base;
			// if min move > 1, fractional part is always = 0
			if (fracLength > 0) {
				fracString = formatterOptions.decimalSign + numberToStringWithLeadingZero(0, fracLength);
			}
		}

		return intPart.toFixed(0) + fracString;
	}
}
