import {
	bindCanvasElementBitmapSizeTo,
	CanvasElementBitmapSizeBinding,
	Size,
} from 'fancy-canvas';

import { ensureNotNull } from '../helpers/assertions';

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
	canvas.style.width = `${size.width}px`;
	canvas.style.height = `${size.height}px`;
	// ...but multiply coordinate space dimensions to device pixel ratio
	canvas.width = size.width * pixelRatio;
	canvas.height = size.height * pixelRatio;
	return canvas;
}

export function createBoundCanvas(parentElement: HTMLElement, size: Size): CanvasElementBitmapSizeBinding {
	const doc = ensureNotNull(parentElement.ownerDocument);
	const canvas = doc.createElement('canvas');
	parentElement.appendChild(canvas);

	const binding = bindCanvasElementBitmapSizeTo(canvas, { type: 'device-pixel-content-box' });
	binding.resizeCanvasElement(size);
	return binding;
}

export function drawScaled(ctx: CanvasRenderingContext2D, ratio: number, func: () => void): void {
	ctx.save();
	ctx.scale(ratio, ratio);
	func();
	ctx.restore();
}
