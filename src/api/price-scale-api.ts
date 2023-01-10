import { ChartWidget } from '../gui/chart-widget';

import { ensureNotNull } from '../helpers/assertions';
import { DeepPartial } from '../helpers/strict-type-checks';

import { isDefaultPriceScale } from '../model/default-price-scale';
import { PriceScale, PriceScaleOptions } from '../model/price-scale';

import { IPriceScaleApi } from './iprice-scale-api';

export class PriceScaleApi implements IPriceScaleApi {
	private _chartWidget: ChartWidget;
	private readonly _priceScaleId: string;

	public constructor(chartWidget: ChartWidget, priceScaleId: string) {
		this._chartWidget = chartWidget;
		this._priceScaleId = priceScaleId;
	}

	public applyOptions(options: DeepPartial<PriceScaleOptions>): void {
		this._chartWidget.model().applyPriceScaleOptions(this._priceScaleId, options);
	}

	public options(): Readonly<PriceScaleOptions> {
		return this._priceScale().options();
	}

	public width(): number {
		if (!isDefaultPriceScale(this._priceScaleId)) {
			return 0;
		}

		return this._chartWidget.getPriceAxisWidth(this._priceScaleId);
	}

	private _priceScale(): PriceScale {
		return ensureNotNull(this._chartWidget.model().findPriceScale(this._priceScaleId)).priceScale;
	}
}
