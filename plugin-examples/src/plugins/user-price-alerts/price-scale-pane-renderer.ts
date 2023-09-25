import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { PaneRendererBase } from './renderer-base';
import { buttonHeight } from './constants';
import { positionsLine } from '../../helpers/dimensions/positions';

export class PriceScalePaneRenderer extends PaneRendererBase {
	draw(target: CanvasRenderingTarget2D): void {
		target.useBitmapCoordinateSpace(scope => {
			if (!this._data) return;
			this._drawCrosshairLabel(scope);
		});
	}

	_drawCrosshairLabel(scope: BitmapCoordinatesRenderingScope) {
		if (!this._data?.crosshair) return;
		const ctx = scope.context;
		try {
			const width = scope.bitmapSize.width;
			const labelWidth = width - 8 * scope.horizontalPixelRatio;
			ctx.save();
			ctx.beginPath();
			ctx.fillStyle = this._data.color;
			const labelDimensions = positionsLine(this._data.crosshair.y, scope.verticalPixelRatio, buttonHeight);
			const radius = 2 * scope.horizontalPixelRatio;
			ctx.roundRect(
				0,
				labelDimensions.position,
				labelWidth,
				labelDimensions.length,
				[0, radius, radius, 0]
			);
			ctx.fill();
			ctx.beginPath();
			ctx.fillStyle = '#FFFFFF';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'right';
			ctx.font = `${Math.round(12 *scope.verticalPixelRatio)}px sans-serif`;
			const textMeasurements = ctx.measureText(this._data.crosshair.text);
			ctx.fillText(
				this._data.crosshair.text,
				textMeasurements.width + 10 * scope.horizontalPixelRatio,
				this._data.crosshair.y * scope.verticalPixelRatio
			);
		} finally {
			ctx.restore();
		}
	}
}
