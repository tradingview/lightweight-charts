import { Size, size } from 'fancy-canvas';

// on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
// For chart widget we decrease the size because we must be inside container.
// For time axis this is not important, since it just affects space for pane widgets
export function suggestChartSize(originalSize: Size): Size {
	const integerWidth = Math.floor(originalSize.width);
	const integerHeight = Math.floor(originalSize.height);
	const width = integerWidth - (integerWidth % 2);
	const height = integerHeight - (integerHeight % 2);
	return size({ width, height });
}

export function suggestTimeScaleHeight(originalHeight: number): number {
	return originalHeight + (originalHeight % 2);
}

export function suggestPriceScaleWidth(originalWidth: number): number {
	return originalWidth + (originalWidth % 2);
}
