import { min } from '../helpers/mathex';
import { PriceTickSpanCalculator } from './price-tick-span-calculator';
const TICK_DENSITY = 2.5;
export class PriceTickMarkBuilder {
    constructor(priceScale, base, coordinateToLogicalFunc, logicalToCoordinateFunc) {
        this._private__marks = [];
        this._private__priceScale = priceScale;
        this._private__base = base;
        this._private__coordinateToLogicalFunc = coordinateToLogicalFunc;
        this._private__logicalToCoordinateFunc = logicalToCoordinateFunc;
    }
    _internal_tickSpan(high, low) {
        if (high < low) {
            throw new Error('high < low');
        }
        const scaleHeight = this._private__priceScale._internal_height();
        const markHeight = this._private__tickMarkHeight();
        const maxTickSpan = (high - low) * markHeight / scaleHeight;
        const spanCalculator1 = new PriceTickSpanCalculator(this._private__base, [2, 2.5, 2]);
        const spanCalculator2 = new PriceTickSpanCalculator(this._private__base, [2, 2, 2.5]);
        const spanCalculator3 = new PriceTickSpanCalculator(this._private__base, [2.5, 2, 2]);
        const spans = [];
        spans.push(spanCalculator1._internal_tickSpan(high, low, maxTickSpan), spanCalculator2._internal_tickSpan(high, low, maxTickSpan), spanCalculator3._internal_tickSpan(high, low, maxTickSpan));
        return min(spans);
    }
    _internal_rebuildTickMarks() {
        const priceScale = this._private__priceScale;
        const firstValue = priceScale._internal_firstValue();
        if (firstValue === null) {
            this._private__marks = [];
            return;
        }
        const scaleHeight = priceScale._internal_height();
        const bottom = this._private__coordinateToLogicalFunc(scaleHeight - 1, firstValue);
        const top = this._private__coordinateToLogicalFunc(0, firstValue);
        const extraTopBottomMargin = this._private__priceScale._internal_options().entireTextOnly ? this._private__fontHeight() / 2 : 0;
        const minCoord = extraTopBottomMargin;
        const maxCoord = scaleHeight - 1 - extraTopBottomMargin;
        const high = Math.max(bottom, top);
        const low = Math.min(bottom, top);
        if (high === low) {
            this._private__marks = [];
            return;
        }
        let span = this._internal_tickSpan(high, low);
        let mod = high % span;
        mod += mod < 0 ? span : 0;
        const sign = (high >= low) ? 1 : -1;
        let prevCoord = null;
        let targetIndex = 0;
        for (let logical = high - mod; logical > low; logical -= span) {
            const coord = this._private__logicalToCoordinateFunc(logical, firstValue, true);
            // check if there is place for it
            // this is required for log scale
            if (prevCoord !== null && Math.abs(coord - prevCoord) < this._private__tickMarkHeight()) {
                continue;
            }
            // check if a tick mark is partially visible and skip it if entireTextOnly is true
            if (coord < minCoord || coord > maxCoord) {
                continue;
            }
            if (targetIndex < this._private__marks.length) {
                this._private__marks[targetIndex]._internal_coord = coord;
                this._private__marks[targetIndex]._internal_label = priceScale._internal_formatLogical(logical);
            }
            else {
                this._private__marks.push({
                    _internal_coord: coord,
                    _internal_label: priceScale._internal_formatLogical(logical),
                });
            }
            targetIndex++;
            prevCoord = coord;
            if (priceScale._internal_isLog()) {
                // recalc span
                span = this._internal_tickSpan(logical * sign, low);
            }
        }
        this._private__marks.length = targetIndex;
    }
    _internal_marks() {
        return this._private__marks;
    }
    _private__fontHeight() {
        return this._private__priceScale._internal_fontSize();
    }
    _private__tickMarkHeight() {
        return Math.ceil(this._private__fontHeight() * TICK_DENSITY);
    }
}
