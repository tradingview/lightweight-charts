import { Binding as CanvasCoordinateSpaceBinding, bindToDevicePixelRatio } from 'fancy-canvas/coordinate-space';

import { ensureNotNull } from '../helpers/assertions';

export class Size {
	public h: number;
	public w: number;

	public constructor(w: number, h: number) {
		this.w = w;
		this.h = h;
	}

	public equals(size: Size): boolean {
		return (this.w === size.w) && (this.h === size.h);
	}
}

export function getCanvasDevicePixelRatio(canvas: HTMLCanvasElement): number {
	return canvas.ownerDocument &&
		canvas.ownerDocument.defaultView &&
		canvas.ownerDocument.defaultView.devicePixelRatio
		|| 1;
}

export function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const ctx = ensureNotNull(canvas.getContext('2d'));
	// sometimes (very often) ctx getContext returns the same context every time
	// and there might be previous transformation
	// so let's reset it to be sure that everything is ok
	// do no use resetTransform to respect Edge
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	return ctx;
}

export function createPreconfiguredCanvas(doc: Document, size: Size): HTMLCanvasElement {
	const canvas = doc.createElement('canvas');

	const pixelRatio = getCanvasDevicePixelRatio(canvas);
	// we should keep the layout size...
	canvas.style.width = `${size.w}px`;
	canvas.style.height = `${size.h}px`;
	// ...but multiply coordinate space dimensions to device pixel ratio
	canvas.width = size.w * pixelRatio;
	canvas.height = size.h * pixelRatio;
	return canvas;
}

export function createBoundCanvas(parentElement: HTMLElement, size: Size): CanvasCoordinateSpaceBinding {
	const doc = ensureNotNull(parentElement.ownerDocument);
	const canvas = doc.createElement('canvas');
	parentElement.appendChild(canvas);

	const binding = bindToDevicePixelRatio(canvas, { allowDownsampling: false });
	binding.resizeCanvas({
		width: size.w,
		height: size.h,
	});
	return binding;
}

export function drawScaled(ctx: CanvasRenderingContext2D, ratio: number, func: () => void): void {
	ctx.save();
	ctx.scale(ratio, ratio);
	func();
	ctx.restore();
}
