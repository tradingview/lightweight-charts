import { isInteger, isNumber } from '../helpers/strict-type-checks';

import { IFormatter } from './iformatter';

export const formatterOptions = {
	decimalSign: '.',
	decimalSignFractional: '\'',
};

// length mustn't be more then 16
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

export class PriceFormatter implements IFormatter {
	protected _fractionalLength: number | undefined;
	private readonly _priceScale: number;
	private readonly _minMove: number;
	private readonly _minMove2: number | undefined;
	private readonly _fractional: boolean | undefined;

	public constructor(priceScale?: number, minMove?: number, fractional?: boolean, minMove2?: number) {
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
		this._minMove2 = minMove2;
		if (fractional && minMove2 !== undefined && minMove2 > 0 && minMove2 !== 2 && minMove2 !== 4 && minMove2 !== 8) {
			return;
		}

		this._fractional = fractional;
		this._calculateDecimal();
	}

	// tailSize > 0 for formatting avg prices
	public format(
		price: number,
		signPositive?: boolean,
		tailSize?: number,
		signNegative: boolean = true
	): string {
		// split price into integer part and fractional
		let sign = '';
		if (price < 0) {
			if (signPositive === true) {
				sign = '\u2212';
			} else if (signNegative === false) {
				sign = '';
			} else {
				sign = '−';
			}
			price = -price;
		} else if (price && signPositive === true) {
			sign = '+';
		}

		let value;

		if (this._fractional) {
			value = sign + this._formatAsFractional(price, tailSize);
		} else {
			value = sign + this._formatAsDecimal(price, tailSize);
		}

		return value;
	}

	private _calculateDecimal(): void {
		// check if this._base is power of 10
		// for double fractional _fractionalLength if for the main fractional only
		this._fractionalLength = 0;
		if (this._priceScale > 0 && this._minMove > 0) {
			let base = this._priceScale;
			if (this._fractional && this._minMove2) {
				base /= this._minMove2;
			}

			while (base > 1) {
				base /= 10;
				this._fractionalLength++;
			}
		}
	}

	private _formatAsDecimal(price: number, tailSize?: number): string {
		let base: number;
		tailSize = tailSize || 0;
		if (this._fractional) {
			// if you really want to format fractional as decimal
			base = Math.pow(10, (this._fractionalLength || 0));
		} else {
			base = Math.pow(10, tailSize) * this._priceScale / this._minMove;
		}

		let intPart = Math.floor(price);

		let fracString = '';
		const fracLength = this._fractionalLength !== undefined ? this._fractionalLength : NaN;
		if (base >= 1) {
			let fracPart = +(Math.round(price * base) - intPart * base).toFixed(this._fractionalLength);
			if (fracPart >= base) {
				fracPart -= base;
				intPart += 1;
			}

			fracString = formatterOptions.decimalSign + numberToStringWithLeadingZero(+fracPart.toFixed(this._fractionalLength) * this._minMove, fracLength + tailSize);

			// remove ending 0 but not more then tailSize
			fracString = this._removeEndingZeros(fracString, tailSize);
		} else {
			// should round int part to minmov
			intPart = Math.round(intPart * base) / base;
			// if minmov > 1, fractional part is always = 0
			if (fracLength > 0) {
				fracString = formatterOptions.decimalSign + numberToStringWithLeadingZero(0, fracLength + tailSize);
			}
		}

		return intPart.toFixed(0) + fracString;
	}

	private _formatAsFractional(price: number, tailSize?: number): string {
		// temporary solution - use decimal format with 2 digits
		const base = this._priceScale / this._minMove;
		let intPart = Math.floor(price);
		let fracPart = tailSize ?
			Math.floor(price * base) - intPart * base :
			Math.round(price * base) - intPart * base;

		if (fracPart === base) {
			fracPart = 0;
			intPart += 1;
		}

		let tailStr = '';
		if (tailSize) {
			let tail = (price - intPart - fracPart / base) * base;
			tail = Math.round(tail * Math.pow(10, tailSize));
			tailStr = numberToStringWithLeadingZero(tail, tailSize);
			tailStr = this._removeEndingZeros(tailStr, tailSize);
		}

		if (!this._fractionalLength) {
			throw new Error('_fractionalLength is not calculated');
		}

		let fracString = '';
		if (this._minMove2) {
			const minmove2 = ['0', '5'];
			const minmove4 = ['0', '2', '5', '7'];
			const minmove8 = ['0', '1', '2', '3', '4', '5', '6', '7'];

			// format double fractional
			const secondFract = fracPart % this._minMove2;

			fracPart = (fracPart - secondFract) / this._minMove2;

			const part1 = numberToStringWithLeadingZero(fracPart, this._fractionalLength);
			const part2 = this._minMove2 === 2 ?
				minmove2[secondFract] :
				this._minMove2 === 8 ?
					minmove8[secondFract] :
					minmove4[secondFract];
			fracString = part1 + formatterOptions.decimalSignFractional + part2;
		} else {
			fracString = numberToStringWithLeadingZero(fracPart * this._minMove, this._fractionalLength);
		}

		return intPart.toString() + formatterOptions.decimalSignFractional + fracString + tailStr;
	}

	private _removeEndingZeros(str: string, limit: number): string {
		for (let i = 0; i < limit; i++) {
			if (str[str.length - 1] === '0') {
				str = str.substr(0, str.length - 1);
			} else {
				break;
			}
		}

		return str;
	}
}
