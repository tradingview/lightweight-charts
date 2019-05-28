import { DeepPartial } from '../helpers/strict-type-checks';

import { AreaSeriesOptions } from '../model/series-options';

import { ILineSeriesApiBase } from './iline-series-api-base';
import { SeriesParams } from './series-params-base';

export interface IAreaSeriesApi extends ILineSeriesApiBase {
	applyOptions(options: DeepPartial<AreaSeriesOptions>): void;
	options(): AreaSeriesOptions;
}

export type AreaSeriesParams = SeriesParams<AreaSeriesOptions>;
