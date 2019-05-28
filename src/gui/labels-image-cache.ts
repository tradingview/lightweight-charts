import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { getContext2d } from '../helpers/canvas-wrapper';
import { IDestroyable } from '../helpers/idestroyable';
import { makeFont } from '../helpers/make-font';

import { TextWidthCache } from '../model/text-width-cache';

const MAX_COUNT = 200;

interface Item {
	text: string;
	textWidth: number;
	width: number;
	height: number;
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
		delete this._textWidthCache;
		this._keys = [];
		this._hash.clear();
	}

	public paintTo(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: string): void {
		const label = this.getLabelImage(ctx, text);
		if (align !== 'left') {
			x -= label.textWidth;
		}

		y -= Math.floor(label.height / 2);

		ctx.drawImage(
			label.canvas,
			x, y
		);
	}

	public getLabelImage(ctx: CanvasRenderingContext2D, text: string): Item {
		let item: Item;
		if (this._hash.has(text)) {
			// Cache hit!
			item = ensureDefined(this._hash.get(text));
		} else {
			if (this._keys.length >= MAX_COUNT) {
				const key = ensureDefined(this._keys.shift());
				this._hash.delete(key);
			}

			// Allocate new
			item = {
				text: text,
				textWidth: 0,
				width: 0,
				height: 0,
				canvas: document.createElement('canvas'),
			};

			const margin = Math.ceil(this._fontSize / 4.5);
			const baselineOffset = Math.round(this._fontSize / 10);
			const textWidth = Math.ceil(this._textWidthCache.measureText(ctx, text));

			item.textWidth = Math.round(Math.max(1, textWidth));
			item.width = Math.round(textWidth + margin * 2);
			item.height = this._fontSize + margin * 2;

			if (textWidth !== 0) {
				this._keys.push(item.text);
				this._hash.set(item.text, item);
			}

			item.canvas.width = item.width;
			item.canvas.height = item.height;
			ctx = ensureNotNull(getContext2d(item.canvas));
			ctx.font = this._font;
			ctx.fillStyle = this._color;
			ctx.fillText(text, 0, item.height - margin - baselineOffset);
		}

		return item;
	}
}
