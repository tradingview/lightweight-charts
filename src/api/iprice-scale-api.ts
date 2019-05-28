import { DeepPartial } from '../helpers/strict-type-checks';

import { PriceScaleOptions } from '../model/price-scale';

export interface IPriceScaleApi {
	applyOptions(options: DeepPartial<PriceScaleOptions>): void;
	options(): PriceScaleOptions;
}
