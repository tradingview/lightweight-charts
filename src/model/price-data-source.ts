import { IPriceFormatter } from '../formatters/iprice-formatter';

import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { IChartModelBase } from './chart-model';
import { DataSource } from './data-source';
import { FirstValue, IPriceDataSource } from './iprice-data-source';
import { TimePointIndex } from './time-data';

export abstract class PriceDataSource extends DataSource implements IPriceDataSource {
	private readonly _model: IChartModelBase;

	public constructor(model: IChartModelBase) {
		super();
		this._model = model;
	}

	public model(): IChartModelBase {
		return this._model;
	}

	public abstract minMove(): number;

	public abstract autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;

	public abstract firstValue(): FirstValue | null;
	public abstract formatter(): IPriceFormatter;
	public abstract priceLineColor(lastBarColor: string): string;
}
