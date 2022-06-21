import { makeFont } from '../helpers/make-font';

import { ChartModel } from '../model/chart-model';

import { PriceAxisViewRendererOptions } from './iprice-axis-view-renderer';

const enum RendererConstants {
	BorderSize = 1,
	TickLength = 5,
}

export class PriceAxisRendererOptionsProvider {
	private readonly _chartModel: ChartModel;

	private readonly _rendererOptions: PriceAxisViewRendererOptions = {
		borderSize: RendererConstants.BorderSize,
		tickLength: RendererConstants.TickLength,
		fontSize: NaN,
		font: '',
		fontFamily: '',
		color: '',
		paneBackgroundColor: '',
		paddingBottom: 0,
		paddingInner: 0,
		paddingOuter: 0,
		paddingTop: 0,
		baselineOffset: 0,
	};

	public constructor(chartModel: ChartModel) {
		this._chartModel = chartModel;
	}

	public options(): Readonly<PriceAxisViewRendererOptions> {
		const rendererOptions = this._rendererOptions;

		const currentFontSize = this._fontSize();
		const currentFontFamily = this._fontFamily();

		if (rendererOptions.fontSize !== currentFontSize || rendererOptions.fontFamily !== currentFontFamily) {
			rendererOptions.fontSize = currentFontSize;
			rendererOptions.fontFamily = currentFontFamily;
			rendererOptions.font = makeFont(currentFontSize, currentFontFamily);
			rendererOptions.paddingTop = 2.5 / 12 * currentFontSize; // 2.5 px for 12px font
			rendererOptions.paddingBottom = rendererOptions.paddingTop;
			rendererOptions.paddingInner = currentFontSize / 12 * rendererOptions.tickLength;
			rendererOptions.paddingOuter = currentFontSize / 12 * rendererOptions.tickLength;
			rendererOptions.baselineOffset = 0;
		}

		rendererOptions.color = this._textColor();
		rendererOptions.paneBackgroundColor = this._paneBackgroundColor();

		return this._rendererOptions;
	}

	private _textColor(): string {
		return this._chartModel.options().layout.textColor;
	}

	private _paneBackgroundColor(): string {
		return this._chartModel.backgroundTopColor();
	}

	private _fontSize(): number {
		return this._chartModel.options().layout.fontSize;
	}

	private _fontFamily(): string {
		return this._chartModel.options().layout.fontFamily;
	}
}
