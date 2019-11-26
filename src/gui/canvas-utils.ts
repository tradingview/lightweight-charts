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

function getCanvasDevicePixelRatio(canvas: HTMLCanvasElement): number {
	return canvas.ownerDocument &&
		canvas.ownerDocument.defaultView &&
		canvas.ownerDocument.defaultView.devicePixelRatio
		|| 1;
}

export function getPrescaledContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const ctx = ensureNotNull(canvas.getContext('2d'));
	// scale by pixel ratio
	const pixelRatio = getCanvasDevicePixelRatio(canvas);
	ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	return ctx;
}

export function getPretransformedContext2D(binding: CanvasCoordinateSpaceBinding): CanvasRenderingContext2D {
	const ctx = ensureNotNull(binding.canvas.getContext('2d'));
	// scale by pixel ratio
	ctx.setTransform(binding.pixelRatio, 0, 0, binding.pixelRatio, 0, 0);
	ctx.translate(0.5, 0.5);
	return ctx;
}

export function clearRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clearColor: string): void {
	ctx.save();
	ctx.translate(-0.5, -0.5);
	ctx.globalCompositeOperation = 'copy';
	ctx.fillStyle = clearColor;
	ctx.fillRect(x, y, w, h);
	ctx.restore();
}

function createCanvas(doc: Document): HTMLCanvasElement {
	const canvas = doc.createElement('canvas');
	disableSelection(canvas);
	return canvas;
}

export function createPreconfiguredCanvas(doc: Document, size: Size): HTMLCanvasElement {
	const canvas = createCanvas(doc);

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
	const canvas = createCanvas(doc);
	parentElement.appendChild(canvas);

	const binding = bindToDevicePixelRatio(canvas);
	binding.resizeCanvas({
		width: size.w,
		height: size.h,
	});
	return binding;
}

function disableSelection(canvas: HTMLCanvasElement): void {
	canvas.style.userSelect = 'none';
	canvas.style.webkitUserSelect = 'none';
	canvas.style.msUserSelect = 'none';
	// tslint:disable-next-line:no-any
	(canvas as any).style.MozUserSelect = 'none';

	canvas.style.webkitTapHighlightColor = 'transparent';
}
