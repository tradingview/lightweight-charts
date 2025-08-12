import { ISeries, LastValueDataResultWithData } from '../../model/iseries';
import { PriceAxisLastValueMode, SeriesType } from '../../model/series-options';
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from '../../renderers/iprice-axis-view-renderer';

import { PriceAxisView } from './price-axis-view';

export class SeriesPriceAxisView extends PriceAxisView {
	private readonly _source: ISeries<SeriesType>;

	public constructor(source: ISeries<SeriesType>) {
		super();
		this._source = source;
	}

	protected _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonRendererData: PriceAxisViewRendererCommonData
	): void {
		axisRendererData.visible = false;
		paneRendererData.visible = false;

		const source = this._source;
		if (!source.visible()) {
			return;
		}

		const seriesOptions = source.options();

		const showSeriesLastValue = seriesOptions.lastValueVisible;

		const showSymbolLabel = source.title() !== '';
		const showPriceAndPercentage = seriesOptions.seriesLastValueMode === PriceAxisLastValueMode.LastPriceAndPercentageValue;

		const lastValueData = source.lastValueData(false);
		if (lastValueData.noData) {
			return;
		}
		const lastValueWithData = lastValueData as unknown as LastValueDataResultWithData;

		if (showSeriesLastValue) {
			axisRendererData.text = this._axisText(lastValueWithData, showSeriesLastValue, showPriceAndPercentage);
			axisRendererData.visible = axisRendererData.text.length !== 0;
		}

		if (showSymbolLabel || showPriceAndPercentage) {
			paneRendererData.text = this._paneText(lastValueWithData, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage);
			paneRendererData.visible = paneRendererData.text.length > 0;
		}

		const lastValueColor = source.priceLineColor(lastValueWithData.color);
		const colors = this._source
			.model()
			.colorParser()
			.generateContrastColors(lastValueColor);

		commonRendererData.background = colors.background;
		commonRendererData.coordinate = lastValueWithData.coordinate;
		paneRendererData.borderColor = source.model().backgroundColorAtYPercentFromTop(lastValueWithData.coordinate / source.priceScale().height());
		axisRendererData.borderColor = lastValueColor;
		axisRendererData.color = colors.foreground;
		paneRendererData.color = colors.foreground;
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
