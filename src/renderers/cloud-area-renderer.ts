import { Coordinate } from '../model/coordinate';
import { CloudPricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { ScaledRenderer } from './scaled-renderer';

export type CloudLineItem = TimedValue & CloudPricedValue;

export interface PaneRendererCloudAreaData {
	items: CloudLineItem[];

	positiveColor: string;
	negativeColor: string;
	bottom: Coordinate;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererCloudArea extends ScaledRenderer {
	protected _data: PaneRendererCloudAreaData | null = null;

	public setData(data: PaneRendererCloudAreaData): void {
		this._data = data;
	}

	// eslint-disable-next-line complexity
	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		let startGreen = 1;
		const turningPoints = [];
		let sign = -2;
		for (let i = this._data.visibleRange.from + 1; i < this._data.visibleRange.to; ++i) {
			const currItem = this._data.items[i];

			const delta = currItem.higherPrice - currItem.lowerPrice;
			const newSign = delta > 0 ? 1 : -1;

			if (i === this._data.visibleRange.from + 1) {
				startGreen = delta;
			}

			if (sign !== -2) {
				if (sign * newSign === -1) {
					turningPoints.push(i);
				}
			}
			sign = newSign;
		}
		turningPoints.push(this._data.visibleRange.to);

		let firstPoint = 0;
		let intersectionPoint = [0, 0];
		let newIntersectionPoint = [0, 0];
		let lastPoint;

		for (let i = 0; i < turningPoints.length; ++i) {
			lastPoint = turningPoints[i];
			ctx.beginPath();

			if (i === 0) {
				ctx.moveTo(this._data.items[firstPoint].x, this._data.items[firstPoint].higherY);
			} else {
				ctx.moveTo(intersectionPoint[0], intersectionPoint[1]);
			}

			for (let j = firstPoint; j < lastPoint; j++) {
				ctx.lineTo(this._data.items[j].x, this._data.items[j].higherY);
			}

			if (i !== turningPoints.length - 1) {
				newIntersectionPoint = this._calculateIntersection(lastPoint);
				ctx.lineTo(newIntersectionPoint[0], newIntersectionPoint[1]);
			}

			for (let j = lastPoint - 1; j >= firstPoint; --j) {
				ctx.lineTo(this._data.items[j].x, this._data.items[j].lowerY);
			}

			if (i !== 0) {
				ctx.lineTo(intersectionPoint[0], intersectionPoint[1]);
			}

			ctx.closePath();
			if (startGreen * Math.pow(-1, i) > 0) {
				ctx.fillStyle = this._data.positiveColor;
			} else {
				ctx.fillStyle = this._data.negativeColor;
			}
			ctx.fill();

			firstPoint = lastPoint;
			intersectionPoint = newIntersectionPoint;
		}
	}

	private _calculateIntersection(turning: number): [number, number] {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			throw new Error('Empty data');
		}

		return PaneRendererCloudArea._getIntersection(this._data.items[turning - 1].x, this._data.items[turning - 1].higherY, this._data.items[turning].x, this._data.items[turning].higherY, this._data.items[turning - 1].lowerY, this._data.items[turning].lowerY);
	}

	private static _getIntersection(x11: number, y11: number, x12: number, y12: number, y21: number, y22: number): [number, number] {
		const A1 = y12 - y11;
		const B1 = x11 - x12;
		const C1 = A1 * x11 + B1 * y11;

		const A2 = y22 - y21;
		const B2 = x11 - x12;
		const C2 = A2 * x11 + B2 * y21;

		const delta = A1 * B2 - A2 * B1;

		if (delta === 0) {
			throw new Error('Lines are parallel');
		}

		const IX = (B2 * C1 - B1 * C2) / delta;
		const IY = (A1 * C2 - A2 * C1) / delta;

		return [IX, IY];
	}
}
