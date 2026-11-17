import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer, IPrimitivePaneView, PrimitivePaneViewZOrder } from 'lightweight-charts';
import { drawRoundRect } from '@tradingview/lwc-toolkit/canvas/round-rect';
import { Rect } from './geometry';

/** The bitmap span between two media coordinates, each edge rounded on its own. */
function edgeSpan(start: number, end: number, pixelRatio: number): { position: number; length: number } {
	const position = Math.round(start * pixelRatio);
	return { position, length: Math.round(end * pixelRatio) - position };
}

/** Radius of the button's two corners away from the pane edge, in CSS pixels. */
const CORNER_RADIUS = 5;

/** Radius of the circle around the plus, and half the plus's arms, in CSS pixels. */
const ICON_RADIUS = 7;
const ICON_ARM = 3.5;

/** Color of the plus icon, white on the label-colored button. */
const ICON_COLOR = '#FFFFFF';

/** Everything the button needs for one paint. */
export interface ButtonState {
	rect: Rect;
	background: string;
}

class ButtonRenderer implements IPrimitivePaneRenderer {
	public constructor(private readonly _state: ButtonState | null) {}

	public draw(target: CanvasRenderingTarget2D): void {
		const state = this._state;
		if (state === null) {
			return;
		}
		target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
			const { rect } = state;
			// Each edge rounded on its own, so the button is flush with the pane
			// edge at every pixel ratio.
			const x = edgeSpan(rect.left, rect.left + rect.width, horizontalPixelRatio);
			const y = edgeSpan(rect.top, rect.top + rect.height, verticalPixelRatio);
			const radius = CORNER_RADIUS * horizontalPixelRatio;
			// Round the two corners away from the pane edge; the edge side is flush.
			drawRoundRect(ctx, x.position, y.position, x.length, y.length, [radius, 0, 0, radius]);
			ctx.fillStyle = state.background;
			ctx.fill();

			// The arms land on whole device pixels: a line of odd width is centered
			// on a pixel's middle, one of even width on a pixel edge.
			const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
			const crisp = (start: number, length: number): number =>
				Math.round(start + length / 2 - lineWidth / 2) + lineWidth / 2;
			const centerX = crisp(x.position, x.length);
			const centerY = crisp(y.position, y.length);
			ctx.strokeStyle = ICON_COLOR;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.ellipse(centerX, centerY, ICON_RADIUS * horizontalPixelRatio, ICON_RADIUS * verticalPixelRatio, 0, 0, Math.PI * 2);
			ctx.moveTo(centerX - ICON_ARM * horizontalPixelRatio, centerY);
			ctx.lineTo(centerX + ICON_ARM * horizontalPixelRatio, centerY);
			ctx.moveTo(centerX, centerY - ICON_ARM * verticalPixelRatio);
			ctx.lineTo(centerX, centerY + ICON_ARM * verticalPixelRatio);
			ctx.stroke();
		});
	}
}

/** The add button, drawn above the series and the other primitives. */
export class ButtonPaneView implements IPrimitivePaneView {
	public constructor(private readonly _state: () => ButtonState | null) {}

	public zOrder(): PrimitivePaneViewZOrder {
		return 'top';
	}

	public renderer(): IPrimitivePaneRenderer {
		return new ButtonRenderer(this._state());
	}
}
