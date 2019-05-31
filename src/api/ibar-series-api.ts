import { DeepPartial } from '../helpers/strict-type-checks';

import { BarSeriesOptions } from '../model/series-options';

import { IBarSeriesApiBase } from './ibar-series-api-base';

export interface IBarSeriesApi extends IBarSeriesApiBase {
	applyOptions(options: DeepPartial<BarSeriesOptions>): void;
	options(): BarSeriesOptions;
}
