import {
	WatermarkAnchorPoint,
	WatermarkObjectFit,
	WatermarkPosition,
} from './options.js';

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** A source rectangle of the image and the destination rectangle it is drawn into. */
export interface ImagePlacement {
	source: Rect;
	dest: Rect;
}

export interface FitRectOptions {
	position: WatermarkPosition;
	objectFit: WatermarkObjectFit;
	padding: number;
	maxWidth: number | undefined;
	maxHeight: number | undefined;
}

export interface Size {
	width: number;
	height: number;
}

function clampFraction(value: number): number {
	if (!Number.isFinite(value)) {
		return 0.5;
	}
	return Math.min(1, Math.max(0, value));
}

/** The anchor as fractions of the free space, `0` (start) to `1` (end). */
export function anchorFractions(
	position: WatermarkPosition
): WatermarkAnchorPoint {
	switch (position) {
		case 'center':
			return { x: 0.5, y: 0.5 };
		case 'top-left':
			return { x: 0, y: 0 };
		case 'top-right':
			return { x: 1, y: 0 };
		case 'bottom-left':
			return { x: 0, y: 1 };
		case 'bottom-right':
			return { x: 1, y: 1 };
		default:
			return {
				x: clampFraction(position.x),
				y: clampFraction(position.y),
			};
	}
}

function scaleFor(
	objectFit: WatermarkObjectFit,
	image: Size,
	boxWidth: number,
	boxHeight: number
): number {
	switch (objectFit) {
		case 'none':
			return 1;
		case 'cover':
			return Math.max(boxWidth / image.width, boxHeight / image.height);
		default:
			return Math.min(boxWidth / image.width, boxHeight / image.height);
	}
}

/**
 * Places an image inside a pane. The drawing area is the pane inset by
 * `padding` and limited to `maxWidth` / `maxHeight`, positioned by `position`;
 * the image is scaled into it according to `objectFit` and anchored by the same
 * position. Anything outside the drawing area is cropped, so the watermark
 * never spills into the padding.
 *
 * Returns `null` when there is nothing to draw: an empty pane, an empty image,
 * or a drawing area which the padding has collapsed.
 */
export function fitRect(
	image: Size,
	pane: Size,
	options: FitRectOptions
): ImagePlacement | null {
	if (
		!(image.width > 0) ||
		!(image.height > 0) ||
		!(pane.width > 0) ||
		!(pane.height > 0)
	) {
		return null;
	}

	const padding = Math.max(0, options.padding);
	const availableWidth = pane.width - 2 * padding;
	const availableHeight = pane.height - 2 * padding;
	if (availableWidth <= 0 || availableHeight <= 0) {
		return null;
	}

	const boxWidth = Math.min(availableWidth, options.maxWidth ?? availableWidth);
	const boxHeight = Math.min(
		availableHeight,
		options.maxHeight ?? availableHeight
	);
	if (!(boxWidth > 0) || !(boxHeight > 0)) {
		return null;
	}

	const anchor = anchorFractions(options.position);
	const boxX = padding + (availableWidth - boxWidth) * anchor.x;
	const boxY = padding + (availableHeight - boxHeight) * anchor.y;

	const scale = scaleFor(options.objectFit, image, boxWidth, boxHeight);
	if (!Number.isFinite(scale) || scale <= 0) {
		return null;
	}

	const drawWidth = image.width * scale;
	const drawHeight = image.height * scale;
	const destX = boxX + (boxWidth - drawWidth) * anchor.x;
	const destY = boxY + (boxHeight - drawHeight) * anchor.y;

	const left = Math.max(destX, boxX);
	const top = Math.max(destY, boxY);
	const right = Math.min(destX + drawWidth, boxX + boxWidth);
	const bottom = Math.min(destY + drawHeight, boxY + boxHeight);
	if (right - left <= 0 || bottom - top <= 0) {
		return null;
	}

	return {
		source: {
			x: (left - destX) / scale,
			y: (top - destY) / scale,
			width: (right - left) / scale,
			height: (bottom - top) / scale,
		},
		dest: {
			x: left,
			y: top,
			width: right - left,
			height: bottom - top,
		},
	};
}
