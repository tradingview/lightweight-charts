import { Coordinate } from '../model/coordinate';
import { Point } from '../model/point';
import { CanvasRenderingTarget2D, MediaCoordinatesRenderingScope } from 'fancy-canvas';
import { LineStyle, LineWidth, setLineStyle } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';
import { ensureNotNull } from '../helpers/assertions';

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

export class BoxRenderer implements IPaneRenderer {
	public _data: BoxRendererData | null ;

	public constructor() {
		this._data = null;
	}
	public setData(data: BoxRendererData): void {
		this._data = data;
	}

	//CanvasRenderingContext2D
	public draw(target: CanvasRenderingTarget2D,isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.visible === false ) {
			return;
		}
		const  pixelRatio: number = 1
		if (this._data === null) {
			return;
		}
		target.useMediaCoordinateSpace(({ context: ctx }: MediaCoordinatesRenderingScope) => {
			ensureNotNull(this._data).width = ctx.canvas.width;
			ensureNotNull(this._data).height = ctx.canvas.height;
		})

		let corners: Point[] = [];

		if (this._data.corners.length === 0) {
			const height = Math.ceil(this._data.height * pixelRatio);
			const yLow = Math.round(this._data.yLow * pixelRatio) as Coordinate;
			if (yLow > height) {
				return;
			}

			const yHigh = Math.round(this._data.yHigh * pixelRatio) as Coordinate;

			if (yHigh < 0) {
				return;
			}

			const width = Math.ceil(this._data.width * pixelRatio);
			const xLow = Math.round(this._data.xLow * pixelRatio) as Coordinate;
			if (xLow > width) {
				return;
			}

			const xHigh = Math.round(this._data.xHigh * pixelRatio) as Coordinate;
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
					x: Math.round(this._data.corners[i].x * pixelRatio) as Coordinate,
					y: Math.round(this._data.corners[i].y * pixelRatio) as Coordinate,
				});
			}
		}
		target.useMediaCoordinateSpace(({ context: ctx }: MediaCoordinatesRenderingScope) => {
		//	ctx.font = rendererOptions.font;
			//return Math.round(rendererOptions.widthCache.measureText(ctx, ensureNotNull(this._data).text, optimizationReplacementRe));
		ctx.beginPath();
		ctx.moveTo(corners[corners.length - 1].x, corners[corners.length - 1].y);

		for (let i = 0; i < corners.length; ++i) {
			ctx.lineTo(corners[i].x, corners[i].y);
		}

		ctx.fillStyle = this._hexToRgba(ensureNotNull(this._data).fillColor, ensureNotNull(this._data).fillOpacity);
		ctx.fill();

		if (ensureNotNull(this._data).borderVisible) {
			ctx.strokeStyle = ensureNotNull(this._data).borderColor;
			ctx.lineWidth = ensureNotNull(this._data).borderWidth;
			setLineStyle(ctx, ensureNotNull(this._data).borderStyle);
		} else { // border will default to a thin black line without the following
			ctx.lineWidth = 0.00001;
			ctx.strokeStyle = this._hexToRgba(ensureNotNull(this._data).fillColor, ensureNotNull(this._data).fillOpacity);
			
		}

		ctx.stroke();
		});

		
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