import { generateTextColor } from '../../helpers/color';

import { ChartModel } from '../../model/chart-model';
import { LastValueDataResultWithData, Series } from '../../model/series';
import { PriceAxisLastValueMode } from '../../model/series-options';
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from '../../renderers/iprice-axis-view-renderer';

import { PriceAxisView } from './price-axis-view';

export interface SeriesPriceAxisViewData {
	model: ChartModel;
}

export class SeriesPriceAxisView extends PriceAxisView {
	private readonly _source: Series;
	private readonly _data: SeriesPriceAxisViewData;

	public constructor(source: Series, data: SeriesPriceAxisViewData) {
		super();
		this._source = source;
		this._data = data;
	}

	protected _getSource(): Series {
		return this._source;
	}

	protected _getData(): SeriesPriceAxisViewData {
		return this._data;
	}

	// tslint:disable-next-line:cyclomatic-complexity
	protected _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonRendererData: PriceAxisViewRendererCommonData
	): void {
		axisRendererData.visible = false;
		paneRendererData.visible = false;

		const seriesOptions = this._source.options();
		const showSeriesLastValue = seriesOptions.lastValueVisible;

		const showSymbolLabel = this._source.title() !== '';
		const showPriceAndPercentage = seriesOptions.seriesLastValueMode === PriceAxisLastValueMode.LastPriceAndPercentageValue;

		const lastValueData = this._source.lastValueData(undefined, false);
		if (lastValueData.noData) {
			return;
		}

		if (showSeriesLastValue) {
			axisRendererData.text = this._axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage);
			axisRendererData.visible = axisRendererData.text.length !== 0;
		}

		if (showSymbolLabel || showPriceAndPercentage) {
			paneRendererData.text = this._paneText(lastValueData, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage);
			paneRendererData.visible = paneRendererData.text.length > 0;
		}

		commonRendererData.background = this._source.priceLineColor(lastValueData.color);
		commonRendererData.color = generateTextColor(commonRendererData.background);
		commonRendererData.coordinate = lastValueData.coordinate;
		paneRendererData.borderColor = this._source.model().options().layout.backgroundColor;
		axisRendererData.borderColor = commonRendererData.background;
	}

	protected _paneText(
		lastValue: LastValueDataResultWithData,
		showSeriesLastValue: boolean,
		showSymbolLabel: boolean,
		showPriceAndPercentage: boolean
	): string {
		let result = '';

		const title = this._source.title();

		if (showSymbolLabel && title.length !== 0) {
			result += `${title} `;
		}

		if (showSeriesLastValue && showPriceAndPercentage) {
			result += this._source.priceScale().isPercentage() ?
				lastValue.formattedPriceAbsolute : lastValue.formattedPricePercentage;
		}

		return result.trim();
	}

	protected _axisText(lastValueData: LastValueDataResultWithData, showSeriesLastValue: boolean, showPriceAndPercentage: boolean): string {
		if (!showSeriesLastValue) {
			return '';
		}

		if (!showPriceAndPercentage) {
			return lastValueData.text;
		}

		return this._source.priceScale().isPercentage() ?
			lastValueData.formattedPricePercentage : lastValueData.formattedPriceAbsolute;
	}
}
