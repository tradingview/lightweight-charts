import { DeepPartial } from '../helpers/strict-type-checks';

import { LineSeriesOptions } from '../model/series-options';

import { ILineSeriesApiBase } from './iline-series-api-base';

/** Interface describing line series */
export interface ILineSeriesApi extends ILineSeriesApiBase {
	/**
	 * Applies new options to the existing series
	 * @param options - any subset of options
	 */
	applyOptions(options: DeepPartial<LineSeriesOptions>): void;

	/**
	 * Returns currently applied options
	 * @return full set of currently applied options, including defaults
	 */
	options(): LineSeriesOptions;
}
