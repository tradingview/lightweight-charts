export class VolumeFormatter {
    constructor(precision) {
        this._private__precision = precision;
    }
    format(vol) {
        let sign = '';
        if (vol < 0) {
            sign = '-';
            vol = -vol;
        }
        if (vol < 995) {
            return sign + this._private__formatNumber(vol);
        }
        else if (vol < 999995) {
            return sign + this._private__formatNumber(vol / 1000) + 'K';
        }
        else if (vol < 999999995) {
            vol = 1000 * Math.round(vol / 1000);
            return sign + this._private__formatNumber(vol / 1000000) + 'M';
        }
        else {
            vol = 1000000 * Math.round(vol / 1000000);
            return sign + this._private__formatNumber(vol / 1000000000) + 'B';
        }
    }
    _private__formatNumber(value) {
        let res;
        const priceScale = Math.pow(10, this._private__precision);
        value = Math.round(value * priceScale) / priceScale;
        if (value >= 1e-15 && value < 1) {
            res = value.toFixed(this._private__precision).replace(/\.?0+$/, ''); // regex removes trailing zeroes
        }
        else {
            res = String(value);
        }
        return res.replace(/(\.[1-9]*)0+$/, (e, p1) => p1);
    }
}
