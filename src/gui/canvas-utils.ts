import {
	bindCanvasElementBitmapSizeTo,
	CanvasElementBitmapSizeBinding,
	Size,
} from 'fancy-canvas';

import { ensureNotNull } from '../helpers/assertions';

export function createBoundCanvas(parentElement: HTMLElement, size: Size): CanvasElementBitmapSizeBinding {
	const doc = ensureNotNull(parentElement.ownerDocument);
	const canvas = doc.createElement('canvas');
	parentElement.appendChild(canvas);

	const binding = bindCanvasElementBitmapSizeTo(canvas, {
		type: 'device-pixel-content-box',
		options: {
			allowResizeObserver: false,
		},
		transform: (bitmapSize: Size, canvasElementClientSize: Size) => ({
			width: Math.max(bitmapSize.width, canvasElementClientSize.width),
			height: Math.max(bitmapSize.height, canvasElementClientSize.height),
		}),
	});
	binding.resizeCanvasElement(size);
	return binding;
}

export function releaseCanvas(canvas: HTMLCanvasElement): void {
	// This function fixes the iOS Safari error "Total canvas memory use exceeds the maximum limit".
	// Seems that iOS Safari stores canvas elements for some additional time internally.
	// So if we create/destroy a lot of canvas elements in a short period of time we can get this error.
	// We resize the canvas to 1x1 pixels to force it to release memmory resources.
	canvas.width = 1;
	canvas.height = 1;
	canvas.getContext('2d')?.clearRect(0, 0, 1, 1);
}

/**
 * Chrome 124 - 126 have a bug where the canvas will become blank
 * if the user view different tabs and then returns to the tab containing
 * the chart.
 * It is enough to just draw a single transparent pixel on the canvas to 'revive' it.
 * https://issues.chromium.org/issues/328755781
 */
export function reviveCanvas(canvas: HTMLCanvasElement): void {
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		// Probably, this canvas is used for webgl
		return;
	}
	ctx.save();
	// Fully transparent
	ctx.fillStyle = '#0000';
	// Draw something
	ctx.fillRect(1, 1, 1, 1);
	ctx.restore();
}
