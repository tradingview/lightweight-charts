import { DeepPartial } from '../helpers/strict-type-checks';

import { BarSeriesOptions } from '../model/series-options';

import { IBarSeriesApiBase } from './ibar-series-api-base';
import { SeriesParams } from './series-params-base';

export interface IBarSeriesApi extends IBarSeriesApiBase {
	applyOptions(options: DeepPartial<BarSeriesOptions>): void;
	options(): BarSeriesOptions;
}

export type BarSeriesParams = SeriesParams<BarSeriesOptions>;
