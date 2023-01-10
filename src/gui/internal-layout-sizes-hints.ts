import { Size, size } from 'fancy-canvas';

export interface InternalLayoutSizeHints {
	suggestChartSize(originalSize: Size): Size;
	suggestTimeScaleHeight(originalHeight: number): number;
	suggestPriceScaleWidth(originalWidth: number): number;
}

// on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
// For chart widget we decreases because we must be inside container.
// For time axis this is not important, since it just affects space for pane widgets
export class InternalLayoutSizeHintsKeepOdd implements InternalLayoutSizeHints {
	public suggestChartSize(originalSize: Size): Size {
		const integerWidth = Math.floor(originalSize.width);
		const integerHeight = Math.floor(originalSize.height);
		const width = integerWidth - integerWidth % 2;
		const height = integerHeight - integerHeight % 2;
		return size({ width, height });
	}

	public suggestTimeScaleHeight(originalHeight: number): number {
		return originalHeight + originalHeight % 2;
	}

	public suggestPriceScaleWidth(originalWidth: number): number {
		return originalWidth + originalWidth % 2;
	}
}
