import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from "fancy-canvas";
import { Coordinate, IPrimitivePaneRenderer } from "lightweight-charts";
import { makeFont } from "./helper";
import { TextWidthCache } from "./text-width-cache";
import {
	IBitmapShapeItemCoordinates,
	ISeriesMarkerRendererData,
} from "./types";

const LINE_SIZE = 10;
const OFFSET = 4 + LINE_SIZE;

export class PaneRenderer implements IPrimitivePaneRenderer {
	private _data: ISeriesMarkerRendererData[] | null = null;
	private _textWidthCache: TextWidthCache = new TextWidthCache();
	private _fontSize: number = 10;
	private _fontFamily: string = "Roboto, sans-serif";
	private _font: string = makeFont({
		fontSize: this._fontSize,
		fontFamily: this._fontFamily,
	});
	private _zOrder: "top" | "aboveSeries" | "normal" = "normal";

	// --------------------------------------------------
	public setData(data: ISeriesMarkerRendererData[]): void {
		this._data = data;
	}

	// --------------------------------------------------
	public setParams(opts: {
		fontSize: number;
		fontFamily: string;
		zOrder: "top" | "aboveSeries" | "normal";
	}): void {
		const { fontSize, fontFamily, zOrder } = opts;

		if (this._fontSize !== fontSize || this._fontFamily !== fontFamily) {
			this._fontSize = fontSize;
			this._fontFamily = fontFamily;
			this._font = makeFont({
				fontSize: this._fontSize,
				fontFamily: this._fontFamily,
			});
			this._textWidthCache.reset();
		}

		this._zOrder = zOrder;
	}

	// --------------------------------------------------
	public draw(target: CanvasRenderingTarget2D): void {
		if (this._zOrder === "aboveSeries") {
			return;
		}

		target.useBitmapCoordinateSpace((scope) => {
			this._drawImpl(scope);
		});
	}

	// --------------------------------------------------
	public drawBackground(target: CanvasRenderingTarget2D): void {
		if (this._zOrder !== "aboveSeries") {
			return;
		}

		target.useBitmapCoordinateSpace(
			(scope: BitmapCoordinatesRenderingScope) => {
				this._drawImpl(scope);
			}
		);
	}

	// --------------------------------------------------
	private _drawImpl(scope: BitmapCoordinatesRenderingScope): void {
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;

		if (this._data === null) {
			return;
		}

		ctx.textBaseline = "middle";
		ctx.font = this._font;

		for (let index = 0; index < this._data.length; index++) {
			const item = this._data[index];
			if (!item.text) {
				continue;
			}

			item.text.width = this._textWidthCache.measureText(
				ctx,
				item.text.content
			);
			item.text.height = this._fontSize;
			item.text.x =
				item.variant === "left"
					? ((item.x - item.text.width - OFFSET) as Coordinate)
					: ((item.x + OFFSET) as Coordinate);

			drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio);
		}
	}
}

// --------------------------------------------------
const drawItem = (
	item: ISeriesMarkerRendererData,
	ctx: CanvasRenderingContext2D,
	horizontalPixelRatio: number,
	verticalPixelRatio: number
): void => {
	if (!item.text) {
		return;
	}

	ctx.fillStyle = item.color;
	drawText(
		ctx,
		item.text.content,
		item.text.x,
		item.text.y,
		horizontalPixelRatio,
		verticalPixelRatio
	);

	ctx.strokeStyle = item.color;
	drawLine(
		item.variant === "left",
		ctx,
		bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio)
	);
};

// --------------------------------------------------
const bitmapShapeItemCoordinates = (
	item: ISeriesMarkerRendererData,
	horizontalPixelRatio: number,
	verticalPixelRatio: number
): IBitmapShapeItemCoordinates => {
	return {
		x: Math.round(item.x * horizontalPixelRatio),
		y: item.y * verticalPixelRatio,
		pixelRatio: horizontalPixelRatio,
	};
};

// --------------------------------------------------
const drawLine = (
	isLeftPosition: boolean,
	ctx: CanvasRenderingContext2D,
	coords: IBitmapShapeItemCoordinates
): void => {
	const x = coords.x;
	const y = coords.y;

	ctx.beginPath();
	ctx.lineWidth = 1 * coords.pixelRatio;

	if (isLeftPosition) {
		ctx.moveTo(x, y);
		ctx.lineTo(x - LINE_SIZE, y);
	} else {
		ctx.moveTo(x, y);
		ctx.lineTo(x + LINE_SIZE, y);
	}

	ctx.stroke();
};

// --------------------------------------------------
export const drawText = (
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	horizontalPixelRatio: number,
	verticalPixelRatio: number
): void => {
	ctx.save();
	ctx.scale(horizontalPixelRatio, verticalPixelRatio);
	ctx.fillText(text, x, y);
	ctx.restore();
};
