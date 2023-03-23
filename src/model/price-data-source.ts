import { IPriceFormatter } from '../formatters/iprice-formatter';

import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { ChartModel } from './chart-model';
import { DataSource } from './data-source';
import { FirstValue, IPriceDataSource } from './iprice-data-source';
import { TimePointIndex } from './time-data';

export abstract class PriceDataSource<HorzScaleItem> extends DataSource<HorzScaleItem> implements IPriceDataSource<HorzScaleItem> {
	private readonly _model: ChartModel<HorzScaleItem>;

	public constructor(model: ChartModel<HorzScaleItem>) {
		super();
		this._model = model;
	}

	public model(): ChartModel<HorzScaleItem> {
		return this._model;
	}

	public abstract minMove(): number;

	public abstract autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;

	public abstract firstValue(): FirstValue | null;
	public abstract formatter(): IPriceFormatter;
	public abstract priceLineColor(lastBarColor: string): string;
}
