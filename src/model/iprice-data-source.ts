import { IPriceFormatter } from '../formatters/iprice-formatter';

import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { IChartModelBase } from './chart-model';
import { IDataSource } from './idata-source';
import { InternalHorzScaleItem } from './ihorz-scale-behavior';
import { TimePointIndex } from './time-data';

export interface FirstValue {
	value: number;
	timePoint: InternalHorzScaleItem;
}

export interface IPriceDataSource extends IDataSource {
	firstValue(): FirstValue | null;
	formatter(): IPriceFormatter;
	priceLineColor(lastBarColor: string): string;
	base(): number;
	autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;
	model(): IChartModelBase;
}
