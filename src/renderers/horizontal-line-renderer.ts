import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { HitTestPriority, InternalHitTestCandidate } from '../model/internal-hit-test';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { drawHorizontalLine, LineStyle, LineWidth, setLineStyle } from './draw-line';

export interface HorizontalLineRendererData {
	color: string;
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	hitTestTolerance?: number;

	y: Coordinate;
	visible?: boolean;
	externalId?: string;
}

const DEFAULT_HIT_TEST_TOLERANCE = 7;

export class HorizontalLineRenderer extends BitmapCoordinatesPaneRenderer {
	private _data: HorizontalLineRendererData | null = null;

	public setData(data: HorizontalLineRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate): InternalHitTestCandidate | null {
		if (!this._data?.visible) {
			return null;
		}

		const { y: itemY, lineWidth, hitTestTolerance = DEFAULT_HIT_TEST_TOLERANCE, externalId } = this._data;
		// Expand the hit area by lineWidth + tolerance on each side. Baseline lines and
		// internal price lines use this renderer's fallback default rather than the
		// series hitTestTolerance option, so callers that omit the field keep the legacy grab area.
		if (y >= itemY - lineWidth - hitTestTolerance && y <= itemY + lineWidth + hitTestTolerance) {
			return {
				hitTestData: this._data,
				distance: Math.abs(y - itemY),
				priority: HitTestPriority.Point,
				itemType: 'price-line',
				externalId: externalId,
			};
		}

		return null;
	}

	protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void {
		if (this._data === null) {
			return;
		}

		if (this._data.visible === false) {
			return;
		}

		const y = Math.round(this._data.y * verticalPixelRatio);
		if (y < 0 || y > bitmapSize.height) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.strokeStyle = this._data.color;
		ctx.lineWidth = Math.floor(this._data.lineWidth * horizontalPixelRatio);
		setLineStyle(ctx, this._data.lineStyle);
		drawHorizontalLine(ctx, y, 0, bitmapSize.width);
	}
}
