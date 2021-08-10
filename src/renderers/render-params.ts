import { CanvasElementBitmapSizeBinding, Size } from 'fancy-canvas';

export class CanvasRenderingParams {
	public readonly canvasElementClientSize: Size;
	public readonly bitmapSize: Size;

	public constructor(canvasElementClientSize: Size, bitmapSize: Size) {
		this.canvasElementClientSize = canvasElementClientSize;
		this.bitmapSize = bitmapSize;
	}

	public get horizontalPixelRatio(): number {
		return this.bitmapSize.width / this.canvasElementClientSize.width;
	}

	public get verticalPixelRatio(): number {
		return this.bitmapSize.height / this.canvasElementClientSize.height;
	}
}

export function getCanvasRenderingParams(binding: CanvasElementBitmapSizeBinding): CanvasRenderingParams {
	return new CanvasRenderingParams(binding.canvasElementClientSize, binding.bitmapSize);
}
