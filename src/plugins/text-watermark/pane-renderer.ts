import {
	CanvasRenderingTarget2D,
	MediaCoordinatesRenderingScope,
} from 'fancy-canvas';

import { IPrimitivePaneRenderer } from '../../model/ipane-primitive';

import { TextWatermarkLineOptions, TextWatermarkOptions } from './options';

export interface TextWatermarkLineRendererOptions
	extends TextWatermarkLineOptions {
	zoom: number;
	vertOffset: number;
	font: string;
	lineHeight: number;
}

export interface TextWatermarkRendererOptions extends TextWatermarkOptions {
	lines: TextWatermarkLineRendererOptions[];
}

export class TextWatermarkRenderer implements IPrimitivePaneRenderer {
	private _data: TextWatermarkRendererOptions;
	private _metricsCache: Map<string, Map<string, number>> = new Map();

	public constructor(options: TextWatermarkRendererOptions) {
		this._data = options;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useMediaCoordinateSpace((scope: MediaCoordinatesRenderingScope) => {
			if (!this._data.visible) {
				return;
			}
			const { context: ctx, mediaSize } = scope;

			let textHeight = 0;
			for (const line of this._data.lines) {
				if (line.text.length === 0) {
					continue;
				}

				ctx.font = line.font;
				const textWidth = this._metrics(ctx, line.text);
				if (textWidth > mediaSize.width) {
					line.zoom = mediaSize.width / textWidth;
				} else {
					line.zoom = 1;
				}

				textHeight += line.lineHeight * line.zoom;
			}

			let vertOffset = 0;
			switch (this._data.vertAlign) {
				case 'top':
					vertOffset = 0;
					break;

				case 'center':
					vertOffset = Math.max((mediaSize.height - textHeight) / 2, 0);
					break;

				case 'bottom':
					vertOffset = Math.max(mediaSize.height - textHeight, 0);
					break;
			}

			for (const line of this._data.lines) {
				ctx.save();
				ctx.fillStyle = line.color;
				let horzOffset = 0;
				switch (this._data.horzAlign) {
					case 'left':
						ctx.textAlign = 'left';
						horzOffset = line.lineHeight / 2;
						break;

					case 'center':
						ctx.textAlign = 'center';
						horzOffset = mediaSize.width / 2;
						break;

					case 'right':
						ctx.textAlign = 'right';
						horzOffset = mediaSize.width - 1 - line.lineHeight / 2;
						break;
				}

				ctx.translate(horzOffset, vertOffset);
				ctx.textBaseline = 'top';
				ctx.font = line.font;
				ctx.scale(line.zoom, line.zoom);
				ctx.fillText(line.text, 0, line.vertOffset);
				ctx.restore();
				vertOffset += line.lineHeight * line.zoom;
			}
		});
	}

	private _metrics(ctx: CanvasRenderingContext2D, text: string): number {
		const fontCache = this._fontCache(ctx.font);
		let result = fontCache.get(text);
		if (result === undefined) {
			result = ctx.measureText(text).width;
			fontCache.set(text, result);
		}

		return result;
	}

	private _fontCache(font: string): Map<string, number> {
		let fontCache = this._metricsCache.get(font);
		if (fontCache === undefined) {
			fontCache = new Map();
			this._metricsCache.set(font, fontCache);
		}

		return fontCache;
	}
}
