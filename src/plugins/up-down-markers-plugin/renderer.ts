import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from 'fancy-canvas';

import { IPrimitivePaneRenderer } from '../../model/ipane-primitive';

import { MarkerCoordinates } from './types';

const enum Constants {
	Radius = 4,
	ArrowSize = 4.7,
	ArrowOffset = 7,
	ArrowLineWidth = 2,
	VerticalScale = 0.5,
}

export class MarkersPrimitiveRenderer implements IPrimitivePaneRenderer {
	private _data: MarkerCoordinates[];
	private readonly _neutralColor: string;
	private readonly _negativeColor: string;
	private readonly _positiveColor: string;

	public constructor(
		data: MarkerCoordinates[],
		neutralColor: string,
		negativeColor: string,
		positiveColor: string
	) {
		this._data = data;
		this._neutralColor = neutralColor;
		this._negativeColor = negativeColor;
		this._positiveColor = positiveColor;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useBitmapCoordinateSpace(
			(scope: BitmapCoordinatesRenderingScope) => {
				const ctx = scope.context;
				const tickWidth = Math.max(1, Math.floor(scope.horizontalPixelRatio));
				const correction = (tickWidth % 2) / 2;

				const rad = Constants.Radius * scope.verticalPixelRatio + correction;
				this._data.forEach((item: MarkerCoordinates) => {
					const centreX = Math.round(item.x * scope.horizontalPixelRatio) + correction;
					ctx.beginPath();
					const color = this._getColor(item.sign);
					ctx.fillStyle = color;
					ctx.arc(
						centreX,
						item.y * scope.verticalPixelRatio,
						rad,
						0,
						2 * Math.PI,
						false
					);
					ctx.fill();
					if (item.sign) {
						ctx.strokeStyle = color;
						ctx.lineWidth = Math.floor(
							Constants.ArrowLineWidth * scope.horizontalPixelRatio
						);
						ctx.beginPath();
						ctx.moveTo(
							(item.x - Constants.ArrowSize) * scope.horizontalPixelRatio + correction,
							(item.y - Constants.ArrowOffset * item.sign) *
								scope.verticalPixelRatio
						);
						ctx.lineTo(
							item.x * scope.horizontalPixelRatio + correction,
							(item.y -
								Constants.ArrowOffset * item.sign -
								Constants.ArrowOffset * item.sign * Constants.VerticalScale) *
								scope.verticalPixelRatio
						);
						ctx.lineTo(
							(item.x + Constants.ArrowSize) * scope.horizontalPixelRatio + correction,
							(item.y - Constants.ArrowOffset * item.sign) *
								scope.verticalPixelRatio
						);
						ctx.stroke();
					}
				});
			}
		);
	}

	private _getColor(sign: number): string {
		if (sign === 0) {
			return this._neutralColor;
		}
		return sign > 0 ? this._positiveColor : this._negativeColor;
	}
}
