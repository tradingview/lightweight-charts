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
