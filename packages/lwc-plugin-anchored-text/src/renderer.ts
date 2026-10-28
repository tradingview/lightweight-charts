import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from 'lightweight-charts';

import { layoutAnchoredText } from './layout.js';
import { AnchoredTextOptions } from './options.js';

/** Everything a pane view needs to place and draw the text. */
export interface AnchoredTextState {
	options: AnchoredTextOptions;
}

class AnchoredTextPaneRenderer implements IPrimitivePaneRenderer {
	private readonly _state: AnchoredTextState;

	public constructor(state: AnchoredTextState) {
		this._state = state;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		// Text is laid out in CSS pixels; the browser scales the glyphs for the
		// device pixel ratio, so the media coordinate space keeps them sharp.
		target.useMediaCoordinateSpace(scope => {
			const { options } = this._state;
			const ctx = scope.context;
			ctx.save();
			ctx.font = options.font;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';
			const metrics = ctx.measureText(options.text);
			const layout = layoutAnchoredText(
				{
					width: metrics.width,
					ascent: metrics.fontBoundingBoxAscent,
					descent: metrics.fontBoundingBoxDescent,
				},
				scope.mediaSize,
				options
			);
			ctx.fillStyle = options.color;
			ctx.fillText(options.text, layout.x, layout.baselineY);
			ctx.restore();
		});
	}
}

/**
 * The pane view shared by the series primitive and the pane primitive: both
 * library interfaces have the same shape.
 */
export class AnchoredTextPaneView implements IPrimitivePaneView {
	private _state: AnchoredTextState;

	public constructor(state: AnchoredTextState) {
		this._state = state;
	}

	public update(state: AnchoredTextState): void {
		this._state = state;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return this._state.options.zOrder;
	}

	/** `null` while there is nothing to draw, so the chart skips the view. */
	public renderer(): IPrimitivePaneRenderer | null {
		const { options } = this._state;
		if (!options.visible || options.text === '') {
			return null;
		}
		return new AnchoredTextPaneRenderer(this._state);
	}
}
