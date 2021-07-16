import { IPriceFormatter } from './iprice-formatter';

export class VolumeFormatter implements IPriceFormatter {
	private readonly _precision: number;

	public constructor(precision: number) {
		this._precision = precision;
	}

	public format(vol: number): string {
		let sign = '';
		if (vol < 0) {
			sign = '-';
			vol = -vol;
		}

		if (vol < 995) {
			return sign + this._formatNumber(vol);
		} else if (vol < 999995) {
			return sign + this._formatNumber(vol / 1000) + 'K';
		} else if (vol < 999999995) {
			vol = 1000 * Math.round(vol / 1000);
			return sign + this._formatNumber(vol / 1000000) + 'M';
		} else {
			vol = 1000000 * Math.round(vol / 1000000);
			return sign + this._formatNumber(vol / 1000000000) + 'B';
		}
	}

	private _formatNumber(value: number): string {
		let res: string;
		const priceScale = Math.pow(10, this._precision);
		value = Math.round(value * priceScale) / priceScale;
		if (value >= 1e-15 && value < 1) {
			res = value.toFixed(this._precision).replace(/\.?0+$/, ''); // regex removes trailing zeroes
		} else {
			res = String(value);
		}
		return res.replace(/(\.[1-9]*)0+$/, (e: string, p1: string): string => p1);
	}
}
