import { DeepPartial } from '../helpers/strict-type-checks';

import { AreaSeriesOptions } from '../model/series-options';

import { ILineSeriesApiBase } from './iline-series-api-base';

export interface IAreaSeriesApi extends ILineSeriesApiBase {
	applyOptions(options: DeepPartial<AreaSeriesOptions>): void;
	options(): AreaSeriesOptions;
}
