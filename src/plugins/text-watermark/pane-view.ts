import { makeFont } from '../../helpers/make-font';

import {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
} from '../../model/ipane-primitive';

import { TextWatermarkLineOptions, TextWatermarkOptions } from './options';
import {
	TextWatermarkLineRendererOptions,
	TextWatermarkRenderer,
	TextWatermarkRendererOptions,
} from './pane-renderer';

export class TextWatermarkPaneView implements IPrimitivePaneView {
	private _options: TextWatermarkRendererOptions;

	public constructor(options: TextWatermarkOptions) {
		this._options = buildRendererOptions(options);
	}

	public update(options: TextWatermarkOptions): void {
		this._options = buildRendererOptions(options);
	}

	public renderer(): IPrimitivePaneRenderer {
		return new TextWatermarkRenderer(this._options);
	}
}

function buildRendererLineOptions(
	lineOption: TextWatermarkLineOptions
): TextWatermarkLineRendererOptions {
	return {
		...lineOption,
		font: makeFont(
			lineOption.fontSize,
			lineOption.fontFamily,
			lineOption.fontStyle
		),
		lineHeight: lineOption.lineHeight || lineOption.fontSize * 1.2,
		vertOffset: 0,
		zoom: 0,
	};
}

function buildRendererOptions(
	options: TextWatermarkOptions
): TextWatermarkRendererOptions {
	return {
		...options,
		lines: options.lines.map(buildRendererLineOptions),
	};
}
