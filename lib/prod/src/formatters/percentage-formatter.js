import { PriceFormatter } from './price-formatter';
export class PercentageFormatter extends PriceFormatter {
    constructor(priceScale = 100) {
        super(priceScale);
    }
    format(price) {
        return `${super.format(price)}%`;
    }
}
