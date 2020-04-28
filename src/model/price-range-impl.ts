import { isNumber } from '../helpers/strict-type-checks';

import { PriceRange } from './series-options';

export class PriceRangeImpl {
	private _minValue: number;
	private _maxValue!: number;

	public constructor(minValue: number, maxValue: number) {
		this._minValue = minValue;
		this._maxValue = maxValue;
	}

	public equals(pr: PriceRangeImpl | null): boolean {
		if (pr === null) {
			return false;
		}
		return this._minValue === pr._minValue && this._maxValue === pr._maxValue;
	}

	public clone(): PriceRangeImpl {
		return new PriceRangeImpl(this._minValue, this._maxValue);
	}

	public minValue(): number {
		return this._minValue;
	}

	public setMinValue(v: number): void {
		this._minValue = v;
	}

	public maxValue(): number {
		return this._maxValue;
	}

	public setMaxValue(v: number): void {
		this._maxValue = v;
	}

	public length(): number {
		return this._maxValue - this._minValue;
	}

	public isEmpty(): boolean {
		return this._maxValue === this._minValue || Number.isNaN(this._maxValue) || Number.isNaN(this._minValue);
	}

	public merge(anotherRange: PriceRangeImpl | null): PriceRangeImpl {
		if (anotherRange === null) {
			return this;
		}
		return new PriceRangeImpl(
			Math.min(this.minValue(), anotherRange.minValue()),
			Math.max(this.maxValue(), anotherRange.maxValue())
		);
	}

	public apply(min: number, max: number): void {
		this._minValue = Math.min(this._minValue, min);
		this._maxValue = Math.max(this._maxValue, max);
	}

	public set(min: number, max: number): void {
		this._minValue = min;
		this._maxValue = max;
	}

	public scaleAroundCenter(coeff: number): void {
		if (!isNumber(coeff)) {
			return;
		}

		const delta = this._maxValue - this._minValue;
		if (delta === 0) {
			return;
		}

		const center = (this._maxValue + this._minValue) * 0.5;
		let maxDelta = this._maxValue - center;
		let minDelta = this._minValue - center;
		maxDelta *= coeff;
		minDelta *= coeff;
		this._maxValue = center + maxDelta;
		this._minValue = center + minDelta;
	}

	public shift(delta: number): void {
		if (!isNumber(delta)) {
			return;
		}

		this._maxValue += delta;
		this._minValue += delta;
	}

	public containsStrictly(priceRange: PriceRangeImpl): boolean {
		return priceRange.minValue() > this._minValue &&
			priceRange.maxValue() < this._maxValue;
	}

	public toRaw(): PriceRange {
		return {
			minValue: this._minValue,
			maxValue: this._maxValue,
		};
	}

	public static fromRaw(raw: PriceRange | null): PriceRangeImpl | null {
		return (raw === null) ? null : new PriceRangeImpl(raw.minValue, raw.maxValue);
	}
}
