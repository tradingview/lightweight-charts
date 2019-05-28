import { DeepPartial } from '../helpers/strict-type-checks';

import { CandleSeriesOptions } from '../model/series-options';

import { IBarSeriesApiBase } from './ibar-series-api-base';
import { SeriesParams } from './series-params-base';

export interface ICandleSeries extends IBarSeriesApiBase {
	applyOptions(options: DeepPartial<CandleSeriesOptions>): void;
	options(): CandleSeriesOptions;
}

export type CandleSeriesParams = SeriesParams<CandleSeriesOptions>;
