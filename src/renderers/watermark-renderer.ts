import { ScaledRenderer } from './scaled-renderer';

export interface WatermarkRendererLineData {
	text: string;
	font: string;
	lineHeight: number;
	vertOffset: number;
	zoom: number;
}

export type HorzAlign = 'left' | 'center' | 'right';
export type VertAlign = 'top' | 'center' | 'bottom';

export interface WatermarkRendererData {
	lines: WatermarkRendererLineData[];
	color: string;
	height: number;
	width: number;
	visible: boolean;
	horzAlign: HorzAlign;
	vertAlign: VertAlign;
}

export class WatermarkRenderer extends ScaledRenderer {
	private readonly _data: WatermarkRendererData;
	private _metricsCache: Map<string, Map<string, number>> = new Map();

	public constructor(data: WatermarkRendererData) {
		super();
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
	}

	protected _drawBackgroundImpl(ctx: CanvasRenderingContext2D): void {
		if (!this._data.visible) {
			return;
		}
		ctx.save();

		let textHeight = 0;
		for (const line of this._data.lines) {
			if (line.text.length === 0) {
				continue;
			}

			ctx.font = line.font;
			const textWidth = this._metrics(ctx, line.text);
			if (textWidth > this._data.width) {
				line.zoom = this._data.width / textWidth;
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
				vertOffset = Math.max((this._data.height - textHeight) / 2, 0);
				break;

			case 'bottom':
				vertOffset = Math.max((this._data.height - textHeight), 0);
				break;
		}

		ctx.fillStyle = this._data.color;

		for (const line of this._data.lines) {
			ctx.save();

			let horzOffset = 0;
			switch (this._data.horzAlign) {
				case 'left':
					ctx.textAlign = 'left';
					horzOffset = line.lineHeight / 2;
					break;

				case 'center':
					ctx.textAlign = 'center';
					horzOffset = this._data.width / 2;
					break;

				case 'right':
					ctx.textAlign = 'right';
					horzOffset = this._data.width - 1 - line.lineHeight / 2;
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

		ctx.restore();
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
