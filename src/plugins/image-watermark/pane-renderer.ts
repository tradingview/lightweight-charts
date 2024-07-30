import {
	CanvasRenderingTarget2D,
	MediaCoordinatesRenderingScope,
} from 'fancy-canvas';

import { IPrimitivePaneRenderer } from '../../model/ipane-primitive';

import { ImageWatermarkOptions } from './options';

export interface Placement {
	x: number;
	y: number;
	height: number;
	width: number;
}

export interface ImageWatermarkRendererOptions extends ImageWatermarkOptions {
	placement: Placement | null;
	imgElement: HTMLImageElement | null;
}

export class ImageWatermarkRenderer implements IPrimitivePaneRenderer {
	private _data: ImageWatermarkRendererOptions;

	public constructor(data: ImageWatermarkRendererOptions) {
		this._data = data;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useMediaCoordinateSpace((scope: MediaCoordinatesRenderingScope) => {
			const ctx = scope.context;
			const pos = this._data.placement;
			if (!pos) {
				return;
			}
			if (!this._data.imgElement) {
				throw new Error(`Image element missing.`);
			}
			ctx.globalAlpha = this._data.alpha ?? 1;
			ctx.drawImage(this._data.imgElement, pos.x, pos.y, pos.width, pos.height);
		});
	}
}
