import { generateTextColor } from '../../helpers/color';

import { CustomPriceLine } from '../../model/custom-price-line';
import { Series } from '../../model/series';
import {
	PriceAxisViewRendererCommonData,
	PriceAxisViewRendererData,
} from '../../renderers/iprice-axis-view-renderer';

import { PriceAxisView } from './price-axis-view';

export class CustomPriceLinePriceAxisView extends PriceAxisView {
	private readonly _series: Series;
	private readonly _priceLine: CustomPriceLine;

	public constructor(series: Series, priceLine: CustomPriceLine) {
		super();
		this._series = series;
		this._priceLine = priceLine;
	}

	protected _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonData: PriceAxisViewRendererCommonData
	): void {
		axisRendererData.visible = false;
		paneRendererData.visible = false;

		const options = this._priceLine.options();
		const labelVisible = options.axisLabelVisible;

		if (!labelVisible) {
			return;
		}

		const y = this._priceLine.yCoord();
		if (y === null) {
			return;
		}

		axisRendererData.text = this._series.priceScale().formatPriceAbsolute(options.price);
		axisRendererData.visible = true;

		commonData.background = options.color;
		commonData.color = generateTextColor(options.color);
		commonData.coordinate = y;
	}
}
