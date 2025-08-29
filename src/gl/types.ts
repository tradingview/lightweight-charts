export type WebGLLayerMode = 'off' | 'auto' | 'on';

export interface WebGLLayerOptions {
	mode: WebGLLayerMode;
	antialias: boolean;
	premultipliedAlpha: boolean;
	preserveDrawingBuffer: boolean;
	powerPreference: WebGLPowerPreference;
}

export interface ViewportSize {
	widthCssPx: number;
	heightCssPx: number;
	devicePixelRatio: number;
}

export interface ClipRectPx {
	xMin: number;
	yMin: number;
	xMax: number;
	yMax: number;
}

export interface IWebGLPaneContext {
	gl: WebGL2RenderingContext;
	viewport: ViewportSize;
	// 3x3 or 4x4 matrices encoded in Float32Array (column-major), consumers choose convention
	clipFromMedia: Float32Array;
	// clipFromTimePrice maps (time, price, 0, 1) to clip-space; constructed per-frame by library
	clipFromTimePrice: Float32Array;
	clipRect: ClipRectPx;
	requestRender(overlayOnly?: boolean): void;
	priceToY(price: number): number | null;
	timeToX(timeIndex: number): number | null;

	scaleInfo: {
		barSpacing: number;
		rightOffset: number;
		firstValue: number | null;
		dpr: number;
		widthCssPx: number;
		heightCssPx: number;
		visibleLeft: number;
		visibleRight: number;
	};
}
