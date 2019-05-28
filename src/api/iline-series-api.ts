import { DeepPartial } from '../helpers/strict-type-checks';

import { LineSeriesOptions } from '../model/series-options';

import { ILineSeriesApiBase } from './iline-series-api-base';
import { SeriesParams } from './series-params-base';

export interface ILineSeriesApi extends ILineSeriesApiBase {
	applyOptions(options: DeepPartial<LineSeriesOptions>): void;
	options(): LineSeriesOptions;
}

export type LineSeriesParams = SeriesParams<LineSeriesOptions>;
