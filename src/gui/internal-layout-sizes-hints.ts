import { Size } from './canvas-utils';

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
		const integerWidth = Math.floor(originalSize.w);
		const integerHeight = Math.floor(originalSize.h);
		const width = integerWidth - integerWidth % 2;
		const height = integerHeight - integerHeight % 2;
		return new Size(width, height);
	}

	public suggestTimeScaleHeight(originalHeight: number): number {
		return originalHeight + originalHeight % 2;
	}

	public suggestPriceScaleWidth(originalWidth: number): number {
		return originalWidth + originalWidth % 2;
	}
}

export class InternalLayoutSizeHintsKeepIriginal implements InternalLayoutSizeHints {
	public suggestChartSize(originalSize: Size): Size {
		return originalSize;
	}
	public suggestTimeScaleHeight(originalHeight: number): number {
		return originalHeight;
	}
	public suggestPriceScaleWidth(originalWidth: number): number {
		return originalWidth;
	}
}
