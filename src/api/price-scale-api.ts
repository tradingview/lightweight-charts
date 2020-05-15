import { ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';
import { DeepPartial } from '../helpers/strict-type-checks';

import { ChartModel } from '../model/chart-model';
import { PriceScale, PriceScaleOptions } from '../model/price-scale';

import { IPriceScaleApi } from './iprice-scale-api';

export class PriceScaleApi implements IPriceScaleApi, IDestroyable {
	private _chartModel: ChartModel;
	private readonly _priceScaleId: string;

	public constructor(model: ChartModel, priceScaleId: string) {
		this._chartModel = model;
		this._priceScaleId =  priceScaleId;
	}

	public destroy(): void {
		delete this._chartModel;
	}

	public id(): string {
		return this._priceScale().id();
	}

	public applyOptions(options: DeepPartial<PriceScaleOptions>): void {
		this._chartModel.applyPriceScaleOptions(this._priceScaleId, options);
	}

	public options(): Readonly<PriceScaleOptions> {
		return this._priceScale().options();
	}

	private _priceScale(): PriceScale {
		return ensureNotNull(this._chartModel.findPriceScale(this._priceScaleId)).priceScale;
	}
}
