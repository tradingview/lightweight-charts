import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { Point } from '../model/point';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineStyle, LineWidth, setLineStyle } from './draw-line';

export interface BoxRendererData {
	fillColor: string;
	fillOpacity: number;
	borderColor: string;
	borderStyle: LineStyle;
	borderWidth: LineWidth;
	borderVisible: boolean;

	corners: Point[];
	xLow: Coordinate; // earlyTime
	xHigh: Coordinate; // lateTime
	yLow: Coordinate; // lowPrice
	yHigh: Coordinate; // highPrice
	visible?: boolean;

	// axisLabelVisible
	// title
	width: number; // Canvas width?
	height: number; // Canvas height?
}

export class BoxRenderer extends BitmapCoordinatesPaneRenderer {
	private _data: BoxRendererData | null = null;

	public setData(data: BoxRendererData): void {
		this._data = data;
	}

	protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void {
		if (this._data === null) {
			return;
		}

		if (this._data.visible === false) {
			return;
		}

		let corners: Point[] = [];

		if (this._data.corners.length === 0) {
			const yLow = Math.round(this._data.yLow * verticalPixelRatio) as Coordinate;

			if (yLow > bitmapSize.height) {
				return;
			}

			const yHigh = Math.round(this._data.yHigh * verticalPixelRatio) as Coordinate;

			if (yHigh < 0) {
				return;
			}

			const xLow = Math.round(this._data.xLow * horizontalPixelRatio) as Coordinate;

			if (xLow > bitmapSize.width) {
				return;
			}

			const xHigh = Math.round(this._data.xHigh * horizontalPixelRatio) as Coordinate;

			if (xHigh < 0) {
				return;
			}

			corners = [
				{ x: xLow, y: yLow },
				{ x: xLow, y: yHigh },
				{ x: xHigh, y: yHigh },
				{ x: xHigh, y: yLow },
			];
		} else {
			for (let i = 0; i < this._data.corners.length; ++i) {
				corners.push({
					x: Math.round(this._data.corners[i].x * horizontalPixelRatio) as Coordinate,
					y: Math.round(this._data.corners[i].y * verticalPixelRatio) as Coordinate,
				});
			}
		}

		ctx.beginPath();
		ctx.moveTo(corners[corners.length - 1].x, corners[corners.length - 1].y);

		for (let i = 0; i < corners.length; ++i) {
			ctx.lineTo(corners[i].x, corners[i].y);
		}

		ctx.fillStyle = this._hexToRgba(this._data.fillColor, this._data.fillOpacity);
		ctx.fill();

		if (this._data.borderVisible) {
			ctx.strokeStyle = this._data.borderColor;
			ctx.lineWidth = this._data.borderWidth;
			setLineStyle(ctx, this._data.borderStyle);
		} else { // border will default to a thin black line without the following
			ctx.lineWidth = 0.00001;
			ctx.strokeStyle = this._hexToRgba(this._data.fillColor, this._data.fillOpacity);
		}

		ctx.stroke();
	}

	private _hexToRgba(hex: string, opacity: number): string {
		hex = hex.substring(1);

		if (hex.length === 3) {
			hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
		}

		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	}
}