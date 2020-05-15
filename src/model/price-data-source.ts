import { IFormatter } from '../formatters/iformatter';

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

	public minMove(): number {
		return 0;
	}

	public autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null {
		return null;
	}

	public abstract firstValue(): FirstValue | null;
	public abstract formatter(): IFormatter;
	public abstract priceLineColor(lastBarColor: string): string;
}
