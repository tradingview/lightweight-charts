import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	SeriesPrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { positionsLine } from '../../helpers/dimensions/positions';

class TooltipCrosshairLinePaneRenderer implements ISeriesPrimitivePaneRenderer {
	_data: TooltipCrosshairLineData[];

	constructor(data: TooltipCrosshairLineData[]) {
		this._data = data;
	}

	draw(target: CanvasRenderingTarget2D) {
		if (!this._data.length) return;
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			this._data.forEach(data => {
				const crosshairPos = positionsLine(
					data.x,
					scope.horizontalPixelRatio,
					1
				);
				ctx.fillStyle = data.color;
				ctx.fillRect(
					crosshairPos.position,
					data.topMargin * scope.verticalPixelRatio,
					crosshairPos.length,
					scope.bitmapSize.height
				);
				if (data.priceY) {
					ctx.beginPath();
					ctx.ellipse(
						data.x * scope.horizontalPixelRatio,
						data.priceY * scope.verticalPixelRatio,
						6 * scope.horizontalPixelRatio,
						6 * scope.verticalPixelRatio,
						0,
						0,
						Math.PI * 2
					);
					ctx.fillStyle = data.markerBorderColor;
					ctx.fill();
					ctx.beginPath();
					ctx.ellipse(
						data.x * scope.horizontalPixelRatio,
						data.priceY * scope.verticalPixelRatio,
						4 * scope.horizontalPixelRatio,
						4 * scope.verticalPixelRatio,
						0,
						0,
						Math.PI * 2
					);
					ctx.fillStyle = data.markerColor;
					ctx.fill();
				}
			});
		});
	}
}

export class MultiTouchCrosshairPaneView implements ISeriesPrimitivePaneView {
	_data: TooltipCrosshairLineData[];
	constructor(data: TooltipCrosshairLineData[]) {
		this._data = data;
	}

	update(data: TooltipCrosshairLineData[]): void {
		this._data = data;
	}

	renderer(): ISeriesPrimitivePaneRenderer | null {
		return new TooltipCrosshairLinePaneRenderer(this._data);
	}

	zOrder(): SeriesPrimitivePaneViewZOrder {
		return 'top';
	}
}

export interface TooltipCrosshairLineData {
	x: number;
	visible: boolean;
	color: string;
	topMargin: number;
	priceY: number;
	markerColor: string;
	markerBorderColor: string;
}
