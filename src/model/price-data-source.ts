import { IPriceFormatter } from '../formatters/iprice-formatter';

import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { ChartModel } from './chart-model';
import { DataSource } from './data-source';
import { FirstValue, IPriceDataSource } from './iprice-data-source';
import { TimePointIndex } from './time-data';

export abstract class PriceDataSource extends DataSource implements IPriceDataSource {
	private readonly _model: ChartModel;

	public constructor(model: ChartModel) {
		super();
		this._model = model;
	}

	public model(): ChartModel {
		return this._model;
	}

	public abstract minMove(): number;

	public abstract autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;

	public abstract firstValue(): FirstValue | null;
	public abstract formatter(): IPriceFormatter;
	public abstract priceLineColor(lastBarColor: string): string;
}
