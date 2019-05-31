import { DeepPartial } from '../helpers/strict-type-checks';

import { CandleSeriesOptions } from '../model/series-options';

import { IBarSeriesApiBase } from './ibar-series-api-base';

export interface ICandleSeries extends IBarSeriesApiBase {
	applyOptions(options: DeepPartial<CandleSeriesOptions>): void;
	options(): CandleSeriesOptions;
}
