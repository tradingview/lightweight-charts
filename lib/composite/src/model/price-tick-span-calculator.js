"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceTickSpanCalculator = void 0;
const mathex_1 = require("../helpers/mathex");
var Constants;
(function (Constants) {
    Constants[Constants["TickSpanEpsilon"] = 1e-14] = "TickSpanEpsilon";
})(Constants || (Constants = {}));
class PriceTickSpanCalculator {
    constructor(base, integralDividers) {
        this._base = base;
        this._integralDividers = integralDividers;
        if ((0, mathex_1.isBaseDecimal)(this._base)) {
            this._fractionalDividers = [2, 2.5, 2];
        }
        else {
            this._fractionalDividers = [];
            for (let baseRest = this._base; baseRest !== 1;) {
                if ((baseRest % 2) === 0) {
                    this._fractionalDividers.push(2);
                    baseRest /= 2;
                }
                else if ((baseRest % 5) === 0) {
                    this._fractionalDividers.push(2, 2.5);
                    baseRest /= 5;
                }
                else {
                    throw new Error('unexpected base');
                }
                if (this._fractionalDividers.length > 100) {
                    throw new Error('something wrong with base');
                }
            }
        }
    }
    tickSpan(high, low, maxTickSpan) {
        const minMovement = (this._base === 0) ? (0) : (1 / this._base);
        let resultTickSpan = Math.pow(10, Math.max(0, Math.ceil(Math.log10(high - low))));
        let index = 0;
        let c = this._integralDividers[0];
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // the second part is actual for small with very small values like 1e-10
            // greaterOrEqual fails for such values
            const resultTickSpanLargerMinMovement = (0, mathex_1.greaterOrEqual)(resultTickSpan, minMovement, 1e-14 /* Constants.TickSpanEpsilon */) && resultTickSpan > (minMovement + 1e-14 /* Constants.TickSpanEpsilon */);
            const resultTickSpanLargerMaxTickSpan = (0, mathex_1.greaterOrEqual)(resultTickSpan, maxTickSpan * c, 1e-14 /* Constants.TickSpanEpsilon */);
            const resultTickSpanLarger1 = (0, mathex_1.greaterOrEqual)(resultTickSpan, 1, 1e-14 /* Constants.TickSpanEpsilon */);
            const haveToContinue = resultTickSpanLargerMinMovement && resultTickSpanLargerMaxTickSpan && resultTickSpanLarger1;
            if (!haveToContinue) {
                break;
            }
            resultTickSpan /= c;
            c = this._integralDividers[++index % this._integralDividers.length];
        }
        if (resultTickSpan <= (minMovement + 1e-14 /* Constants.TickSpanEpsilon */)) {
            resultTickSpan = minMovement;
        }
        resultTickSpan = Math.max(1, resultTickSpan);
        if ((this._fractionalDividers.length > 0) && (0, mathex_1.equal)(resultTickSpan, 1, 1e-14 /* Constants.TickSpanEpsilon */)) {
            index = 0;
            c = this._fractionalDividers[0];
            while ((0, mathex_1.greaterOrEqual)(resultTickSpan, maxTickSpan * c, 1e-14 /* Constants.TickSpanEpsilon */) && resultTickSpan > (minMovement + 1e-14 /* Constants.TickSpanEpsilon */)) {
                resultTickSpan /= c;
                c = this._fractionalDividers[++index % this._fractionalDividers.length];
            }
        }
        return resultTickSpan;
    }
}
exports.PriceTickSpanCalculator = PriceTickSpanCalculator;
