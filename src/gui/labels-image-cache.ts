import { size } from 'fancy-canvas';

import { createPreconfiguredCanvas } from '../gui/canvas-utils';

import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';
import { makeFont } from '../helpers/make-font';
import { ceiledEven } from '../helpers/mathex';

import { TextWidthCache } from '../model/text-width-cache';
import { CanvasRenderingTarget } from '../renderers/canvas-rendering-target';

const MAX_COUNT = 200;

interface Item {
	text: string;
	textWidth: number;
	canvas: HTMLCanvasElement;
}

export class LabelsImageCache implements IDestroyable {
	private _textWidthCache: TextWidthCache = new TextWidthCache(MAX_COUNT);
	private _fontSize: number = 0;
	private _color: string = '';
	private _font: string = '';
	private _keys: string[] = [];
	private _hash: Map<string, Item> = new Map();

	public constructor(fontSize: number, color: string, fontFamily?: string, fontStyle?: string) {
		this._fontSize = fontSize;
		this._color = color;
		this._font = makeFont(fontSize, fontFamily, fontStyle);
	}

	public destroy(): void {
		this._textWidthCache.reset();
		this._keys = [];
		this._hash.clear();
	}

	public paintTo(target: CanvasRenderingTarget, text: string, x: number, y: number, align: string): void {
		const label = this._getLabelImage(target, text);
		if (align !== 'left') {
			x -= Math.floor(label.textWidth * target.horizontalPixelRatio);
		}

		y -= Math.floor(label.canvas.height / 2);

		target.context.drawImage(
			label.canvas,
			x, y,
			label.canvas.width, label.canvas.height
		);
	}

	private _getLabelImage(target: CanvasRenderingTarget, text: string): Item {
		let item: Item;
		if (this._hash.has(text)) {
			// Cache hit!
			item = ensureDefined(this._hash.get(text));
		} else {
			if (this._keys.length >= MAX_COUNT) {
				const key = ensureDefined(this._keys.shift());
				this._hash.delete(key);
			}

			const baselineOffset = Math.round(this._fontSize / 10);
			const textWidth = Math.ceil(this._textWidthCache.measureText(target.context, text));
			// small reserve for antialiasing, measureText is not sharp
			const width = ceiledEven(Math.round(textWidth) + 4);
			const height = ceiledEven(this._fontSize);
			const canvas = createPreconfiguredCanvas(
				document,
				size({
					width: Math.ceil(width * target.horizontalPixelRatio),
					height: Math.ceil(height * target.verticalPixelRatio),
				})
			);

			// Allocate new
			item = {
				text: text,
				textWidth: Math.round(Math.max(1, textWidth)),
				canvas: canvas,
			};

			if (textWidth !== 0) {
				this._keys.push(item.text);
				this._hash.set(item.text, item);
			}

			const ctx = ensureNotNull(item.canvas.getContext('2d'));
			ctx.font = this._font;
			ctx.fillStyle = this._color;
			ctx.scale(target.horizontalPixelRatio, target.verticalPixelRatio);
			ctx.fillText(text, 0, height - baselineOffset);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		}

		return item;
	}
}
