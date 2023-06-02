import { IPriceFormatter } from '../formatters/iprice-formatter';

import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { ChartModel } from './chart-model';
import { IDataSource, IDataSourceBase } from './idata-source';
import { InternalHorzScaleItem } from './ihorz-scale-behavior';
import { TimePointIndex } from './time-data';

export interface FirstValue {
	value: number;
	timePoint: InternalHorzScaleItem;
}

export interface IPriceDataSourceBase extends IDataSourceBase {
	firstValue(): FirstValue | null;
	formatter(): IPriceFormatter;
	priceLineColor(lastBarColor: string): string;
	minMove(): number;
	autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;
}

export interface IPriceDataSource<HorzScaleItem> extends IPriceDataSourceBase, IDataSource<HorzScaleItem> {
	model(): ChartModel<HorzScaleItem>;
}
