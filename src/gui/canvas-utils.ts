import {
	bindCanvasElementBitmapSizeTo,
	CanvasElementBitmapSizeBinding,
	size,
	Size,
} from 'fancy-canvas';

import { ensureNotNull } from '../helpers/assertions';

export function createBoundCanvas(parentElement: HTMLElement, canvasSize: Size): CanvasElementBitmapSizeBinding {
	const doc = ensureNotNull(parentElement.ownerDocument);
	const canvas = doc.createElement('canvas');
	parentElement.appendChild(canvas);

	const binding = bindCanvasElementBitmapSizeTo(canvas, {
		type: 'device-pixel-content-box',
		options: {
			allowResizeObserver: true,
		},
		transform: (bitmapSize: Size, canvasElementClientSize: Size) => canvasBitmapSize(bitmapSize, canvasElementClientSize, window.devicePixelRatio),
	});
	binding.resizeCanvasElement(canvasSize);
	return binding;
}

export function canvasBitmapSize(bitmapSize: Size, canvasElementClientSize: Size, pixelRatio: number): Size {
	// A canvas that is not rendered (e.g. in a hidden pane) reports a 0x0 box; predict it from the current ratio so it is sharp when shown.
	const observedSize = bitmapSize.width === 0 && bitmapSize.height === 0
		? size({
			width: Math.round(canvasElementClientSize.width * pixelRatio),
			height: Math.round(canvasElementClientSize.height * pixelRatio),
		})
		: bitmapSize;
	return size({
		width: Math.max(observedSize.width, canvasElementClientSize.width),
		height: Math.max(observedSize.height, canvasElementClientSize.height),
	});
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
