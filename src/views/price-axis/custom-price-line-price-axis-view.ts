import { generateContrastColors } from '../../helpers/color';

import { CustomPriceLine } from '../../model/custom-price-line';
import { ISeries } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import {
	PriceAxisViewRendererCommonData,
	PriceAxisViewRendererData,
} from '../../renderers/iprice-axis-view-renderer';

import { PriceAxisView } from './price-axis-view';

export class CustomPriceLinePriceAxisView extends PriceAxisView {
	private readonly _series: ISeries<SeriesType>;
	private readonly _priceLine: CustomPriceLine;

	public constructor(series: ISeries<SeriesType>, priceLine: CustomPriceLine) {
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
		const showPaneLabel = options.title !== '';

		const series = this._series;

		if (!labelVisible || !series.visible()) {
			return;
		}

		const y = this._priceLine.yCoord();
		if (y === null) {
			return;
		}

		if (showPaneLabel) {
			paneRendererData.text = options.title;
			paneRendererData.visible = true;
		}

		paneRendererData.borderColor = series.model().backgroundColorAtYPercentFromTop(y / series.priceScale().height());

		axisRendererData.text = this._formatPrice(options.price);
		axisRendererData.visible = true;

		const colors = generateContrastColors(options.axisLabelColor || options.color);
		commonData.background = colors.background;

		const textColor = options.axisLabelTextColor || colors.foreground;
		axisRendererData.color = textColor; // price text
		paneRendererData.color = textColor; // title text

		commonData.coordinate = y;
	}

	private _formatPrice(price: number): string {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return '';
		}

		return this._series.priceScale().formatPrice(price, firstValue.value);
	}
}
