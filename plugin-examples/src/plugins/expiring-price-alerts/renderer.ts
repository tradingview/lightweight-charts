import { CanvasRenderingTarget2D } from "fancy-canvas";
import { ISeriesPrimitivePaneRenderer } from 'lightweight-charts';
import { iconDimensions } from "./icons";
import { positionsLine } from "../../helpers/dimensions/positions";

export interface RendererDataItem {
	priceY: number;
	startX: number;
	endX: number;
	color: string;
	text: string;
	icon: Path2D;
	fade: boolean;
}

export class ExpiringPriceAlertsPaneRenderer implements ISeriesPrimitivePaneRenderer {
	_data: RendererDataItem[] = [];

	draw(target: CanvasRenderingTarget2D) {
		let pixelRatio = 1;
		target.useBitmapCoordinateSpace(scope => {
			pixelRatio = scope.verticalPixelRatio
		});

		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.lineWidth = 2;

			this._data.forEach(d => {
				const priceLineY = positionsLine(d.priceY, pixelRatio, ctx.lineWidth);
				const priceY = (priceLineY.position + priceLineY.length / 2) / pixelRatio;

				ctx.fillStyle = d.color;
				ctx.strokeStyle = d.color;
				ctx.lineDashOffset = 0;
				ctx.globalAlpha = d.fade ? 0.5 : 1;
				ctx.beginPath();
				ctx.moveTo(d.startX + 4, priceY);
				ctx.lineTo(d.endX - 4, priceY);
				ctx.stroke();

				// dotted lines
				ctx.beginPath();
				ctx.setLineDash([3, 6]);
				ctx.lineCap = 'round';
				ctx.moveTo(d.startX - 30, priceY);
				ctx.lineTo(scope.mediaSize.width, priceY);
				ctx.stroke();
				ctx.setLineDash([]);

				ctx.beginPath();
				ctx.arc(d.startX, priceY, 4, 0, 2 * Math.PI);
				ctx.arc(d.endX, priceY, 4, 0, 2 * Math.PI);
				ctx.fill();

				ctx.font = '10px sans-serif';
				const textMeasurement = ctx.measureText(d.text);
				ctx.beginPath();
				ctx.roundRect(d.startX - 30 - 20 - textMeasurement.width, priceY - 7, textMeasurement.width + 20, 14, 4);
				ctx.fill();

				ctx.fillStyle= '#FFFFFF';
				ctx.fillText(d.text, d.startX - 30 - 15 - textMeasurement.width, priceY + 3);

				ctx.save();
				ctx.translate(d.startX - 30 - 14, priceY - 6);
				const scale = 12 / iconDimensions;
				ctx.scale(scale, scale);
				ctx.fill(d.icon, 'evenodd');
				ctx.restore();
			});
		});
	}

	update(data: RendererDataItem[]) {
		this._data = data;
	}
}
