import { min } from '../helpers/mathex';
import { PriceTickSpanCalculator } from './price-tick-span-calculator';
const TICK_DENSITY = 2.5;
export class PriceTickMarkBuilder {
    constructor(priceScale, base, coordinateToLogicalFunc, logicalToCoordinateFunc) {
        this._marks = [];
        this._priceScale = priceScale;
        this._base = base;
        this._coordinateToLogicalFunc = coordinateToLogicalFunc;
        this._logicalToCoordinateFunc = logicalToCoordinateFunc;
    }
    tickSpan(high, low) {
        if (high < low) {
            throw new Error('high < low');
        }
        const scaleHeight = this._priceScale.height();
        const markHeight = this._tickMarkHeight();
        const maxTickSpan = (high - low) * markHeight / scaleHeight;
        const spanCalculator1 = new PriceTickSpanCalculator(this._base, [2, 2.5, 2]);
        const spanCalculator2 = new PriceTickSpanCalculator(this._base, [2, 2, 2.5]);
        const spanCalculator3 = new PriceTickSpanCalculator(this._base, [2.5, 2, 2]);
        const spans = [];
        spans.push(spanCalculator1.tickSpan(high, low, maxTickSpan), spanCalculator2.tickSpan(high, low, maxTickSpan), spanCalculator3.tickSpan(high, low, maxTickSpan));
        return min(spans);
    }
    rebuildTickMarks() {
        const priceScale = this._priceScale;
        const firstValue = priceScale.firstValue();
        if (firstValue === null) {
            this._marks = [];
            return;
        }
        const scaleHeight = priceScale.height();
        const bottom = this._coordinateToLogicalFunc(scaleHeight - 1, firstValue);
        const top = this._coordinateToLogicalFunc(0, firstValue);
        const extraTopBottomMargin = this._priceScale.options().entireTextOnly ? this._fontHeight() / 2 : 0;
        const minCoord = extraTopBottomMargin;
        const maxCoord = scaleHeight - 1 - extraTopBottomMargin;
        const high = Math.max(bottom, top);
        const low = Math.min(bottom, top);
        if (high === low) {
            this._marks = [];
            return;
        }
        let span = this.tickSpan(high, low);
        let mod = high % span;
        mod += mod < 0 ? span : 0;
        const sign = (high >= low) ? 1 : -1;
        let prevCoord = null;
        let targetIndex = 0;
        for (let logical = high - mod; logical > low; logical -= span) {
            const coord = this._logicalToCoordinateFunc(logical, firstValue, true);
            // check if there is place for it
            // this is required for log scale
            if (prevCoord !== null && Math.abs(coord - prevCoord) < this._tickMarkHeight()) {
                continue;
            }
            // check if a tick mark is partially visible and skip it if entireTextOnly is true
            if (coord < minCoord || coord > maxCoord) {
                continue;
            }
            if (targetIndex < this._marks.length) {
                this._marks[targetIndex].coord = coord;
                this._marks[targetIndex].label = priceScale.formatLogical(logical);
            }
            else {
                this._marks.push({
                    coord: coord,
                    label: priceScale.formatLogical(logical),
                });
            }
            targetIndex++;
            prevCoord = coord;
            if (priceScale.isLog()) {
                // recalc span
                span = this.tickSpan(logical * sign, low);
            }
        }
        this._marks.length = targetIndex;
    }
    marks() {
        return this._marks;
    }
    _fontHeight() {
        return this._priceScale.fontSize();
    }
    _tickMarkHeight() {
        return Math.ceil(this._fontHeight() * TICK_DENSITY);
    }
}
