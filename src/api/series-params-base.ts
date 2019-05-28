import { DeepPartial } from '../helpers/strict-type-checks';

import { PriceScaleMargins } from '../model/price-scale';
import { SeriesOptionsBase } from '../model/series-options';

export interface SeriesParamsBase {
	overlay: boolean;
	title?: string;
	scaleMargins?: PriceScaleMargins; // for overlays only
}

export interface SeriesParams<T extends SeriesOptionsBase> extends SeriesParamsBase {
	options?: DeepPartial<T>;
}
