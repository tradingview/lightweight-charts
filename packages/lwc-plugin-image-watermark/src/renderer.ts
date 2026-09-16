import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from 'lightweight-charts';

import { fitRect } from './fit-rect.js';
import { ResolvedOptions } from './options.js';

/** Everything a pane view needs from the watermark to place and draw the image. */
export interface WatermarkState {
	image: HTMLImageElement | null;
	imageWidth: number;
	imageHeight: number;
	options: ResolvedOptions;
}

class ImageWatermarkPaneRenderer implements IPrimitivePaneRenderer {
	private readonly _state: WatermarkState;

	public constructor(state: WatermarkState) {
		this._state = state;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useMediaCoordinateSpace(scope => {
			const { image, imageWidth, imageHeight, options } = this._state;
			if (image === null) {
				return;
			}
			const placement = fitRect(
				{ width: imageWidth, height: imageHeight },
				scope.mediaSize,
				options
			);
			if (placement === null) {
				return;
			}
			const { source, dest } = placement;
			const ctx = scope.context;
			const previousAlpha = ctx.globalAlpha;
			ctx.globalAlpha = Math.min(1, Math.max(0, options.alpha));
			ctx.drawImage(
				image,
				source.x,
				source.y,
				source.width,
				source.height,
				dest.x,
				dest.y,
				dest.width,
				dest.height
			);
			ctx.globalAlpha = previousAlpha;
		});
	}
}

/**
 * The pane view shared by the series primitive and the pane primitive: both
 * library interfaces have the same shape.
 */
export class ImageWatermarkPaneView implements IPrimitivePaneView {
	private _state: WatermarkState;

	public constructor(state: WatermarkState) {
		this._state = state;
	}

	public update(state: WatermarkState): void {
		this._state = state;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return this._state.options.zOrder;
	}

	/** `null` until the image has been decoded, so a broken URL draws nothing. */
	public renderer(): IPrimitivePaneRenderer | null {
		const state = this._state;
		if (!state.options.visible || state.image === null) {
			return null;
		}
		return new ImageWatermarkPaneRenderer(state);
	}
}
